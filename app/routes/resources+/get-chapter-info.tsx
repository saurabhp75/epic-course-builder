import { type ActionFunctionArgs, redirect } from '@remix-run/node'
import { getReply } from '#app/utils/ai.server.js'
import { prisma } from '#app/utils/db.server.js'
import { getTranscript, searchYoutube } from '#app/utils/youtube.server.js'

type ChapterQuestion = {
	question: string
	answer: string
	option1: string
	option2: string
	option3: string
}

export async function action({ request }: ActionFunctionArgs) {
	// Get chapterId/youtubeSearchQuery from the form data
	const formData = await request.formData()
	const formdataObject = Object.fromEntries(formData)
	const courseTitle = formdataObject.courseTitle
	const courseId = formdataObject.courseId

	// Delete courseTitle & courseId property from the form object
	delete formdataObject.courseTitle
	delete formdataObject.courseId
	// console.dir(formdataObject)
	// console.dir(courseTitle)

	// Get chapterIds and queryStrings from the form object
	const chapterIds = Object.keys(formdataObject)
	const queryStrings = Object.values(formdataObject)
	// console.log(chapterIds)
	// console.log(queryStrings)

	const videoIdsPromises = queryStrings.map((val) =>
		searchYoutube(val as string),
	)

	// Get videoIds from youtubeSearchQuery strings
	const videosIds = await Promise.all(videoIdsPromises)
	console.log(videosIds)

	const transcriptPromises = videosIds.map((videoId) => getTranscript(videoId))

	// Get video transcripts from videoIds
	const transcripts = await Promise.all(transcriptPromises)
	console.log(transcripts)

	const summaryPromises = transcripts.map((transcript) =>
		getReply({
			purpose: 'GET_SUMMARY',
			userPrompt: transcript,
		}),
	)

	// Get summaries from video transcripts
	const summaries = await Promise.all(summaryPromises)
	console.log(summaries)

	// Get array of question from course title and transcripts
	// For each transcript get 5 questions.
	const questionPromises = transcripts.map((transcript) =>
		getReply({
			purpose: 'GET_QUESTIONS',
			userPrompt: JSON.stringify({ courseTitle, transcript }),
		}),
	)

	// Get questions from transcript
	// Array of 5 questions for each transcript
	const chapterQuestions = (await Promise.all(
		questionPromises,
	)) as ChapterQuestion[][]
	console.log(chapterQuestions)

	// TODO: Use prisma transaction object
	chapterQuestions.map(async (questions, index) => {
		await prisma.question.createMany({
			data: questions.map((question) => {
				let options = [
					question.answer,
					question.option1,
					question.option2,
					question.option3,
				]
				options = options.sort(() => Math.random() - 0.5)
				return {
					question: question.question,
					answer: question.answer,
					options: JSON.stringify(options),
					chapterId: chapterIds[index] as string,
				}
			}),
		})
	})

	// Update videoId and summary in chapter table
	chapterIds.forEach(async (element, index) => {
		await prisma.chapter.update({
			where: { id: element as string },
			data: {
				videoId: videosIds[index],
				summary: summaries[index] as string,
			},
		})
	})

	return redirect(`/course/${courseId}`)
}
