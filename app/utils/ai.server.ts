import {
	GoogleGenerativeAI,
	HarmCategory,
	HarmBlockThreshold,
} from '@google/generative-ai'

const MODEL_NAME = 'gemini-1.5-flash-latest'

export async function getReply({
	userPrompt,
	purpose, // GET_IMAGE | GET_UNITS
}: {
	userPrompt: string
	purpose: string
}) {
	// Initialize the LLM
	const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
	const model = genAI.getGenerativeModel({
		model: MODEL_NAME,
	})
	const generationConfig = {
		temperature: 1,
		topP: 0.95,
		topK: 64,
		maxOutputTokens: 8192,
		responseMimeType: 'application/json',
	}
	const safetySettings = [
		{
			category: HarmCategory.HARM_CATEGORY_HARASSMENT,
			threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
		},
		{
			category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
			threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
		},
		{
			category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
			threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
		},
		{
			category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
			threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
		},
	]

	// Prompt Engineering
	const prompt = getPrompt(purpose)

	const parts = [
		{ text: prompt },
		{ text: `input: ${userPrompt}` },
		{ text: 'output: ' },
	]

	const result = await model.generateContent({
		contents: [{ role: 'user', parts }],
		generationConfig,
		safetySettings,
	})

	const geminiResponse = JSON.parse(result.response.text())

	// console.log('geminiResponse:', geminiResponse)
	// console.log('typeof geminiResponse:', typeof geminiResponse)

	return geminiResponse
}

function getPrompt(purpose: string) {
	switch (purpose) {
		case 'GET_UNITS': {
			return 'You are an expert at curating course content based on the description of the course. The course description is in the form of an object of shape ${JSON.stringify({ title: "Title of the course", units: "Array of unit titles" })} where title is a string which describes the course and units is an array of strings in which each string is a title which describes a unit in the course. From the course description generate an object which should have following structure.The generated object should have two properties viz, courseTitle and units.The courseTitle should be same as the title of the course from the course description input.The units property should be derived from the units array from the course description input and is an array of object with two properties viz, unitTitle and chapters.unitTitle should be derived from the units array.chapters property is an array of objects with two properties viz, chapterTitle and youtubeSearchQuery, chapterTitle should be a string describing the chapter and youtubeSearchQuery should be a string to search for the chapter on youtube.'
		}

		case 'GET_IMAGE': {
			return 'You are an expert at finding the most relevant image for a given course description. Your response should be an object with a single property named imageSearchString of type string. imageSearchString property will be fed into the unsplash API, so make sure it is a good search term that will return good result'
		}

		default:
			return ''
	}
}
