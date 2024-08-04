import crypto from 'crypto'
import { invariant } from '@epic-web/invariant'
import {
	type Variant,
	type ListProducts,
	type ListVariants,
	type ListPrices,
	type ListSubscriptions,
	lemonSqueezySetup,
	listPrices,
	listProducts,
	createCheckout,
	getPrice,
	listSubscriptions,
	updateSubscription,
	cancelSubscription,
	getSubscription,
	getLicenseKey,
} from '@lemonsqueezy/lemonsqueezy.js'
import {
	type WebhookEvent,
	type Plan,
	type User,
	Prisma,
} from '@prisma/client'
import { json } from '@remix-run/react'

import { prisma } from '#app/utils/db.server'
import { getUserId, getUserIdAndEmail } from './auth.server'
import { getDomainUrl } from './misc'

export function initLemon() {
	lemonSqueezySetup({ apiKey: process.env.LEMON_SQUEEZY_API_KEY })
}

// Get all subscriptions for the user
export async function getUserSubscriptions(request: Request) {
	const userId = await getUserId(request)

	invariant(userId, 'User not found')

	const userSubscriptions = await prisma.subscription.findMany({
		where: { userId: userId },
	})

	return userSubscriptions
}

const subscriptionInclude = {
	plan: true,
	user: true,
} satisfies Prisma.SubscriptionInclude
export type SubscriptionPayload = Prisma.SubscriptionGetPayload<{
	include: typeof subscriptionInclude
}>

export async function retriveSubscription(userId: User['id']) {
	// Gets the most recent subscription
	return await prisma.subscription.findFirst({
		where: {
			userId: userId,
		},
		include: subscriptionInclude,
		orderBy: {
			lemonSqueezyId: 'desc',
		},
	})
}

// Helper function to add a variant to the productVariants
// array and sync it with the database.
async function _addVariant(variant: Omit<Plan, 'id'>, productVariants: Plan[]) {
	console.log(`Syncing variant ${variant.name} with the database...`)

	// Sync the variant with the plan in the database.
	const newUpdatedPlan = await prisma.plan.upsert({
		where: { variantId: variant.variantId },
		create: variant,
		update: variant,
	})

	console.log(`${variant.name} synced with the database...`)

	productVariants.push(newUpdatedPlan)
}

// Get ALL products and variants from a store with a given storeId
async function getProductsAndVariants(storeId: string) {
	let hasNextPage = true
	let page = 1
	let products = [] as ListProducts['data'] // (internally ProductData[])
	let variants = [] as ListVariants['data'] // (internally VariantData[])

	while (hasNextPage) {
		// Fetch products and variants  from the Lemon Squeezy store.
		const { statusCode, error, data } = await listProducts({
			filter: { storeId },
			include: ['variants'],
			page: { number: page, size: 10 },
		})

		if (!data) continue

		invariant(!error, `error in listProducts() code: ${statusCode}`)

		products = products.concat(data['data'])
		variants = variants.concat(data['included'] as Variant['data'][])

		if (data['meta']['page']['lastPage'] > page) {
			page += 1
		} else {
			hasNextPage = false
		}
	}

	return { products, variants }
}

// Get the prices for Variants List
async function variantsPrice(variants: ListVariants['data']) {
	// get all the variantIds
	const variantIDs = variants.map((variant) => variant.id)
	// Fetch the variants' Price objects in parallel
	const priceRequests = variantIDs.map((vid) =>
		listPrices({
			filter: {
				variantId: vid,
			},
		}),
	)

	// Object with priceId as key and priceData as value
	const prices = {} as Record<string, ListPrices['data'][number]['attributes']>
	// Execute the fetch requests in parallel using Promise.all()
	try {
		// todo replace with promise.allSettled()
		const variantPrices = await Promise.all(priceRequests)
		for (const variantPrice of variantPrices) {
			if (variantPrice.error) {
				continue
			}
			// Nest prices inside variants
			const priceData = variantPrice.data?.data[0]
			if (!priceData) {
				// TODO do some extra error handling
				continue
			}
			prices[priceData.attributes.variant_id.toString()] = priceData.attributes
		}
	} catch (error) {
		console.log('error occured in promise.all', error)
	}

	return prices
}

type PriceListType = Awaited<ReturnType<typeof variantsPrice>>

