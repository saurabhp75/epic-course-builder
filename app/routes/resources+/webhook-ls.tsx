import crypto from 'crypto'
import { getPrice } from '@lemonsqueezy/lemonsqueezy.js'
import { type WebhookEvent, type Subscription, Prisma } from '@prisma/client'
import { type ActionFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/react'
import { prisma } from '#app/utils/db.server'
import { initLemon } from '#app/utils/lemon.server.js'

// This webhook listens to all events starting with "subscription_"
// 1. subscription_created
// 2. subscription_updated
// 3. subscription_cancelled
// 4. subscription_resumed
// 5. subscription_expired
// 6. subscription_paused
// 7. subscription_unpaused

export async function action({ request }: ActionFunctionArgs) {
	try {
		await validateEvent(request)
		return json('OK')
	} catch (err) {
		console.error({ err })
		return json({ message: 'Server error' }, { status: 500 })
	}
}

// Validate incoming LS event
export async function validateEvent(request: Request) {
	const rawBody = await request.text()

	const hmac = crypto.createHmac(
		'sha256',
		process.env.LEMON_SQUEEZY_WEBHOOK_SECRET,
	)
	const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8')
	const signature = Buffer.from(
		request.headers.get('X-Signature') ?? '',
		'utf8',
	)
	// make sure the request is from Lemon Squeezy.
	if (!crypto.timingSafeEqual(digest, signature)) {
		throw json('Invalid signature.', { status: 400 })
	}

	const data = JSON.parse(rawBody)

	// Type guard to check if the object has a 'meta' property.
	if (webhookHasMeta(data)) {
		const webhookEventId = await storeWebhookEvent(data.meta.event_name, data)

		// Non-blocking call to process the webhook event.
		processWebhookEvent(webhookEventId)
			.then((data) => console.log({ data }))
			.catch((e) => console.log('error in procesWebhookEvent', e))

		return json('OK', { status: 200 })
	}
	return json('Data invalid', { status: 400 })
}

/**
 * Store a webhook event in the db.
 * @param eventName - The name of the event.
 * @param body - The body of the event.
 */
export async function storeWebhookEvent(
	eventName: string,
	body: unknown, // TODO: WebhookEvent['body'],
) {
	try {
		const webhookEvent = await prisma.webhookEvent.create({
			data: {
				eventName,
				processed: false,
				body: JSON.stringify(body),
			},
		})
		return webhookEvent
	} catch (e) {
		if (e instanceof Prisma.PrismaClientKnownRequestError) {
			// The .code property can be accessed in a type-safe manner
			console.log(`Prisma Error code: ${e.code}`)
		}
		throw e
	}
}

// Process/update a webhook event in the db.
// TODO: Delete the event from db when not required
export async function processWebhookEvent(webhookEvent: WebhookEvent) {
	initLemon()

	const dbwebhookEvent = await prisma.webhookEvent.findFirst({
		where: {
			id: webhookEvent.id,
		},
	})

	if (!dbwebhookEvent) {
		throw new Error(
			`Webhook event #${webhookEvent.id} not found in the database.`,
		)
	}

	let processingError = ''
	const eventBody = JSON.parse(webhookEvent.body)

	if (!webhookHasMeta(eventBody)) {
		processingError = "Event body is missing the 'meta' property."
	} else if (webhookHasData(eventBody)) {
		if (webhookEvent.eventName.startsWith('subscription_payment_')) {
			// TODO: Save subscription invoices; eventBody is a
			// SubscriptionInvoice
		} else if (webhookEvent.eventName.startsWith('subscription_')) {
			// Save subscription events; obj is a Subscription
			const attributes = eventBody.data.attributes
			const variantId = attributes.variant_id as string

			// We assume that the Plan table is up to date.
			const plan = await prisma.plan.findFirst({
				select: { id: true },
				where: { variantId: parseInt(variantId, 10) },
			})

			if (!plan) {
				processingError = `Plan with variantId ${variantId} not found.`
			} else {
				// Update the subscription in the database.
				const priceId = attributes.first_subscription_item.price_id

				// Get the price data from Lemon Squeezy.
				const priceData = await getPrice(priceId)
				if (priceData.error) {
					processingError = `Failed to get the price data for the subscription ${eventBody.data.id}.`
				}

				const isUsageBased = attributes.first_subscription_item.is_usage_based
				const price = isUsageBased
					? priceData.data?.data.attributes.unit_price_decimal
					: priceData.data?.data.attributes.unit_price

				const updateData: Omit<Subscription, 'id'> = {
					lemonSqueezyId: eventBody.data.id,
					orderId: attributes.order_id as number,
					name: attributes.user_name as string,
					email: attributes.user_email as string,
					status: attributes.status as string,
					statusFormatted: attributes.status_formatted as string,
					renewsAt: attributes.renews_at as string,
					endsAt: attributes.ends_at as string,
					trialEndsAt: attributes.trial_ends_at as string,
					price: price?.toString() ?? '',
					isPaused: false,
					subscriptionItemId: attributes.first_subscription_item.id.toString(),
					isUsageBased: attributes.first_subscription_item.is_usage_based,
					userId: eventBody.meta.custom_data.user_id,
					planId: plan.id,
				}

				// Create/update subscription in the database.
				try {
					await prisma.subscription.upsert({
						where: { lemonSqueezyId: updateData.lemonSqueezyId },
						create: updateData,
						update: updateData,
					})
				} catch (error) {
					processingError = `Failed to upsert Subscription #${updateData.lemonSqueezyId} to the database.`
					console.error(error)
				}
			}
		} else if (webhookEvent.eventName.startsWith('order_')) {
			// TODO: Save orders; eventBody is a "Order"
		} else if (webhookEvent.eventName.startsWith('license_')) {
			// TODO: Save license keys; eventBody is a "License key"
		}

		// Update the webhook event in the database.
		await prisma.webhookEvent.update({
			where: { id: webhookEvent.id },
			data: { ...webhookEvent, processed: true, processingError },
		})
	}
}

/**
 * Typeguard to check if the object has a 'meta' property
 * and that the 'meta' property has the correct shape.
 */
export function webhookHasMeta(obj: unknown): obj is {
	meta: {
		event_name: string
		custom_data: {
			user_id: string
		}
	}
} {
	if (
		isObject(obj) &&
		isObject(obj.meta) &&
		typeof obj.meta.event_name === 'string' &&
		isObject(obj.meta.custom_data) &&
		typeof obj.meta.custom_data.user_id === 'string'
	) {
		return true
	}
	return false
}

/**
 * Check if the value is an object.
 */
function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null
}

/**
 * Typeguard to check if the object has a 'data' property and the correct shape.
 *
 * @param obj - The object to check.
 * @returns True if the object has a 'data' property.
 */
export function webhookHasData(obj: unknown): obj is {
	data: {
		attributes: Record<string, unknown> & {
			first_subscription_item: {
				id: number
				price_id: number
				is_usage_based: boolean
			}
		}
		id: string
	}
} {
	return (
		isObject(obj) &&
		'data' in obj &&
		isObject(obj.data) &&
		'attributes' in obj.data
	)
}
