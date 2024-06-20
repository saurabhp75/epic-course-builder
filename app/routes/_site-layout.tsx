import { Link, Outlet, useRouteLoaderData } from '@remix-run/react'
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
		// <div className="flex h-screen flex-col border-red-600 border-4">
		<div className="flex h-screen flex-col">
			<header className="container py-6">
				<nav className="flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap md:gap-8">
					<Logo />

					<div className="flex items-center gap-10">
						{user ? (
							<UserDropdown />
						) : (
							<Button asChild variant="default" size="lg">
								<Link to="/login">Log In</Link>
							</Button>
						)}
					</div>
				</nav>
			</header>

			<div className="flex-1">
				<Outlet />
			</div>

			<div className="container flex justify-between pb-5">
				<Logo />
				<ThemeSwitch userPreference={data?.requestInfo.userPrefs.theme} />
			</div>
		</div>
	)
}