// Nest related products and prices in variants
function nestProductsAndPricesInVariants({
	products,
	variants,
	prices,
}: {
	products: ListProducts['data']
	variants: ListVariants['data']
	prices: PriceListType
}) {
	// Object with productId as key and productData as value
	const prods = {} as Record<string, ListProducts['data'][number]['attributes']>

	for (const product of products) {
		prods[product['id']] = product['attributes']
	}

	return variants.map((variant) => {
		return {
			...variant,
			// data of the related product
			product: prods[variant['attributes']['product_id']],
			price: prices[variant.id],
		}
	})
}

function variantsInAProduct(variants: ListVariants['data']) {
	return variants.reduce(
		(acc, variant) => {
			const productKey = variant['attributes']['product_id'].toString()
			const existingProduct = acc.hasOwnProperty(productKey)
			// @ts-ignore
			const currentCount = existingProduct ? ++acc[productKey] : 1
			return { ...acc, [productKey]: currentCount }
		},
		{} as Record<string, number>,
	)
}

/**
 * This action will sync the product variants from Lemon Squeezy with the
 * Plans database model. It will only sync the valid(published) and
 * 'subscription' variants.
 */
export async function syncPlans() {
	// Initialize API-client SDK
	initLemon()

	// Get products and their variants
	const { products, variants } = await getProductsAndVariants('TODO: Fix this')

	// Get variants' prices
	const prices = await variantsPrice(variants)

	// Create an object with productId as keys and count of variants as values
	// This keeps track of the no. of variants each product have
	const productVariantCount = variantsInAProduct(variants)

	// Nest related prices and products under variants
	const variantsWithProductPrice = nestProductsAndPricesInVariants({
		products,
		variants,
		prices,
	})

	// Contains all the plans
	let productVariants: Plan[] = []
	for (const variant of variantsWithProductPrice) {
		if (!variant.attributes.is_subscription) {
			console.log('Not a subscription')
			continue
		}

		try {
			if (
				variant.attributes.status === 'draft' ||
				// @ts-ignore (Add try catch to handle this)
				(productVariantCount[variant.attributes.product_id] > 1 &&
					variant.attributes.status === 'pending')
			) {
				// Skip draft variants or if there's more than one variant, skip the default
				// variant. See https://docs.lemonsqueezy.com/api/variants
				console.log('Inside default variant')
				continue
			}
		} catch (e) {
			console.log('error in syncPlans', e)
		}

		const currentPriceObj = variant.price
		const isUsageBased = currentPriceObj?.usage_aggregation !== null
		const interval = currentPriceObj?.renewal_interval_unit
		const intervalCount = currentPriceObj?.renewal_interval_quantity
		const trialInterval = currentPriceObj?.trial_interval_unit
		const trialIntervalCount = currentPriceObj?.trial_interval_quantity

		const price = isUsageBased
			? currentPriceObj?.unit_price_decimal
			: currentPriceObj.unit_price

		const priceString = price !== null ? price?.toString() ?? '' : ''

		const isSubscription = currentPriceObj?.category === 'subscription'

		// If not a subscription, skip it.
		if (!isSubscription) {
			continue
		}

		await _addVariant(
			{
				name: variant.attributes.name,
				description: variant.attributes.description,
				price: priceString,
				interval: interval ? interval : null,
				intervalCount: intervalCount ? intervalCount : null,
				isUsageBased,
				productId: variant.attributes.product_id,
				productName: variant.product?.name ?? null,
				variantId: parseInt(variant.id) as unknown as number,
				trialInterval: trialInterval ? (trialInterval as string) : null,
				trialIntervalCount: trialIntervalCount ? trialIntervalCount : null,
				sort: variant.attributes.sort,
			},
			productVariants,
		)
	}

	return productVariants
}

export async function getAllPlans() {
	return await prisma.plan.findMany()
}

/**
 * This function will create a checkout on Lemon Squeezy.
 */

