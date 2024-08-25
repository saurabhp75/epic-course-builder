import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { Badge } from '#app/components/ui/badge.js'
import { Button } from '#app/components/ui/button.js'
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card.js'
import { Icon } from '#app/components/ui/icon.js'
import { requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server.js'

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)

	const courses = await prisma.course.findMany({
		where: { ownerId: userId },
		include: {units: true}
	})

	// console.dir(courses)
	return json({ courses })
}
export default function Dashboard() {
	const courses = useLoaderData<typeof loader>()

	return (
		<div className="flex h-screen bg-gray-100 dark:bg-gray-900">
			{/* Sidebar */}
			<aside className="hidden w-64 bg-white p-6 dark:bg-gray-800 md:block">
				{/* <div className="mb-6 flex items-center">
					<Avatar className="h-10 w-10">
						<AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
						<AvatarFallback>JD</AvatarFallback>
					</Avatar>
					<div className="ml-3">
						<p className="font-medium dark:text-white">John Doe</p>
						<p className="text-sm text-gray-500 dark:text-gray-400">
							Instructor
						</p>
					</div>
				</div> */}
				<nav>
					<ul className="space-y-2">
						<li>
							<Link
								to="#"
								className="block rounded px-4 py-2 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
							>
								Dashboard
							</Link>
						</li>
						<li>
							<Link
								to="#"
								className="block rounded px-4 py-2 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
							>
								My Courses
							</Link>
						</li>
						<li>
							<Link
								to="#"
								className="block rounded px-4 py-2 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
							>
								Analytics
							</Link>
						</li>
						<li>
							<Link
								to="#"
								className="block rounded px-4 py-2 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
							>
								Settings
							</Link>
						</li>
					</ul>
				</nav>
			</aside>

			{/* Main content */}
			<main className="flex-1 overflow-auto p-6">
				<header className="mb-6 flex items-center justify-between">
					<h1 className="text-2xl font-bold dark:text-white">My Courses</h1>
					<div className="space-x-2">
						<Button asChild variant="outline">
							<Link to="/gallery">View Gallery</Link>
						</Button>
						<Button asChild>
							<Link to="/create">
								<Icon name="plus" className="mr-2 h-4 w-4" /> Create Course
							</Link>
						</Button>
					</div>
				</header>

				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{courses.courses.map((course) => (
						<Card key={course.id}>
							<CardHeader>
								<CardTitle>{course.name}</CardTitle>
								{/* <CardDescription>Course ID: {course.id}</CardDescription> */}
							</CardHeader>
							<CardContent>
								<div className="flex items-center justify-between">
									<div className="flex items-center">
										<Icon
											name="book-open"
											className="mr-2 h-4 w-4 text-gray-500"
										/>
										<span>{course.units.length} units</span>
									</div>
								</div>
							</CardContent>
							<CardFooter className="flex justify-between">
								<Button asChild variant="outline" size="sm">
									<Link to={`/course/${course.id}/0-0`}>View</Link>
								</Button>
								<Badge>Published</Badge>
							</CardFooter>
						</Card>
					))}
				</div>
			</main>
		</div>
	)
}