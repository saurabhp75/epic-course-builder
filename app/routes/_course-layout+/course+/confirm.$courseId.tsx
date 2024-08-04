import { invariant } from '@epic-web/invariant'
import { type Chapter, type Course, type Unit } from '@prisma/client'
import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Form, Link, useLoaderData, useNavigation } from '@remix-run/react'
import { Field } from '#app/components/forms.js'
import { Button } from '#app/components/ui/button.js'
import { Icon } from '#app/components/ui/icon.js'
import { requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server.js'

type CourseProps = {
	course: Course & {
		units: (Unit & {
			chapters: Chapter[]
		})[]
	}
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

export default function CourseId() {
	const data = useLoaderData<typeof loader>()

	return (
		<div className="mx-auto my-16 flex max-w-xl flex-col items-start">
			<h5 className="text-seconday-foreground/60 text-sm uppercase">
				Course Name
			</h5>
			<h1 className="text-5xl font-bold">{data.name}</h1>

			<div className="mt-5 flex border-none bg-secondary p-4">
				<Icon name="info" className="mr-3 h-12 w-12 text-blue-400" />
				<div>
					We generated chapters for each of your units. Look over them and then
					click the Button to confirm and continue
				</div>
			</div>
			<ConfirmChapters course={data} />
		</div>
	)
}

function ConfirmChapters({ course }: CourseProps) {
	const navigation = useNavigation()
	const loading = navigation.state === 'submitting'

	return (
		<div className="mt-4 w-full">
			<Form
				method="POST"
				action="/resources/get-chapter-info"
				className="mt-4 w-full"
			>
				<input
					type="hidden"
					name="courseTitle" 
					value={course.name}
				/>
				<input
					type="hidden"
					name="courseId" 
					value={course.id}
				/>
				{course.units.map((unit, unitIndex) => {
					return (
						<fieldset key={unit.id} className="mt-5">
							<legend className="text-sm uppercase text-secondary-foreground/60">
								Unit {unitIndex + 1} {unit.name}
							</legend>
							<div className="mt-3">
								{unit.chapters.map((chapter, chapterIndex) => {
									return (
										<div key={chapterIndex}>
											<input
												type="hidden"
												name={chapter.id}
												value={chapter.youtubeSearchQuery}
											/>
											<Field
												labelProps={{
													children: `chapter: ${chapterIndex + 1}`,
												}}
												inputProps={{
													name: chapter.name,
													value: chapter.name,
													disabled: true,
												}}
											/>
										</div>
									)
								})}
							</div>
						</fieldset>
					)
				})}
				<div className="mt-4 flex items-center justify-center">
					<div className="mx-4 flex items-center">
						<Button asChild variant={'secondary'} disabled={loading}>
							<Link to="/create">
								<Icon
									name="chevron-left"
									strokeWidth={4}
									className="mr-2 h-4 w-4"
								/>
								Back
							</Link>
						</Button>
						<Button
							type="submit"
							className="ml-4 font-semibold"
							disabled={loading}
						>
							{loading ? 'Generating...' : 'Generate'}
							<Icon
								name="chevron-right"
								className="ml-2 h-4 w-4"
								strokeWidth={4}
							/>
						</Button>
					</div>
				</div>
			</Form>
		</div>
	)
}