// Get ALL products and variants from a given store
// This assumes that user's email address is same in
// user's profile and subsription data.
async function getUserSubscriptionList(userEmail: string) {
	initLemon()
	let hasNextPage = true
	let page = 1
	let userSubs = [] as ListSubscriptions['data'] // (internally SubscriptionData[])

	// userEmail = 'saurabhp75@gmail.com'

	while (hasNextPage) {
		// Fetch subscriptions for the user from LS store
		console.log(`in the loop, Page#${page}`)

		const { statusCode, error, data } = await listSubscriptions({
			filter: {
				storeId: process.env.LEMON_SQUEEZY_STORE_ID,
				userEmail: userEmail,
			},
			page: { number: page, size: 10 },
		})

		invariant(!error, `error in listSubscriptions() code: ${statusCode}`)

		if (!data) continue

		userSubs = userSubs.concat(data['data'])

		if (data['meta']['page']['lastPage'] > page) {
			page += 1
		} else {
			hasNextPage = false
		}
	}

	return userSubs
}

async function getPlanFromSubscription(
	subs: ListSubscriptions['data'][number],
) {
	// find the relavant record from Plan table
	const currentPlan = await prisma.plan.findFirst({
		select: { price: true, isUsageBased: true, variantId: true },
		where: { variantId: subs.attributes.variant_id },
	})

	invariant(currentPlan, 'plan for the subscription not found')

	return { currentPlan }
}

