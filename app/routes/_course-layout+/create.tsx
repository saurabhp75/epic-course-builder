import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { type LoaderFunctionArgs, json } from '@remix-run/node'
// import { useLoaderData } from '@remix-run/react'
import { Form } from '@remix-run/react'
import { HoneypotInputs } from 'remix-utils/honeypot/react'
import { z } from 'zod'
import { Field } from '#app/components/forms.js'
import { Button } from '#app/components/ui/button.js'
import { Icon } from '#app/components/ui/icon.js'
import { requireUserId } from '#app/utils/auth.server.js'

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	return json({ userId })
}
export default function Create() {
	// const data = useLoaderData<typeof loader>()
	// const isPro = await checkSubscription()
	return (
		<div className="mx-auto my-16 flex max-w-xl flex-col items-start px-8 sm:px-0">
			<h1 className="self-center text-center text-3xl font-bold sm:text-6xl">
				Create Your Course
			</h1>
			<div className="mt-5 flex border-none bg-secondary p-4">
				<Icon name="info" className="mr-3 h-12 w-12 text-blue-400" />
				<div>
					Enter in a course title, or what you want to learn about. Then enter a
					list of units, which are the specifics you want to learn. And our AI
					will generate a course for you!
				</div>
			</div>

			<CreateCourseForm isPro />
		</div>
	)
}

type Props = { isPro: boolean }
export const createChaptersSchema = z.object({
	title: z.string().min(3).max(100),
	units: z.array(z.string()),
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CreateCourseForm({ isPro }: Props) {
	const [form, fields] = useForm({
		constraint: getZodConstraint(createChaptersSchema),
		// lastResult: forgotPassword.data?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: createChaptersSchema })
		},
		defaultValue: {
			title: '',
			units: ['', '', ''],
			// title: 'Calculus',
			// units: ['Introduction', 'Differentiation', 'Integration'],
		},
		// shouldRevalidate: 'onBlur',
	})
	const units = fields.units.getFieldList()

	// const { toast } = useToast()
	// Toast on success and error

	return (
		<div className="w-full">
			<Form
				method="POST"
				action="/resources/create-chapters"
				{...getFormProps(form)}
				className="mt-4 w-full"
			>
				{/*
					This hidden submit button is here to ensure that when the user hits
					"enter" on an input field, the primary form function is submitted
					rather than the first button in the form (which is delete unit).
				*/}
				<button type="submit" className="hidden" />
				<HoneypotInputs />
				<Field
					labelProps={{
						htmlFor: fields.title.id,
						children: 'Title:',
					}}
					inputProps={{
						autoFocus: true,
						...getInputProps(fields.title, { type: 'text' }),
						placeholder: 'Enter the main topic of the course',
					}}
					errors={fields.title.errors}
				/>
				<ul>
					{units.map((unit, index) => {
						// Delete key to remove key prop related warning
						const inputProps = getInputProps(unit, { type: 'text' })
						delete inputProps.key
						return (
							<li key={unit.key}>
								<div className="flex items-center gap-3">
									<Field
										labelProps={{
											htmlFor: unit.id,
											children: `Unit ${index + 1}:`,
										}}
										inputProps={{
											...inputProps,
											placeholder: 'Enter the subtopic',
										}}
										errors={unit.errors}
									/>
									<Button
										variant={'destructive'}
										size={'icon'}
										{...form.remove.getButtonProps({
											name: fields.units.name,
											index,
										})}
									>
										<Icon name="cross-1" size="xs" />
									</Button>
								</div>
							</li>
						)
					})}
				</ul>
				<Button
					className="flex gap-1"
					{...form.insert.getButtonProps({
						name: fields.units.name,
					})}
				>
					<Icon name="plus" />
					Add unit
				</Button>
				<div id={form.errorId}>{form.errors}</div>
				<Button type="submit" className="mt-2">
					Create course
				</Button>
			</Form>
		</div>
	)
}
