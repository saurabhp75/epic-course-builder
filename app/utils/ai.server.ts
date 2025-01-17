import {
	GoogleGenerativeAI,
	HarmCategory,
	HarmBlockThreshold,
} from '@google/generative-ai'

const MODEL_NAME = 'gemini-1.5-flash-latest'

export async function getReply({
	userPrompt,
	purpose, // GET_IMAGE | GET_UNITS | GET_SUMMARY | GET_QUESTIONS
}: {
	userPrompt: string
	purpose: string
}) {
	// Initialize the LLM
	const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
	const model = genAI.getGenerativeModel({
		model: MODEL_NAME,
		// systemInstruction: 'You are a cat. Your name is Neko.',
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

		case 'GET_SUMMARY': {
			return 'You are an expert capable of summarising a youtube transcript from given input.Your response should be an object with a single property named summary of type string. Summarise in 250 words or less and do not talk of the sponsors or anything unrelated to the main topic, also do not introduce what the summary is about.'
		}

		case 'GET_QUESTIONS': {
			// return `You are an expert in formulating mcq questions and answers from the course title and transcript. The course content is in the form of an object of shape ${JSON.stringify({ courseTitle: 'Title of the course', transcript: 'Transcript of the course' })} where courseTitle is a string which describes the course and transcript is a string which contains the content of the course. From the courseTitle and transcript generate an array of objects of length 5. Each object of the array should have following structure. A question property which is a string which describes the question in not more than 25 words. An answer property which is a string which describes the answer in not more than 30 words. And three properties viz, option1, option2 and option3, each of which is a string with not more than 25 words and contains other options for the question.`

			return `You are an expert in formulating MCQ questions and answers from the course title and transcript. The course content is in the form of an object of shape ${JSON.stringify({ courseTitle: 'Title of the course', transcript: 'Transcript of the course' })} where courseTitle is a string which describes the course and transcript is a string which contains the content of the course. From the courseTitle and transcript generate 5 MCQ questions. Your response should use following JSON schema: 
			{ 
	"type": “array”,	
	“items”: 
	{
		“type”: “object”,
		“properties”: 
		{			"question": { "type": "string" },
			"answer": { "type": "string" },
			"option1": { "type": "string" },
			"option2”: { "type": "string" },
			"option3”: { "type": "string" },		 }
	}
}, Each question should have an answer and three other options`
		}

		default:
			return 'Error'
	}
}

// {
// 	"type": “array”,
// 	“items”:
// 	{
// 		“type”: “object”,
// 		“properties”:
// 		{			"question": { "type": "string" },
// 			"answer": { "type": "string" },
// 			"option1": { "type": "string" },
// 			"option2”: { "type": "string" },
// 			"option3”: { "type": "string" },		 }
// 	}
// }
