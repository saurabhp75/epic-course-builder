import { Link, Outlet, useRouteLoaderData } from '@remix-run/react'
import { Footer } from '#app/components/footer.js'
import { Logo } from '#app/components/logo.js'
import { Button } from '#app/components/ui/button.js'
import { UserDropdown } from '#app/components/user-dropdown.js'
import { type loader as rootLoader } from '#app/root.tsx'
import { useOptionalUser } from '#app/utils/user.js'
import { ThemeSwitch } from './resources+/theme-switch'

export default function SiteLayout() {
	const data = useRouteLoaderData<typeof rootLoader>('root')
	const user = useOptionalUser()

	return (
		<div className="flex h-screen flex-col">
			<header className="container py-6">
				<nav className="flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap md:gap-8">
					<Logo />
					<div className="flex items-baseline gap-3">
						<ThemeSwitch userPreference={data?.requestInfo.userPrefs.theme} />
						<div className="flex items-center gap-10">
							{user ? (
								<UserDropdown />
							) : (
								<Button asChild variant="default" size="default">
									<Link to="/login">Log In</Link>
								</Button>
							)}
						</div>
					</div>
				</nav>
			</header>

			<div className="flex-1">
				<Outlet />
			</div>

			<Footer />
		</div>
	)
}
