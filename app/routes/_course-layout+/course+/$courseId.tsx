import { invariant } from '@epic-web/invariant'
import { type LoaderFunctionArgs, json } from '@remix-run/node'
import {
	NavLink,
	Outlet,
	useLoaderData,
	useRouteLoaderData,
} from '@remix-run/react'
import { Button } from '#app/components/ui/button.js'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card.js'
import { Icon } from '#app/components/ui/icon.js'
import { Sheet, SheetContent, SheetTrigger } from '#app/components/ui/sheet.js'
import { requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server.js'
import { cn } from '#app/utils/misc.js'

export function useCourseLoaderData() {
	// https://www.jacobparis.com/content/remix-route-loader-data
	const data = useRouteLoaderData<typeof loader>(
		'routes/_course-layout+/course+/$courseId',
	)
	if (data === undefined) {
		throw new Error(
			'useCourseLoaderData must be used within the courseId route or its children',
		)
	}
	return data
}

export async function loader({ request, params }: LoaderFunctionArgs) {
	// redirect to gallery instead of login page
	await requireUserId(request)

	// Get course details from courseId
	const course = await prisma.course.findUnique({
		where: {
			id: params.courseId,
		},
		include: {
			units: {
				include: {
					chapters: true,
				},
			},
		},
	})
	invariant(course, 'course not found')

	return json(course)
}

// This is a layout route
export default function CourseId() {
	const course = useLoaderData<typeof loader>()

	return (
		<div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
			<div className="hidden border-r bg-muted/40 md:block">
				<div className="flex h-full max-h-screen flex-col gap-2">
					<div className="flex-1">
						<h1>Course: {course.name}</h1>
						<nav className="grid items-start px-2 text-sm font-medium lg:px-4">
							{course.units.map((unit, unitIndex) => {
								return (
									<div key={unit.id}>
										<h3>{unit.name}</h3>
										{unit.chapters.map((chapter, chapterIndex) => {
											return (
												<NavLink
													key={chapter.id}
													to={`${unitIndex}-${chapterIndex}`}
													className={({ isActive }) =>
														cn(
															'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
															isActive && 'bg-muted text-primary',
														)
													}
												>
													<Icon name="chevron-right" className="h-4 w-4" />
													{chapter.name}
												</NavLink>
											)
										})}
									</div>
								)
							})}
						</nav>
					</div>
				</div>
			</div>
			<div className="flex flex-col">
				<header className="flex items-center gap-4 border-b bg-muted/40 px-4 lg:px-6">
					<Sheet>
						<SheetTrigger asChild>
							<Button
								variant="outline"
								size="icon"
								className="shrink-0 md:hidden"
							>
								<Icon name="menu" className="h-5 w-5" />
								<span className="sr-only">Toggle navigation menu</span>
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="flex flex-col">
							<nav className="grid gap-2 text-lg font-medium">
								{course.units.map((unit, unitIndex) => {
									return (
										<div key={unit.id}>
											<h3>{unit.name}</h3>
											{unit.chapters.map((chapter, chapterIndex) => {
												return (
													<NavLink
														key={chapter.id}
														to={`${unitIndex}-${chapterIndex}`}
														className={({ isActive }) =>
															cn(
																'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
																isActive && 'bg-muted text-primary',
															)
														}
													>
														<Icon name="chevron-right" className="h-4 w-4" />
														{chapter.name}
													</NavLink>
												)
											})}
										</div>
									)
								})}
							</nav>
							<div className="mt-auto">
								<Card>
									<CardHeader>
										<CardTitle>Upgrade to Pro</CardTitle>
										<CardDescription>
											Unlock all features and get unlimited access to our
											support team.
										</CardDescription>
									</CardHeader>
									<CardContent>
										<Button size="sm" className="w-full">
											Upgrade
										</Button>
									</CardContent>
								</Card>
							</div>
						</SheetContent>
					</Sheet>
				</header>
				<main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
					<div
						className="flex flex-1 justify-center rounded-lg border border-dashed shadow-sm"
						x-chunk="dashboard-02-chunk-1"
					>
						<Outlet />
					</div>
				</main>
			</div>
		</div>
	)
}
