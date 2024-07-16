import { invariant } from '@epic-web/invariant'
import {
	type LoaderFunctionArgs,
	redirect,
	type ActionFunctionArgs,
} from '@remix-run/node'
import {
	IMPERSONATOR_SESSION_KEY,
	getImpersonator,
	sessionKey,
} from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithRole } from '#app/utils/permissions.server.ts'
import { authSessionStorage } from '#app/utils/session.server.ts'

export async function action({ request }: ActionFunctionArgs) {
	const body = await request.formData()
	const intent = body.get('intent') as string

	invariant(intent === 'start' || intent === 'stop', 'invalid intent')

	const authSession = await authSessionStorage.getSession(
		request.headers.get('cookie'),
	)

	const currentSessionId = authSession.get(sessionKey)

	if (intent === 'start') {
		const userId = body.get('userId')?.toString()

		invariant(userId, 'Must provide a userId')

		const admin = await requireUserWithRole(request, 'admin')

		// admin cannot impersonate admin(self)
		invariant(userId !== admin, 'Self impersonation not allowed')

		// const currentSessionId = authSession.get(sessionKey)
		// Create new session with the userId to be impersonated
		const impersonatorSession = await prisma.session.create({
			data: {
				userId: userId,
				expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
			},
		})

		// Store current session-id using IMPERSONATOR_SESSION_KEY
		authSession.set(IMPERSONATOR_SESSION_KEY, currentSessionId)
		// Set the current session-id to the new session of impersonated user
		authSession.set(sessionKey, impersonatorSession.id)
		const newCookie = await authSessionStorage.commitSession(authSession, {
			expires: impersonatorSession.expirationDate,
		})

		return redirect('/', {
			headers: { 'Set-Cookie': newCookie },
		})
	}

	if (intent === 'stop') {
		// You need to delete the session of the impersonated user from the db
		const impersonator = await getImpersonator(request)

		invariant(impersonator, 'Must be impersonating to stop impersonating')

		authSession.set(sessionKey, impersonator.session.id)
		authSession.unset(IMPERSONATOR_SESSION_KEY)

		const newCookie = await authSessionStorage.commitSession(authSession, {
			expires: impersonator.session.expirationDate,
		})

		// Delete the session created to impersonate
		await prisma.session.delete({
			where: { id: currentSessionId },
		})

		return redirect('/admin/users', {
			headers: { 'set-cookie': newCookie },
		})
	}
}

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserWithRole(request, 'admin')

	return redirect('/admin/users')
}
