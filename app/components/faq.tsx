import * as Craft from '#app/components/craft'
import { Badge } from '#app/components/ui/badge'
import { Button } from '#app/components/ui/button'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from './accordian'
import { Icon } from './ui/icon'

export const FAQ1 = () => (
	<div className="w-full py-20 lg:py-40">
		<div className="container mx-auto">
			<div className="grid gap-10 lg:grid-cols-2">
				<div className="flex flex-col gap-10">
					<div className="flex flex-col gap-4">
						<div>
							<Badge variant="outline">FAQ</Badge>
						</div>
						<div className="flex flex-col gap-2">
							<h4 className="font-regular max-w-xl text-left text-3xl tracking-tighter md:text-5xl">
								This is the start of something new
							</h4>
							<p className="max-w-xl text-left text-lg leading-relaxed tracking-tight text-muted-foreground lg:max-w-lg">
								Managing a small business today is already tough. Avoid further
								complications by ditching outdated, tedious trade methods. Our
								goal is to streamline SMB trade, making it easier and faster
								than ever.
							</p>
						</div>
						<div className="">
							<Button className="gap-4" variant="outline">
								Any questions? Reach out{' '}
								<Icon name="phone-call" className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
				<Accordion type="single" collapsible className="w-full">
					{Array.from({ length: 8 }).map((_, index) => (
						<AccordionItem key={index} value={'index-' + index}>
							<AccordionTrigger>
								This is the start of something new
							</AccordionTrigger>
							<AccordionContent>
								Managing a small business today is already tough. Avoid further
								complications by ditching outdated, tedious trade methods. Our
								goal is to streamline SMB trade, making it easier and faster
								than ever.
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>
		</div>
	</div>
)

const faq = [
	{
		question: 'What is Epic Course?',
		answer: `It is a platform to create any online course using AI`,
	},
	{
		question: 'How is Epic Course different from other course builders?',
		answer: `Epic course requires fewer steps and is faster than the competetion`,
	},

	{
		question: 'Can I build a non technical course using Epic Course?',
		answer: `Of course, you can build any course using Epic Course`,
	},
	{
		question: 'Can I get a refund?',
		answer: `You can get refund as per our refund policy`,
	},
	{
		question: 'I have another question.',
		answer: `You can reach out to me on X or send an email to contact@epicsaas.dev`,
	},
]

export const FAQ2 = () => (
	<div id="faq" className="w-full py-20 lg:py-40">
		<div className="container mx-auto">
			<div className="flex flex-col gap-10">
				<div className="flex flex-col items-center justify-center gap-4 text-center">
					<Badge variant="outline">FAQ</Badge>
					<div className="flex flex-col gap-2">
						<h4 className="font-regular max-w-xl text-center text-3xl tracking-tighter md:text-5xl">
							This is the start of something new
						</h4>
						<p className="max-w-xl text-center text-lg leading-relaxed tracking-tight text-muted-foreground">
							Creating an online course is tough. Use Epic Course builder to
							create any course in simple steps using the power of AI.
						</p>
					</div>
					<div>
						<Button className="gap-4" variant="outline">
							Any questions? Reach out{' '}
							<Icon name="phone-call" className="h-4 w-4" />
						</Button>
					</div>
				</div>

				<div className="mx-auto w-full max-w-3xl">
					<Accordion type="single" collapsible className="w-full">
						{faq.map((item, index) => (
							<AccordionItem key={index} value={'index-' + index}>
								<AccordionTrigger>{item.question}</AccordionTrigger>
								<AccordionContent className="whitespace-pre-line">
									{item.answer}
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</div>
			</div>
		</div>
	</div>
)

type FAQItem = {
	question: string
	answer: string
	link?: string
}

const content: FAQItem[] = [
	{
		question: 'Lorem ipsum dolor sit amet?',
		answer:
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
		link: 'https://google.com',
	},
	{
		question: 'Ut enim ad minim veniam?',
		answer:
			'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
	},
	{
		question: 'Duis aute irure dolor in reprehenderit?',
		answer:
			'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
	},
	{
		question: 'Excepteur sint occaecat cupidatat non proident?',
		answer:
			'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
	},
]

const FAQ3 = () => {
	return (
		<Craft.Section>
			<Craft.Container>
				<h3 id="faq" className="!mt-0">
					Frequently Asked Questions
				</h3>
				<h4 className="text-muted-foreground">
					Can&apos;t find the answer you&apos;re looking for? Reach out to our
					customer support team.
				</h4>
				<div className="not-prose mt-4 flex flex-col gap-4 md:mt-8">
					{content.map((item, index) => (
						<Accordion key={index} type="single" collapsible>
							<AccordionItem value={item.question}>
								<AccordionTrigger className="text-left">
									{item.question}
								</AccordionTrigger>
								<AccordionContent className="text-base md:w-3/4">
									{item.answer}
									{item.link && (
										<a
											href={item.link}
											className="mt-2 flex w-full items-center opacity-60 transition-all hover:opacity-100"
										>
											Learn more{' '}
											<Icon name="arrow-up-right" className="ml-1" size="md" />
										</a>
									)}
								</AccordionContent>
							</AccordionItem>
						</Accordion>
					))}
				</div>
			</Craft.Container>
		</Craft.Section>
	)
}

export default FAQ3
