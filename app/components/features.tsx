import { Badge } from '#app/components/ui/badge'
import { Icon } from './ui/icon'

export const Feature1 = () => (
	<div id="features" className="w-full py-20 lg:py-40">
		<div className="container mx-auto">
			<div className="container grid grid-cols-1 items-center gap-8 rounded-lg border py-8 lg:grid-cols-2">
				<div className="flex flex-col gap-10">
					<div className="flex flex-col gap-4">
						<div>
							<Badge variant="outline">EpicCourse</Badge>
						</div>
						<div className="flex flex-col gap-2">
							<h2 className="font-regular max-w-xl text-left text-3xl tracking-tighter lg:text-5xl">
								Something new!
							</h2>
							<p className="max-w-xl text-left text-lg leading-relaxed tracking-tight text-muted-foreground">
								Creating a course today is already tough.
							</p>
						</div>
					</div>
					<div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-3 lg:grid-cols-1 lg:pl-6">
						<div className="flex flex-row items-start gap-6">
							<Icon name="check" className="mt-2 h-4 w-4 text-primary" />
							<div className="flex flex-col gap-1">
								<p>Easy to use</p>
								<p className="text-sm text-muted-foreground">
									We&apos;ve made it easy to create courses.
								</p>
							</div>
						</div>
						<div className="flex flex-row items-start gap-6">
							<Icon name="check" className="mt-2 h-4 w-4 text-primary" />
							<div className="flex flex-col gap-1">
								<p>Fast and reliable</p>
								<p className="text-sm text-muted-foreground">
									We&apos;ve made creating a course fast and reliable.
								</p>
							</div>
						</div>
						<div className="flex flex-row items-start gap-6">
							<Icon name="check" className="mt-2 h-4 w-4 text-primary" />
							<div className="flex flex-col gap-1">
								<p>Beautiful and modern</p>
								<p className="text-sm text-muted-foreground">
									We&apos;ve made it beautiful and modern.
								</p>
							</div>
						</div>
					</div>
				</div>
				<div className="aspect-square rounded-md bg-muted"></div>
			</div>
		</div>
	</div>
)
