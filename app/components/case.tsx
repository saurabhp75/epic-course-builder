import { useEffect, useState } from 'react'
import { logos } from '../../assets/logos/logos'
import {
	Carousel,
	type CarouselApi,
	CarouselContent,
	CarouselItem,
} from './ui/carousel'

export const Case1 = () => {
	const [api, setApi] = useState<CarouselApi>()
	const [current, setCurrent] = useState(0)

	useEffect(() => {
		if (!api) {
			return
		}

		setTimeout(() => {
			if (api.selectedScrollSnap() + 1 === api.scrollSnapList().length) {
				setCurrent(0)
				api.scrollTo(0)
			} else {
				api.scrollNext()
				setCurrent(current + 1)
			}
		}, 1000)
	}, [api, current])

	return (
		<div className="w-full py-20 lg:py-40">
			<div className="container mx-auto">
				<div className="flex flex-col gap-10">
					<h2 className="font-regular text-left text-xl tracking-tighter sm:text-3xl md:text-5xl lg:max-w-xl">
						Trusted by thousands of businesses worldwide
					</h2>
					<Carousel setApi={setApi} className="w-full">
						<CarouselContent>
							{logos.map((logo, index) => (
								<CarouselItem className="basis-1/4 lg:basis-1/6" key={index}>
									<div className="flex aspect-square items-center justify-center rounded-md bg-muted p-6">
										<a
											href={logo.href}
											className="grid size-20 place-items-center rounded-2xl bg-violet-600/10 p-1 dark:bg-violet-200 dark:hover:bg-violet-100 sm:size-24"
										>
											<img src={logo.src} alt="" />
										</a>
									</div>
								</CarouselItem>
							))}
						</CarouselContent>
					</Carousel>
				</div>
			</div>
		</div>
	)
}

export const Case2 = () => {
	const [api, setApi] = useState<CarouselApi>()
	const [current, setCurrent] = useState(0)

	useEffect(() => {
		if (!api) {
			return
		}

		setTimeout(() => {
			if (api.selectedScrollSnap() + 1 === api.scrollSnapList().length) {
				setCurrent(0)
				api.scrollTo(0)
			} else {
				api.scrollNext()
				setCurrent(current + 1)
			}
		}, 1500)
	}, [api, current])

	return (
		<div className="w-full py-20 lg:py-40">
			<div className="container mx-auto">
				<div className="grid grid-cols-5 items-center gap-10">
					<h3 className="font-regular text-left text-xl tracking-tighter lg:max-w-xl">
						Trusted by market leaders
					</h3>
					<div className="relative col-span-4 w-full">
						<div className="absolute bottom-0 left-0 right-0 top-0 z-10 h-full w-full bg-gradient-to-r from-background via-white/0 to-background"></div>
						<Carousel setApi={setApi} className="w-full">
							<CarouselContent>
								{logos.map((logo, index) => (
									<CarouselItem className="basis-1/4 lg:basis-1/6" key={index}>
										<div className="flex aspect-square items-center justify-center rounded-md bg-muted p-2">
											<a
												href={logo.href}
												className="grid size-20 place-items-center rounded-2xl bg-violet-600/10 p-1 dark:bg-violet-200 dark:hover:bg-violet-100 sm:size-24"
											>
												<img src={logo.src} alt="" />
											</a>
										</div>
									</CarouselItem>
								))}
							</CarouselContent>
						</Carousel>
					</div>
				</div>
			</div>
		</div>
	)
}
