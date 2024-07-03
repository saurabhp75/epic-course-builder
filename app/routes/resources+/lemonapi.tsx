import { type ActionFunctionArgs } from '@remix-run/node'
import { useFetcher } from '@remix-run/react'
import { useEffect } from 'react'
import { LoadingButton } from '#app/components/loading-button.js'
import { Icon } from '#app/components/ui/icon.js'
// import { LoadingButton } from '#app/components/ui/loading-button.js'
// import { requireUserId } from '#app/utils/auth.server.js'
import { createCheckoutUrl, syncProducts } from '#app/utils/lemon.server.js'

export async function action({ request }: ActionFunctionArgs) {
	// const userId = await requireUserId(request)
	const formData = await request.formData()
	const intent = formData.get('intent')
	switch (intent) {
		case 'createCheckoutUrlIntent': {
			return await createCheckoutUrl({ request, formData })
		}
		case 'syncProducts': {
			return await syncProducts()
		}
		case 'syncPurchases': {
			// return await syncPurchases({ userId })
		}
	}
}

export function CheckoutButton({ product }: { product: string }) {
	const fetcher = useFetcher<typeof createCheckoutUrl>()
	const checkoutUrl = fetcher.data
	const loading = fetcher.state === 'submitting'

	// console.log(checkoutUrl)
	const buttonText =
		product === 'EpicSaaS-Pro' ? 'Get EpicSaaS Pro' : 'Get EpicSaaS Standard'

	// Make sure Lemon.js is loaded
	useEffect(() => {
		if (typeof window.createLemonSqueezy === 'function') {
			window.createLemonSqueezy()
		}
	}, [])

	useEffect(() => {
		if (checkoutUrl) {
			window.LemonSqueezy.Url.Open(checkoutUrl)
		}
	}, [checkoutUrl])

	return (
		<fetcher.Form method="POST" action="/resources/lemonapi">
			<input type="hidden" name="variantId" value={product} />
			<LoadingButton
				loading={loading}
				type="submit"
				name="intent"
				value="createCheckoutUrlIntent"
				className="flex gap-1"
			>
				{buttonText}
				<Icon name="move-right" className="h-4 w-4" />
			</LoadingButton>
		</fetcher.Form>
	)
}

export function SyncProductsForm() {
	const fetcher = useFetcher<typeof syncProducts>()
	const productVariants = fetcher.data
	const loading = fetcher.state === 'submitting'
	console.log(productVariants)

	return (
		<>
			<fetcher.Form method="POST" action="/resources/lemonapi">
				<LoadingButton
					loading={loading}
					type="submit"
					name="intent"
					value="syncProducts"
					className="flex gap-1"
				>
					Sync products
				</LoadingButton>
			</fetcher.Form>
		</>
	)
	// {productVariants &&
	// 		productVariants.map(item => (
	// 			<div key={item.id}>
	// 				<p>lemonSqueezyId:{item.id}</p>
	// 				<p>productId: {item.productId}</p>
	// 				<p>productName: {item.productName}</p>
	// 				<p>variantId: {item.variantId}</p>
	// 				{/* <p>status: {item.status}</p> */}
	// 				<p>name: {item.name}</p>
	// 				<p>description: {item.description}</p>
	// 				<p>price: {item.price}</p>
	// 				<p>isUsageBased: {item.isUsageBased}</p>
	// 				<p>interval: {item.interval}</p>
	// 				<p>intervalCount: {item.intervalCount}</p>
	// 				<p>trialInterval: {item.trialInterval}</p>
	// 				<p>trialIntervalCount: {item.trialIntervalCount}</p>
	// 				<p>sort: {item.sort}</p>
	// 			</div>
	// 		))}
}

// export function SyncPurchasesForm() {
// 	// const productVariants = useActionData<typeof action>()
// 	const fetcher = useFetcher<typeof syncPurchases>()
// 	// const purchases = fetcher.data
// 	const loading = fetcher.state === 'submitting'
// 	// console.log(purchases)

// 	return (
// 		<>
// 			<fetcher.Form method="POST" action="/resources/lemonapi">
// 				<LoadingButton
// 					loading={loading}
// 					type="submit"
// 					name="intent"
// 					value="syncPurchases"
// 					className="flex gap-1"
// 				>
// 					Sync purchases
// 				</LoadingButton>
// 			</fetcher.Form>
// 		</>
// 	)
// }
