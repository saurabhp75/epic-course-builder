export async function getUnsplashImage(query: string) {
	const response = await fetch(`
    https://api.unsplash.com/search/photos?per_page=1&query=${query}&client_id=${process.env.UNSPLASH_ACCESS_KEY}
    `)

	if (response.ok) {
		const res = await response.json()
        console.log(res)
        // @ts-ignore
		return res.results[0].urls.small_s3
	}
	// return an empty object
    return {}
}
