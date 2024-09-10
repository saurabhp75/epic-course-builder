import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { prisma } from '#app/utils/db.server.js'

export async function loader({}: LoaderFunctionArgs) {
	const courses = await prisma.course.findMany({
		include: {
			units: {
				// TODO: Streamline chapters to reduce n/w traffic
				include: { chapters: true },
			},
		},
	})
	return json(courses)
}

export default function Gallery() {
	const courses = useLoaderData<typeof loader>()
	return (
		<div className="container mx-auto px-4 py-8">
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{courses.map((course) => (
					<div
						key={course.id}
						className="flex flex-col gap-4 overflow-hidden rounded-lg border border-secondary shadow-md"
					>
						<Link to={`/course/${course.id}/0-0`} className="relative p-0">
							<img
								src={course.image}
								alt={course.name}
								className="h-28 w-full object-cover"
							/>
							<span className="absolute bottom-2 left-2 right-2 w-fit rounded-md bg-black/60 px-2 py-1 text-white">
								{course.name}
							</span>
						</Link>
						<div className="px-4 pb-4">
							<ul className="space-y-1">
								{course.units.slice(0, 2).map((unit, unitIndex) => (
									<li key={unitIndex}>
										<Link
											to={`/course/${course.id}/${unitIndex}-0`}
											className="text-blue-600 hover:underline"
										>
											{unit.name}
										</Link>
									</li>
								))}
							</ul>
							{course.units.length > 2 && (
								<p className="mt-1 text-sm text-gray-500">
									+{course.units.length - 2} more unit
									{course.units.length - 2 > 1 ? 's' : null}
								</p>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
