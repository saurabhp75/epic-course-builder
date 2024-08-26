import { useSubmit, Link, Form, useRouteLoaderData } from '@remix-run/react'
import { useRef } from 'react'
import { type loader as rootLoader } from '#app/root.tsx'
import { getUserImgSrc } from '#app/utils/misc.js'
import { useUser } from '#app/utils/user.js'
import { Button } from './ui/button'
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuPortal,
	DropdownMenuContent,
	DropdownMenuItem,
} from './ui/dropdown-menu'
import { Icon } from './ui/icon'

export function UserDropdown() {
	const user = useUser()
	const submit = useSubmit()
	const formRef = useRef<HTMLFormElement>(null)
	const data = useRouteLoaderData<typeof rootLoader>('root')
	const userRolesIncludesAdmin = user.roles.some((role) => {
		return role.name === 'admin'
	})

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button asChild variant="secondary">
					<Link
						to={`/users/${user.username}`}
						// this is for progressive enhancement
						onClick={(e) => e.preventDefault()}
						className="flex items-center gap-2"
					>
						<img
							className="h-8 w-8 rounded-full object-cover"
							alt={user.name ?? user.username}
							src={getUserImgSrc(user.image?.id)}
						/>
						<span className="text-body-sm font-bold">
							{user.name ?? user.username}
						</span>
					</Link>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuPortal>
				<DropdownMenuContent sideOffset={8} align="start">
					{data?.impersonator && (
						<DropdownMenuItem asChild>
							<Form action="/impersonate" method="POST">
								<input type="hidden" name="intent" value="stop" />
								<Button className="bg-white">
									<Icon className="text-body-md" name="exit">
										Stop Impersonating {user.username}
									</Icon>
								</Button>
							</Form>
						</DropdownMenuItem>
					)}
					<DropdownMenuItem asChild>
						<Link prefetch="intent" to={`/users/${user.username}`}>
							<Icon className="text-body-md" name="airplay">
								Dashboard
							</Icon>
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link prefetch="intent" to={`/users/${user.username}`}>
							<Icon className="text-body-md" name="avatar">
								Profile
							</Icon>
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link prefetch="intent" to={`/users/${user.username}/notes`}>
							<Icon className="text-body-md" name="pencil-2">
								Notes
							</Icon>
						</Link>
					</DropdownMenuItem>
					{userRolesIncludesAdmin && (
						<DropdownMenuItem asChild>
							<Link prefetch="intent" to={`/admin/users`}>
								<Icon className="text-body-md" name="lock-closed">
									Manage Users
								</Icon>
							</Link>
						</DropdownMenuItem>
					)}
					<DropdownMenuItem
						asChild
						// this prevents the menu from closing before the form submission is completed
						onSelect={(event) => {
							event.preventDefault()
							submit(formRef.current)
						}}
					>
						<Form action="/logout" method="POST" ref={formRef}>
							<Icon className="text-body-md" name="exit">
								<button type="submit">Logout</button>
							</Icon>
						</Form>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenuPortal>
		</DropdownMenu>
	)
}
