import { YoutubeTranscript } from 'youtube-transcript'
// import { getReply } from './ai.server'

export async function searchYoutube(searchQuery: string) {
	searchQuery = encodeURIComponent(searchQuery)

	const response = await fetch(
		`https://www.googleapis.com/youtube/v3/search?key=${process.env.YOUTUBE_API_KEY}&q=${searchQuery}&videoDuration=medium&videoEmbeddable=true&type=video&maxResults=5`,
	)

	if (!response.ok) {
		console.log('youtube fetch error')
		return null
	}

	const data = await response.json()

	// @ts-ignore
	if (!data || !data.items[0]) {
		console.log('youtube fail')
		return null
	}
	// @ts-ignore
	return data.items[0].id.videoId
}

export async function getTranscript(videoId: string) {
	try {
		let transcript_arr = await YoutubeTranscript.fetchTranscript(videoId, {
			lang: 'en',
			// country: 'EN',
		})
		let transcript = ''
		for (let t of transcript_arr) {
			transcript += t.text + ' '
		}
		return transcript.replaceAll('\n', '')
	} catch (error) {
		console.log(error)
		return ''
	}
}
