import { type Chapter, type Course, type Unit } from '@prisma/client'
import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { prisma } from '#app/utils/db.server.js'

export async function loader({}: LoaderFunctionArgs) {
	const courses = await prisma.course.findMany({
		include: {
			units: {
				include: { chapters: true },
			},
		},
	})
	return json(courses)
}

export default function Gallery() {
	const courses = useLoaderData<typeof loader>()
	return (
		<div className="mx-auto max-w-7xl py-8">
			<div className="grid grid-cols-1 place-items-center gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				{courses.map((course) => {
					return <GalleryCourseCard course={course} key={course.id} />
				})}
			</div>
		</div>
	)
}

type Props = {
	course: Course & {
		units: (Unit & {
			chapters: Chapter[]
		})[]
	}
}

function GalleryCourseCard({ course }: Props) {
	return (
		<>
			<div className="rounded-lg border border-secondary">
				<div className="relative">
					<Link
						to={`/course/${course.id}/0-0`}
						className="relative block w-fit"
					>
						<img
							src={course.image || ''}
							className="max-h-[300px] w-full rounded-t-lg object-cover"
							width={300}
							height={300}
							alt="picture of the course"
						/>
						<span className="absolute bottom-2 left-2 right-2 w-fit rounded-md bg-black/60 px-2 py-1 text-white">
							{course.name}
						</span>
					</Link>
				</div>

				<div className="p-4">
					<h4 className="text-sm text-secondary-foreground/60">Units</h4>
					<div className="space-y-1">
						{course.units.map((unit, unitIndex) => {
							return (
								<Link
									to={`/course/${course.id}/${unitIndex}-0`}
									key={unit.id}
									className="block w-fit underline"
								>
									{unit.name}
								</Link>
							)
						})}
					</div>
				</div>
			</div>
		</>
	)
}
