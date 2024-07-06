import { Badge } from '#app/components/ui/badge'
import { Button } from '#app/components/ui/button'
import { Icon } from './ui/icon'

export const CTA2 = () => (
	<div className="w-full bg-muted py-20 lg:py-40">
		<div className="container mx-auto">
			<div className="flex flex-col items-center gap-4 py-14 text-center">
				<div>
					<Badge>Get started</Badge>
				</div>
				<div className="flex flex-col gap-2">
					<h3 className="font-regular max-w-xl text-3xl tracking-tighter md:text-5xl">
						Try our platform today!
					</h3>
					<p className="max-w-xl text-lg leading-relaxed tracking-tight text-muted-foreground">
						Managing a small business today is already tough. Avoid further
						complications by ditching outdated, tedious trade methods. Our goal
						is to streamline SMB trade, making it easier and faster than ever.
					</p>
				</div>
				<div className="flex flex-row gap-4">
					<Button className="gap-4" variant="outline">
						Jump on a call <Icon name="phone-call" className="h-4 w-4" />
					</Button>
					<Button className="gap-4">
						Sign up here <Icon name="move-right" className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	</div>
)
