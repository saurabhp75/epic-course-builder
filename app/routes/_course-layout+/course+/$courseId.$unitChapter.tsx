import { invariant } from '@epic-web/invariant'
import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { redirect, useLoaderData } from '@remix-run/react'
import { prisma } from '#app/utils/db.server.js'

export async function loader({ params }: LoaderFunctionArgs) {
	const unitChapter = params.unitChapter
	const courseId = params.courseId
	invariant(unitChapter && courseId, 'unitChapter or courseId not found')

	const [unitIndex, chapterIndex] = unitChapter.split('-')
	invariant(unitIndex && chapterIndex, 'unit or chapter or courseId not found')

	console.log(unitIndex, chapterIndex)
	console.log(courseId)

	// Get course and chapter details from db (findFirst)
	const course = await prisma.course.findUnique({
		where: { id: courseId },
		include: {
			units: {
				include: {
					chapters: {
						include: { questions: true },
					},
				},
			},
		},
	})
	if (!course) {
		return redirect('/gallery')
	}

	const unit = course.units[parseInt(unitIndex)]
	if (!unit) {
		return redirect('/gallery')
	}
	const chapter = unit.chapters[parseInt(chapterIndex)]
	if (!chapter) {
		return redirect('/gallery')
	}

	return json({ chapter, unitIndex, chapterIndex })
}

export default function CourseIdSplat() {
	const data = useLoaderData<typeof loader>()
	const { chapter, unitIndex, chapterIndex } = data
	console.dir(data)

	return (
		<div className="mt-16 flex-[2]">
			<h4 className="text-sm uppercase text-secondary-foreground/60">
				Unit {unitIndex + 1} &bull; Chapter {chapterIndex + 1}
			</h4>
			<h1 className="text-4xl font-bold">{chapter.name}</h1>
			<iframe
				title="chapter video"
				className="aspeect-video mt-4 max-h-[24rem] w-full"
				src={`https://www.youtube.com/embed/${chapter.videoId}`}
				allowFullScreen
			/>
			<div className="mt-4">
				<h3 className="text-3xl font-semibold">Summary</h3>
				<p className="mt-2 text-secondary-foreground/80">{chapter.summary}</p>
			</div>
		</div>
	)
}
