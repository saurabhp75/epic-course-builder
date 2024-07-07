import { type ActionFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/react'
import { validateEvent } from '#app/utils/lemon.server.js'

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
