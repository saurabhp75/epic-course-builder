import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Form, useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.js'
import { Button } from '#app/components/ui/button.tsx'
import { getImpersonator } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithRole } from '#app/utils/permissions.server.js'
import { useUser } from '#app/utils/user.ts'

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserWithRole(request, 'admin')

	const users = await prisma.user.findMany({
		include: {
			roles: true,
		},
	})

	const impersonator = await getImpersonator(request)

	const isImpersonating = !!impersonator?.session?.id

	return json({
		users,
		canImpersonate: !isImpersonating,
	})
}

export default function Users() {
	const currentUser = useUser()
	const { users, canImpersonate } = useLoaderData<typeof loader>()

	return (
		<div className="flex flex-col items-center gap-10">
			<h1 className="mx-auto max-w-xl text-2xl font-bold">Users</h1>

			<table className="mx-auto border-collapse">
				<thead>
					<tr>
						<th className="p-4 text-left">Name</th>
						<th className="p-4 text-left">Email</th>
						<th className="p-4 text-left">Username</th>
						<th className="p-4 text-left">Roles</th>
						<th className="p-4 text-left">Impersonate</th>
					</tr>
				</thead>
				<tbody>
					{users.map((user) => (
						<tr className="" key={user.id}>
							<td className="p-4">{user.name}</td>
							<td className="p-4">{user.email}</td>
							<td className="p-4">{user.username}</td>
							<td className="p-4">
								{user.roles.map((role) => role.name).join(', ')}
							</td>
							{canImpersonate && currentUser.id !== user.id && (
								<td className="p-4">
									<Form method="post" action="/impersonate" className="flex">
										<input type="hidden" name="intent" value="start" />
										<input type="hidden" name="userId" value={user.id} />
										<Button type="submit">Impersonate</Button>
									</Form>
								</td>
							)}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				403: () => <p>You are not allowed to do that</p>,
				404: ({ params }) => (
					<p>No note with the id "{params.noteId}" exists</p>
				),
			}}
		/>
	)
}
