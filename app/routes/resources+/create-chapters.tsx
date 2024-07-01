import { parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs, json, redirect } from '@remix-run/node'
import { getReply } from '#app/utils/ai.server.js'
import { prisma } from '#app/utils/db.server.js'
import { checkHoneypot } from '#app/utils/honeypot.server.js'
import { getUnsplashImage } from '#app/utils/unsplash.server.js'
import { createChaptersSchema } from '../_course-layout+/create'

export type CourseObject = {
	courseTitle: string
	units: {
		unitTitle: string
		chapters: {
			youtubeSearchQuery: string
			chapterTitle: string
		}[]
	}[]
}

type ImageSearchTerm = { imageSearchString: 'calculus graph equations' }

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData()
	checkHoneypot(formData)
	

	const submission = parseWithZod(formData, {
		schema: createChaptersSchema,
	})

	if (submission.status !== 'success') {
		return json(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	// Create units and chapters of the course
	const courseObj = (await getReply({
		purpose: 'GET_UNITS',
		userPrompt: JSON.stringify(submission.value),
	})) as CourseObject

	console.log('courseObj:', courseObj)
	console.log('typeof courseObj:', typeof courseObj)

	// {
	// 	courseTitle: 'Calculus',
	// 	units: [
	// 		{
	// 			unitTitle: 'Introduction',
	// 			chapters: [
	// 				{
	// 					chapterTitle: 'Limits and Continuity',
	// 					youtubeSearchQuery: 'Calculus limits and continuity',
	// 				},
	// 				{
	// 					chapterTitle: 'Derivatives',
	// 					youtubeSearchQuery: 'Calculus derivatives',
	// 				},
	// 			],
	// 		},
	// 		{
	// 			unitTitle: 'Differentiation',
	// 			chapters: [
	// 				{
	// 					chapterTitle: 'Basic Differentiation Rules',
	// 					youtubeSearchQuery: 'Calculus differentiation rules',
	// 				},
	// 				{
	// 					chapterTitle: 'Chain Rule',
	// 					youtubeSearchQuery: 'Calculus chain rule',
	// 				},
	// 			],
	// 		},
	// 		{
	// 			unitTitle: 'Integration',
	// 			chapters: [
	// 				{
	// 					chapterTitle: 'Indefinite Integrals',
	// 					youtubeSearchQuery: 'Calculus indefinite integrals',
	// 				},
	// 				{
	// 					chapterTitle: 'Definite Integrals',
	// 					youtubeSearchQuery: 'Calculus definite integrals',
	// 				},
	// 			],
	// 		},
	// 	],
	// }

	// Create image search term
	//  {"imageSearchString": "calculus graph equations"}
	const imageSearchTerm = (await getReply({
		purpose: 'GET_IMAGE',
		userPrompt: `Please provide a good image search term for the title of a course about ${submission.value.title}`,
	})) as ImageSearchTerm

	// console.log('imageSearchTerm:', imageSearchTerm)
	// console.log('typeof imageSearchTerm:', typeof imageSearchTerm)

	// Get the image from unsplash
	const courseImage = await getUnsplashImage(imageSearchTerm.imageSearchString)
	// console.log('courseImage:', courseImage)
	// console.log('typeof courseImage:', typeof courseImage)

	// Store the course contents in db
	const course = await prisma.course.create({
		data: {
			name: submission.value.title,
			image: courseImage,
		},
	})

	for (const unit of courseObj.units) {
		const title = unit.unitTitle
		const prismaUnit = await prisma.unit.create({
			data: {
				name: title,
				courseId: course.id,
			},
		})
		await prisma.chapter.createMany({
			data: unit.chapters.map((chapter) => {
				return {
					name: chapter.chapterTitle,
					youtubeSearchQuery: chapter.youtubeSearchQuery,
					unitId: prismaUnit.id,
				}
			}),
		})
	}
	// Update user billing info
	// await prisma.user.update({
	// 	where: {
	// 		id: session.user.id,
	// 	},
	// 	data: {
	// 		credits: {
	// 			decrement: 1,
	// 		},
	// 	},
	// })

	return redirect(`/course/confirm/${course.id}`)
}
