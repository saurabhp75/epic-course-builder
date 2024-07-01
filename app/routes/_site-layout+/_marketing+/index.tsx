import { type MetaFunction } from '@remix-run/node'
import { Link } from '@remix-run/react'
import { Button } from '#app/components/ui/button.js'
import { Icon } from '#app/components/ui/icon.js'

export const meta: MetaFunction = () => [{ title: 'Epic Notes' }]

export default function Index() {
	return (
		<main className="font-poppins grid h-full place-items-center">
			<div className="flex flex-col gap-2">
				<Button asChild>
					<Link to={'create'} className="flex gap-2">
						Create Course <Icon name="sparkles-outline" size="font" />
					</Link>
				</Button>
				<Button asChild>
					<Link to={'gallery'}>Gallery</Link>
				</Button>
			</div>
		</main>
	)
}
