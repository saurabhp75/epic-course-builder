import { type MetaFunction } from '@remix-run/node'
import { Case2 } from '#app/components/case.js'
import { CTA2 } from '#app/components/cta.js'
import { FAQ2 } from '#app/components/faq.js'
import { Feature1 } from '#app/components/features.js'
import { ScrollToTop } from '#app/components/ScrollToTop.js'
import { Badge } from '#app/components/ui/badge.js'
import { Button } from '#app/components/ui/button.js'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card.js'
import { Icon } from '#app/components/ui/icon.js'
import { CheckoutButton } from '#app/routes/resources+/lemonapi.js'

export const meta: MetaFunction = () => [{ title: 'Epic Notes' }]

export default function Index() {
	return (
		<main>
			<Hero4 />
			<Case2 />
			<Feature1 />
			<CTA2 />
			<Pricing1 />
			<FAQ2 />
			<ScrollToTop />
		</main>
	)
}

export const Hero4 = () => {
	return (
		<div className="w-full py-20 lg:py-40">
			<div className="container mx-auto">
				<div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
					<div className="flex flex-col gap-4">
						<div>
							<Badge variant="outline">We&apos;re live!</Badge>
						</div>
						<div className="flex flex-col gap-4">
							<h1 className="font-regular max-w-lg text-left text-5xl tracking-tighter md:text-7xl">
								Launch your startup in days, not months
							</h1>
							<p className="max-w-md text-balance text-xl leading-relaxed tracking-tight text-muted-foreground">
								SaaS starter kit meticulously designed for startups, businesses,
								and beyond With essential UI components, authentication,
								database integration, and Stripe support, it's your shortcut to
								launching a feature-rich SaaS and kickstarting your online
								revenue.
							</p>
						</div>
						<div className="flex flex-row gap-4">
							<CheckoutButton product="EpicSaaS-Pro" />
							<Button size="lg" className="gap-4" variant="outline">
								Learn More <Icon name="chevron-right" className="h-4 w-4" />
							</Button>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-8">
						<div className="aspect-square rounded-md bg-muted"></div>
						<div className="row-span-2 rounded-md bg-muted"></div>
						<div className="aspect-square rounded-md bg-muted"></div>
					</div>
				</div>
			</div>
		</div>
	)
}

export const Pricing1 = () => {
	return (
		<div id="pricing" className="w-full py-20 lg:py-40">
			<div className="container mx-auto">
				<div className="flex flex-col items-center justify-center gap-4 text-center">
					<Badge>Pricing</Badge>
					<div className="flex flex-col gap-2">
						<h2 className="font-regular max-w-xl text-center text-3xl tracking-tighter md:text-5xl">
							Prices that make sense!
						</h2>
						<p className="flex max-w-xl flex-row gap-2 text-center text-lg leading-relaxed tracking-tight text-muted-foreground">
							<Icon name="gift" className="h-6 w-6" />
							$100 off for the first 2670 customers (10 left)
						</p>
					</div>
					<div className="grid w-full grid-cols-1 gap-8 pt-20 text-left lg:grid-cols-2">
						<Card className="w-full rounded-md">
							<CardHeader>
								<CardTitle>
									<span className="flex flex-row items-center gap-4 font-normal">
										EpicSaaS Standard
									</span>
								</CardTitle>
								<CardDescription>
									For those who want just the code.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex flex-col justify-start gap-8">
									<p className="flex flex-row items-center gap-2 text-xl">
										<span className="text-4xl">$200</span>
									</p>
									<div className="flex flex-col justify-start gap-4">
										<div className="flex flex-row gap-4">
											<Icon
												name="check"
												className="mt-2 h-4 w-4 text-primary"
											/>
											<div className="flex flex-col">
												<p>EpicSaaS Boilerplate</p>
												<p className="text-sm text-muted-foreground">
													We&apos;ve made it fast and reliable.
												</p>
											</div>
										</div>
										<div className="flex flex-row gap-4">
											<Icon
												name="check"
												className="mt-2 h-4 w-4 text-primary"
											/>
											<div className="flex flex-col">
												<p>Complete Documentation</p>
												<p className="text-sm text-muted-foreground">
													We&apos;ve made it fast and reliable.
												</p>
											</div>
										</div>
										<div className="flex flex-row gap-4 text-muted-foreground">
											<Icon name="cross-1" className="mt-2 h-4 w-4" />
											<div className="flex flex-col">
												<p>Regular Updates</p>
												<p className="text-sm text-muted-foreground">
													We&apos;ve made it fast and reliable.
												</p>
											</div>
										</div>
									</div>
									<CheckoutButton product="EpicSaaS-Standard" />
								</div>
							</CardContent>
						</Card>
						<Card className="w-full rounded-md shadow-2xl">
							<CardHeader>
								<CardTitle>
									<span className="flex flex-row items-center gap-4 font-normal">
										EpicSaaS Pro
									</span>
								</CardTitle>
								<CardDescription>
									For those who want the complete package.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex flex-col justify-start gap-8">
									<p className="flex flex-row items-center gap-2 text-xl">
										<span className="text-4xl">$300</span>
									</p>
									<div className="flex flex-col justify-start gap-4">
										<div className="flex flex-row gap-4">
											<Icon
												name="check"
												className="mt-2 h-4 w-4 text-primary"
											/>
											<div className="flex flex-col">
												<p>EpicSaaS Boilerplate</p>
												<p className="text-sm text-muted-foreground">
													We&apos;ve made it fast and reliable.
												</p>
											</div>
										</div>
										<div className="flex flex-row gap-4">
											<Icon
												name="check"
												className="mt-2 h-4 w-4 text-primary"
											/>
											<div className="flex flex-col">
												<p>Complete Documentation</p>
												<p className="text-sm text-muted-foreground">
													We&apos;ve made it fast and reliable.
												</p>
											</div>
										</div>
										<div className="flex flex-row gap-4">
											<Icon
												name="check"
												className="mt-2 h-4 w-4 text-primary"
											/>
											<div className="flex flex-col">
												<p>Regular Updates</p>
												<p className="text-sm text-muted-foreground">
													We&apos;ve made it fast and reliable.
												</p>
											</div>
										</div>
									</div>
									<CheckoutButton product="EpicSaaS-Pro" />
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	)
}