async function clearSubscriptionData() {
	try {
		// clear ALL subscription data
		await prisma.subscription.deleteMany()
	} catch (error) {
		console.log(error)
		throw json('error deleting subscription data')
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function clearPlanData() {
	try {
		// clear ALL subscription data
		await prisma.plan.deleteMany()
	} catch (error) {
		console.log(error)
		throw json('error deleting plan data')
	}
}

type CurrentPlanInfo = {
	variantId: number
	price: string
	isUsageBased: boolean
}
async function getPlansforSubsList(subsList: ListSubscriptions['data']) {
	let userPlans = {} as Record<string, CurrentPlanInfo>

	for (const subs of subsList) {
		const subscriptionVariantId = subs.attributes.variant_id

		// get relevant info from Plan table
		// TODO: Change this to promise.all()
		if (!(subscriptionVariantId in userPlans)) {
			userPlans[subscriptionVariantId] = (
				await getPlanFromSubscription(subs)
			).currentPlan
		}
	}

	return userPlans
}

// Sync user subscription info from LS, this function should be
// called after you have synced the plans using syncPlans()
export async function syncSubscriptions(request: Request) {
	const userId = await getUserIdAndEmail(request)

	invariant(userId && userId.userEmail, 'userId/email does not exists')

	// clear db subscriptions data
	await clearSubscriptionData()

	// Get user subscription list from LS
	const subsList = await getUserSubscriptionList(userId.userEmail)

	// Get relevant plans from db
	const userPlans = await getPlansforSubsList(subsList)

	for (const subs of subsList) {
		invariant(
			subs.attributes.first_subscription_item,
			'first_subscription_item not found',
		)

		const subscriptionVariantId = subs.attributes.variant_id

		// Create subscription in db
		await prisma.subscription.create({
			data: {
				lemonSqueezyId: subs.id, // eventBody.data.id,
				orderId: subs.attributes.order_id,
				name: subs.attributes.user_name,
				email: subs.attributes.user_email,
				status: subs.attributes.status,
				statusFormatted: subs.attributes.status_formatted,
				renewsAt: subs.attributes.renews_at,
				endsAt: subs.attributes.ends_at,
				trialEndsAt: subs.attributes.trial_ends_at,
				price: userPlans[subscriptionVariantId]?.price ?? '',
				isUsageBased: userPlans[subscriptionVariantId]?.isUsageBased,
				isPaused: subs.attributes.pause ? true : false,
				subscriptionItemId:
					subs.attributes.first_subscription_item.id.toString(),
				plan: {
					connect: { variantId: userPlans[subscriptionVariantId]?.variantId },
				},

				user: {
					connect: { email: userId.userEmail },
				},
			},
		})
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
 * This function will store a webhook event in the database.
 * @param eventName - The name of the event.
 * @param body - The body of the event.
 */
// export async function storeWebhookEvent(
// 	eventName: string,
// 	body: WebhookEvent['body'],
// ) {
// 	if (!process.env.POSTGRES_URL) {
// 		throw new Error('POSTGRES_URL is not set')
// 	}

// 	// .onConflictDoNothing({ target: plans.id }) ???
// 	const webhookEvent = await prisma.webhookEvent.create({
// 		data: { body, eventName, processed: false },
// 	})

// 	return webhookEvent
// }

/**
 * This action will process a webhook event in the database.
 */
export async function processWebhookEvent(webhookEvent: WebhookEvent) {
	initLemon()

	const dbwebhookEvent = await prisma.webhookEvent.findMany({
		where: { id: webhookEvent.id },
	})

	if (dbwebhookEvent.length < 1) {
		throw new Error(
			`Webhook event #${webhookEvent.id} not found in the database.`,
		)
	}

	let processingError = ''
	const eventBody = webhookEvent.body

	if (!webhookHasMeta(eventBody)) {
		processingError = "Event body is missing the 'meta' property."
	} else if (webhookHasData(eventBody)) {
		if (webhookEvent.eventName.startsWith('subscription_payment_')) {
			// Save subscription invoices; eventBody is a SubscriptionInvoice
			// Not implemented.
		} else if (webhookEvent.eventName.startsWith('subscription_')) {
			// Save subscription events; obj is a Subscription
			const attributes = eventBody.data.attributes
			const variantId = attributes.variant_id as string

			// We assume that the Plan table is up to date.
			const plan = await prisma.plan.findMany({
				where: { variantId: parseInt(variantId) },
			})

			if (plan.length < 1) {
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

				const updateData = {
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
					planId: plan[0]?.id ?? '',
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
			// Save orders; eventBody is a "Order"
			/* Not implemented */
		} else if (webhookEvent.eventName.startsWith('license_')) {
			// Save license keys; eventBody is a "License key"
			/* Not implemented */
		}

		// Update the webhook event in the database.
		await prisma.webhookEvent.update({
			where: { id: webhookEvent.id },
			data: {
				processed: true,
				processingError,
			},
		})
	}
}

export async function pauseUserSubscription(subsId: string) {
	initLemon()

	// Get user subscriptions
	const subscription = await prisma.subscription.findMany({
		where: { lemonSqueezyId: subsId },
	})

	// Check if the subscription exists
	if (!subscription) {
		throw new Error(`Subscription #${subsId} not found.`)
	}

	const {
		statusCode,
		error,
		data: returnedSub,
	} = await updateSubscription(subsId, {
		pause: {
			mode: 'void',
		},
	})

	if (error) {
		return json(error, { status: statusCode as number })
	}

	invariant(returnedSub, 'returnedSub is null')

	// Update the db
	try {
		await prisma.subscription.update({
			where: { lemonSqueezyId: subsId },
			data: {
				status: returnedSub.data.attributes.status,
				statusFormatted: returnedSub.data.attributes.status_formatted,
				endsAt: returnedSub.data.attributes.ends_at,
				isPaused: returnedSub.data.attributes.pause !== null,
			},
		})
	} catch (error) {
		console.log(error)
		throw new Error(`Failed to pause Subscription #${subsId} in the database.`)
	}

	return json(returnedSub)
}

export async function unpauseUserSubscription(subsId: string) {
	initLemon()

	// Get user subscriptions
	const subscription = await prisma.subscription.findMany({
		where: { lemonSqueezyId: subsId },
	})

	// Check if the subscription exists
	if (!subscription) {
		throw new Error(`Subscription #${subsId} not found.`)
	}

	const {
		statusCode,
		error,
		data: returnedSub,
	} = await updateSubscription(subsId, {
		pause: null,
	})

	if (error) {
		return json(error, { status: statusCode as number })
	}

	invariant(returnedSub, 'returnedSub is null')

	// Update db
	try {
		await prisma.subscription.update({
			where: { lemonSqueezyId: subsId },
			data: {
				status: returnedSub.data.attributes.status,
				statusFormatted: returnedSub.data.attributes.status_formatted,
				endsAt: returnedSub.data.attributes.ends_at,
				isPaused: returnedSub.data.attributes.pause !== null,
			},
		})
	} catch (error) {
		console.log(error)
		throw new Error(
			`Failed to unpause Subscription #${subsId} in the database.`,
		)
	}

	return json(returnedSub)
}

export async function cancelSub(subsId: string) {
	initLemon()

	// Get user subscriptions
	const subscription = await prisma.subscription.findMany({
		where: { lemonSqueezyId: subsId },
	})

	// Check if the subscription exists
	if (!subscription) {
		throw new Error(`Subscription #${subsId} not found.`)
	}

	const {
		statusCode,
		error,
		data: cancelledSub,
	} = await cancelSubscription(subsId)

	if (error) {
		return json(error, { status: statusCode as number })
	}

	invariant(cancelledSub, 'cancelledSub is null')

	// Update db
	try {
		await prisma.subscription.update({
			where: { lemonSqueezyId: subsId },
			data: {
				status: cancelledSub.data.attributes.status,
				statusFormatted: cancelledSub.data.attributes.status_formatted,
				endsAt: cancelledSub.data.attributes.ends_at,
			},
		})
	} catch (error) {
		console.log(error)
		throw new Error(`Failed to cancel Subscription #${subsId} in the database.`)
	}

	return json(cancelledSub)
}

export async function resumeSub(subsId: string) {
	initLemon()

	// Get user subscriptions
	const subscription = await prisma.subscription.findMany({
		where: { lemonSqueezyId: subsId },
	})

	// Check if the subscription exists
	if (!subscription) {
		throw new Error(`Subscription #${subsId} not found.`)
	}

	const {
		statusCode,
		error,
		data: resumedSub,
	} = await updateSubscription(subsId, { cancelled: false })

	if (error) {
		return json(error, { status: statusCode as number })
	}

	invariant(resumedSub, 'resumedSub is null')

	// Update db
	try {
		await prisma.subscription.update({
			where: { lemonSqueezyId: subsId },
			data: {
				status: resumedSub.data.attributes.status,
				statusFormatted: resumedSub.data.attributes.status_formatted,
				endsAt: null,
			},
		})
	} catch (error) {
		console.log(error)
		throw new Error(`Failed to resume Subscription #${subsId} in the database.`)
	}

	return json(resumedSub)
}

export async function createCheckoutUrl({
	request,
	formData,
}: {
	request: Request
	formData: FormData
}) {
	initLemon()
	const domainUrl = getDomainUrl(request)
	// const userId = formData.get('userId')?.toString()
	const variant = formData.get('variantId')?.toString()
	invariant(variant, 'variant not found in createCheckout form')

	const variantId = variant === 'Starter' ? '438424' : '438426'

	const { userId, userEmail, name } = await getUserIdAndEmail(request)

	// invariant(userEmail, 'user email not found')

	const { statusCode, error, data } = await createCheckout(
		process.env.LEMON_SQUEEZY_STORE_ID,
		variantId,
		{
			checkoutOptions: {
				embed: true,
				media: false,
				logo: true, // TODO Add a logo
			},
			checkoutData: {
				email: userEmail,
				name: name ? name : undefined,
				custom: {
					user_id: userId,
				},
			},
			productOptions: {
				enabledVariants: [parseInt(variantId)],
				redirectUrl: `${domainUrl}/billing/`,
				receiptButtonText: 'Go to Dashboard',
				receiptThankYouNote: `Thank you for purchasing ${variantId}!`,
			},
		},
	)

	if (error) {
		console.dir({ statusCode })
		return json('Error in createCheckout API', { status: 500 })
	}

	console.dir({ statusCode })

	const url = data.data.attributes.url
	invariant(url, 'checkoutUrl not found')
	console.log('url:', url)

	return url
}

export async function changePlan({
	subsId, // current subscriptionId
	newVariantId,
}: {
	subsId: string
	newVariantId: number
}) {
	initLemon()

	// Get LS-subscriptionId from db
	const subscription = await prisma.subscription.findFirst({
		select: { lemonSqueezyId: true },
		where: { id: subsId },
	})

	invariant(subscription, `subscription with id:${subsId} not found`)

	// Get the new plan details(price) from the db.
	const newPlan = await prisma.plan.findFirst({
		select: { id: true, price: true },
		where: { variantId: newVariantId },
	})

	invariant(newPlan, `Plan with variantId:${newVariantId} not found`)

	// Send request to Lemon Squeezy to change the subscription.
	const {
		statusCode,
		error,
		data: updatedSub,
	} = await updateSubscription(subscription.lemonSqueezyId, {
		variantId: newVariantId,
	})

	if (error) {
		return json(error, { status: statusCode as number })
	}

	invariant(updatedSub, 'updatedSub is null')

	// Update db
	try {
		await prisma.subscription.update({
			// where: { lemonSqueezyId: subscription.lemonSqueezyId },
			where: { lemonSqueezyId: updatedSub.data.id },
			data: {
				plan: { connect: { id: newPlan.id } },
				price: newPlan.price,
				endsAt: updatedSub.data.attributes.ends_at,
			},
		})
	} catch (error) {
		if (error instanceof Error) {
			console.log({ error })
		}
		throw new Error(`Failed to update Subscription #${subsId} in db.`)
	}

	return json(updatedSub)
}

export async function syncProducts() {
	// Initialize API-client SDK
	initLemon()

	// Get products and their variants for the store
	const { products, variants } = await getProductsAndVariants(
		process.env.LEMON_SQUEEZY_STORE_ID,
	)

	const prices = await variantsPrice(variants)
	const productVariantCount = variantsInAProduct(variants)

	// Nest related prices and products under variants
	const variantsWithProductPrice = nestProductsAndPricesInVariants({
		products,
		variants,
		prices,
	})

	// Contains all the plans/variants
	let productVariants: Plan[] = []
	for (const variant of variantsWithProductPrice) {
		// Skip draft variants or if there's more than one variant, skip the default
		// variant. See https://docs.lemonsqueezy.com/api/variants
		try {
			if (
				variant.attributes.status === 'draft' ||
				// @ts-ignore (Add try catch to handle this)
				(productVariantCount[variant.attributes.product_id] > 1 &&
					variant['attributes']['status'] === 'pending')
			) {
				console.log('Inside default variant')
				continue
			}
		} catch (e) {
			console.log('error in syncPlans', e)
		}

		const currentPriceObj = variant.price
		const isUsageBased = currentPriceObj?.usage_aggregation !== null
		const interval = currentPriceObj?.renewal_interval_unit
		const intervalCount = currentPriceObj?.renewal_interval_quantity
		const trialInterval = currentPriceObj?.trial_interval_unit
		const trialIntervalCount = currentPriceObj?.trial_interval_quantity

		const price = isUsageBased
			? currentPriceObj?.unit_price_decimal
			: currentPriceObj.unit_price

		const priceString = price !== null ? price?.toString() ?? '' : ''

		await _addVariant(
			{
				name: variant.attributes.name,
				description: variant['attributes']['description'],
				price: priceString,
				interval: interval ? interval : null,
				intervalCount: intervalCount ? intervalCount : null,
				isUsageBased,
				productId: variant['attributes']['product_id'],
				productName: variant.product?.name ?? null,
				variantId: parseInt(variant.id) as unknown as number,
				trialInterval: trialInterval ? (trialInterval as string) : null,
				trialIntervalCount: trialIntervalCount ? trialIntervalCount : null,
				sort: variant.attributes.sort,
			},
			productVariants,
		)
	}

	return productVariants
}

/**
 * Get the subscription URLs (update_payment_method and
 * customer_portal) for the given subscription ID.
 */
export async function getSubscriptionURLs(subsId: string) {
	initLemon()
	const subscription = await getSubscription(subsId)

	// ToDo: Use invariant here?
	if (subscription.error) {
		throw new Error(subscription.error.message)
	}

	return subscription.data?.data.attributes.urls
}

export async function getLicenseDetails(licenseKeyId: number) {
	const {
		statusCode,
		error,
		data: licenseData,
	} = await getLicenseKey(licenseKeyId, {
		include: ['order'],
	})

	if (error) {
		return json(error, { status: statusCode as number })
	}

	invariant(licenseData, 'licenseData is null')

	return licenseData
}

/**
 * Store a webhook event in the db.
 * @param eventName - The name of the event.
 * @param body - The body of the event.
 */
async function storeWebhookEvent(
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
// export async function processWebhookEvent(webhookEvent: WebhookEvent) {
// 	initLemon()

// 	const dbwebhookEvent = await prisma.webhookEvent.findFirst({
// 		where: {
// 			id: webhookEvent.id,
// 		},
// 	})

// 	if (!dbwebhookEvent) {
// 		throw new Error(
// 			`Webhook event #${webhookEvent.id} not found in the database.`,
// 		)
// 	}

// 	let processingError = ''
// 	const eventBody = JSON.parse(webhookEvent.body)

// 	if (!webhookHasMeta(eventBody)) {
// 		processingError = "Event body is missing the 'meta' property."
// 	} else if (webhookHasData(eventBody)) {
// 		if (webhookEvent.eventName.startsWith('subscription_payment_')) {
// 			// TODO: Save subscription invoices; eventBody is a
// 			// SubscriptionInvoice
// 		} else if (webhookEvent.eventName.startsWith('subscription_')) {
// 			// Save subscription events; obj is a Subscription
// 			const attributes = eventBody.data.attributes
// 			const variantId = attributes.variant_id as string

// 			// We assume that the Plan table is up to date.
// 			const plan = await prisma.plan.findFirst({
// 				select: { id: true },
// 				where: { variantId: parseInt(variantId, 10) },
// 			})

// 			if (!plan) {
// 				processingError = `Plan with variantId ${variantId} not found.`
// 			} else {
// 				// Update the subscription in the database.
// 				const priceId = attributes.first_subscription_item.price_id

// 				// Get the price data from Lemon Squeezy.
// 				const priceData = await getPrice(priceId)
// 				if (priceData.error) {
// 					processingError = `Failed to get the price data for the subscription ${eventBody.data.id}.`
// 				}

// 				const isUsageBased = attributes.first_subscription_item.is_usage_based
// 				const price = isUsageBased
// 					? priceData.data?.data.attributes.unit_price_decimal
// 					: priceData.data?.data.attributes.unit_price

// 				const updateData: Omit<Subscription, 'id'> = {
// 					lemonSqueezyId: eventBody.data.id,
// 					orderId: attributes.order_id as number,
// 					name: attributes.user_name as string,
// 					email: attributes.user_email as string,
// 					status: attributes.status as string,
// 					statusFormatted: attributes.status_formatted as string,
// 					renewsAt: attributes.renews_at as string,
// 					endsAt: attributes.ends_at as string,
// 					trialEndsAt: attributes.trial_ends_at as string,
// 					price: price?.toString() ?? '',
// 					isPaused: false,
// 					subscriptionItemId: attributes.first_subscription_item.id.toString(),
// 					isUsageBased: attributes.first_subscription_item.is_usage_based,
// 					userId: eventBody.meta.custom_data.user_id,
// 					planId: plan.id,
// 				}

// 				// Create/update subscription in the database.
// 				try {
// 					await prisma.subscription.upsert({
// 						where: { lemonSqueezyId: updateData.lemonSqueezyId },
// 						create: updateData,
// 						update: updateData,
// 					})
// 				} catch (error) {
// 					processingError = `Failed to upsert Subscription #${updateData.lemonSqueezyId} to the database.`
// 					console.error(error)
// 				}
// 			}
// 		} else if (webhookEvent.eventName.startsWith('order_')) {
// 			// TODO: Save orders; eventBody is a "Order"
// 		} else if (webhookEvent.eventName.startsWith('license_')) {
// 			// TODO: Save license keys; eventBody is a "License key"
// 		}

// 		// Update the webhook event in the database.
// 		await prisma.webhookEvent.update({
// 			where: { id: webhookEvent.id },
// 			data: { ...webhookEvent, processed: true, processingError },
// 		})
// 	}
// }

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

// async function getOrdersLicenses() {
// 	// Initialize API-client SDK
// 	initLemon()

// 	let hasNextPage = true
// 	let page = 1
// 	let licenses = [] as ListLicenseKeys['data'] // (internally LicenseKeyData[])
// 	let orders = [] as ListOrders['data'] // (internally OrderData[])
// 	let orderItems = [] as ListOrderItems['data'] // (internally OrderItemData[])
// 	let instances = [] as ListLicenseKeyInstances['data'] // (internally LicenseKeyInstanceData[])

// 	while (hasNextPage) {
// 		// Fetch orders from Lemon Squeezy store.
// 		const { statusCode, error, data } = await listLicenseKeys({
// 			filter: { storeId: process.env.LEMON_SQUEEZY_STORE_ID },
// 			page: { number: page, size: 10 },
// 			// include: ['license-key-instances'],
// 			include: ['order', 'license-key-instances', 'order-item'],
// 		})

// 		if (!data) continue

// 		// console.dir(data)

// 		invariant(!error, `error in listLicenseKeys() code: ${statusCode}`)

// 		licenses = licenses.concat(data['data'])
// 		orders = orders.concat(
// 			data['included']?.filter(
// 				(item) => item.type === 'orders',
// 			) as Order['data'][],
// 		)
// 		orderItems = orderItems.concat(
// 			data['included']?.filter(
// 				(item) => item.type === 'order-items',
// 			) as OrderItem['data'][],
// 		)
// 		instances = instances.concat(
// 			data['included']?.filter(
// 				(item) => item.type === 'license-key-instances', // Check this???
// 			) as LicenseKeyInstance['data'][],
// 		)

// 		if (data['meta']['page']['lastPage'] > page) {
// 			page += 1
// 		} else {
// 			hasNextPage = false
// 		}
// 	}

// 	return { licenses, orders, orderItems, instances }
// }

// export async function syncPurchases({ userId }: { userId: string }) {
// 	const { licenses, orders } = await getOrdersLicenses()

// 	// console.log('%^@@!%#^!&^&$RE%')
// 	// console.dir(licenses[0])
// 	// console.dir(orders[0])
// 	// console.dir(orderItems[0])
// 	// console.dir(instances[0])
// 	// console.log('%^@@!%#^!&^&$RE%')

// 	const purchases = [] as OneTimePurchase[]

// 	for (const order of orders) {
// 		// Sync the variant with the plan in the database.
// 		// Note: For linking purchases with the user, we are assuming
// 		// the user has entered the same email while purchasing as in
// 		// his user profile
// 		const newPurchase = await prisma.oneTimePurchase
// 			.upsert({
// 				where: { lemonSqueezyId: order.id },
// 				create: {
// 					lemonSqueezyId: order.id, // order.attributes.first_order_item.order_id
// 					orderId: order.attributes.first_order_item.id,
// 					name: order.attributes.user_name,
// 					email: order.attributes.user_email,
// 					status: order.attributes.status,
// 					customerId: order.attributes.customer_id.toString(),
// 					variantId: order.attributes.first_order_item.variant_id.toString(),
// 					licenseKey:
// 						licenses.find(
// 							license => license.attributes.order_id.toString() === order.id,
// 						)?.attributes.key ?? '', // TODO: Handle missing license keys case
// 					licenseKeyInstance: '', // TODO Get from the orderList/LicenseList???
// 					createdAt: order.attributes.first_order_item.created_at,
// 					updatedAt: order.attributes.first_order_item.updated_at,
// 					user: {
// 						connect: { email: order.attributes.user_email },
// 					},
// 				},
// 				update: {
// 					lemonSqueezyId: order.id, // order.attributes.first_order_item.order_id
// 					orderId: order.attributes.first_order_item.id,
// 					name: order.attributes.user_name,
// 					email: order.attributes.user_email,
// 					status: order.attributes.status,
// 					customerId: order.attributes.customer_id.toString(),
// 					variantId: order.attributes.first_order_item.variant_id.toString(),
// 					licenseKey:
// 						licenses.find(
// 							license => license.attributes.order_id.toString() === order.id,
// 						)?.attributes.key ?? '', // TODO: Handle missing license keys case
// 					licenseKeyInstance: '', // TODO Get from the orderList/LicenseList???
// 					user: {
// 						connect: { email: order.attributes.user_email },
// 					},
// 				},
// 			})
// 			.catch(e => console.log('Error while updating purchases'))

// 		if (newPurchase) purchases.push(newPurchase)
// 	}

// 	return purchases
// }
// async function clearPlanData() {
// 	try {
// 		// clear ALL subscription data
// 		await prisma.plan.deleteMany()
// 	} catch (error) {
// 		throw json('error deleting plan data')
// 	}
// }

// Validate a license key or license key instance.
// const { statusCode, error, data } = await validateLicense(
// 	licenseKey,
// 	instanceId,
// )

// const { statusCode, error, data } = await activateLicense(licenseKey, 'Test')

// // Deactivate a license key instance.
// const { statusCode, error, data } = await deactivateLicense(
// 	licenseKey,
// 	instanceId,
// )

// export async function retrievePlans() {
// 	// Gets all active plans
// 	return await prisma.plan.findMany({
// 		where: {
// 			NOT: {
// 				status: 'draft',
// 			},
// 		},
// 	})
// }

// export async function retrievePlan(variantId: Plan['variantId']) {
// 	// Gets single active plan by ID
// 	return await prisma.plan.findFirst({
// 		where: {
// 			variantId: variantId,
// 			NOT: {
// 				status: 'draft',
// 			},
// 		},
// 	})
// }
