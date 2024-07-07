import { Link } from '@remix-run/react'
import { Logo } from './logo'
// import { Icon } from './ui/icon'

export const Footer1 = () => {
	const navigationItems = [
		{
			title: 'Home',
			href: '/',
			description: '',
		},
		{
			title: 'Product',
			description: 'Managing a small business today is already tough.',
			items: [
				{
					title: 'Reports',
					href: '/reports',
				},
				{
					title: 'Statistics',
					href: '/statistics',
				},
				// {
				// 	title: 'Dashboards',
				// 	href: '/dashboards',
				// },
				// {
				// 	title: 'Recordings',
				// 	href: '/recordings',
				// },
			],
		},
		{
			title: 'Company',
			description: 'Managing a small business today is already tough.',
			items: [
				{
					title: 'About us',
					href: '/about',
				},
				// {
				// 	title: 'Fundraising',
				// 	href: '/fundraising',
				// },
				// {
				// 	title: 'Investors',
				// 	href: '/investors',
				// },
				{
					title: 'Contact us',
					href: '/contact',
				},
			],
		},
	]

	return (
		<div className="w-full bg-foreground py-20 text-background lg:py-40">
			<div className="container mx-auto">
				<div className="grid items-center gap-10 lg:grid-cols-2">
					<div className="flex flex-col items-start gap-8">
						<div className="flex flex-col gap-2">
							<h2 className="font-regular max-w-xl text-left text-3xl tracking-tighter md:text-5xl">
								TWBlocks™
							</h2>
							<p className="max-w-lg text-left text-lg leading-relaxed tracking-tight text-background/75">
								Managing a small business today is already tough.
							</p>
						</div>
						<div className="flex flex-row gap-20">
							<div className="flex max-w-lg flex-col text-left text-sm leading-relaxed tracking-tight text-background/75">
								<p>1 Tailwind Way</p>
								<p>Menlo Park</p>
								<p>CA 94025</p>
							</div>
							<div className="flex max-w-lg flex-col text-left text-sm leading-relaxed tracking-tight text-background/75">
								<Link to="/">Terms of service</Link>
								<Link to="/">Privacy Policy</Link>
							</div>
						</div>
					</div>
					<div className="grid items-start gap-10 lg:grid-cols-3">
						{navigationItems.map((item) => (
							<div
								key={item.title}
								className="flex flex-col items-start gap-1 text-base"
							>
								<div className="flex flex-col gap-2">
									{item.href ? (
										<Link
											to={item.href}
											className="flex items-center justify-between"
										>
											<span className="text-xl">{item.title}</span>
										</Link>
									) : (
										<p className="text-xl">{item.title}</p>
									)}
									{item.items &&
										item.items.map((subItem) => (
											<Link
												key={subItem.title}
												to={subItem.href}
												className="flex items-center justify-between"
											>
												<span className="text-background/75">
													{subItem.title}
												</span>
											</Link>
										))}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}

export const Footer = () => {
	return (
		<footer className="bg-foreground text-background" id="footer">
			<section className="container grid grid-cols-2 gap-x-12 gap-y-8 py-20">
				<div className="col-span-full xl:col-span-2">
					<Logo />
				</div>

				<div className="flex flex-col gap-2">
					<h3 className="text-lg font-bold">Follow US</h3>

					<div>
						<Link
							to={{
								pathname: '/some/path',
								hash: '#hash',
							}}
							className="opacity-60 hover:opacity-100"
						>
							Twitter
						</Link>
					</div>
				</div>

				<div className="flex flex-col gap-2">
					<h3 className="text-lg font-bold">About</h3>
					<div>
						<Link
							to={{
								pathname: '/some/path',
								hash: '#hash',
							}}
							className="opacity-60 hover:opacity-100"
						>
							Features
						</Link>
					</div>

					<div>
						<Link
							to={{
								pathname: '/some/path',
								hash: '#hash',
							}}
							className="opacity-60 hover:opacity-100"
						>
							Pricing
						</Link>
					</div>

					<div>
						<Link
							to={{
								pathname: '/some/path',
								hash: '#hash',
							}}
							className="opacity-60 hover:opacity-100"
						>
							FAQ
						</Link>
					</div>
				</div>

				<div className="flex flex-col gap-2">
					<h3 className="text-lg font-bold">Community</h3>
					<div>
						<Link
							to={{
								pathname: '/some/path',
								hash: '#hash',
							}}
							className="opacity-60 hover:opacity-100"
						>
							Youtube
						</Link>
					</div>

					<div>
						<Link
							to={{
								pathname: '/some/path',
								hash: '#hash',
							}}
							className="opacity-60 hover:opacity-100"
						>
							Discord
						</Link>
					</div>

					<div>
						<Link
							to={{
								pathname: '/some/path',
								hash: '#hash',
							}}
							className="opacity-60 hover:opacity-100"
						>
							Twitch
						</Link>
					</div>
				</div>
			</section>
		</footer>
	)
}
