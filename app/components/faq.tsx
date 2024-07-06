import * as Craft from '#app/components/craft'
import { Badge } from '#app/components/ui/badge'
import { Button } from '#app/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordian'
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
		question: 'What is EpicSaaS?',
		answer: `1) The Remix.run starter with all the boilerplate code you need
	to run an online business: a payment system, a database,
	login, a blog, UI components, and much more. 

2) The documentation helps you set up your app from scratch,
     write copy that sells, and ship fast.

3) Access to our Discord with makers who build fast to stay accountable!`,
	},
	{
		question: 'How is EpicSaaS different from other SaaS starters?',
		answer: `1) EpicSaaS has one of the most complete auth among SaaS starters. 

2) It is dockerised so you can deploy on almost all the cloud providers.

3) It includes e2e and unit tests with mocks included so you don't even need internet to test`,
	},

	{
		question: 'Does OneMix use JavaScript or TypeScript?',
		answer: `TypeScript. Let me know if you prefer JavaScript.`,
	},
	{
		question: 'Can I use a different tech stack?',
		answer: `If you know React and Remix, you can customize in anyway. Change payments from Stripe to PayPal, email from Resend to Mailgun, and so on.`,
	},
	{
		question: 'Can I get a refund?',
		answer: `After you get access to the repo, EpicSaaS is yours forever, so there can be no refund.`,
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
							Managing a small business today is already tough. Avoid further
							complications by ditching outdated, tedious trade methods. Our
							goal is to streamline SMB trade, making it easier and faster than
							ever.
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
