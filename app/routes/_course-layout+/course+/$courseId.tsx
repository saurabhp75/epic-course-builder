import { Outlet } from '@remix-run/react'

// This is a layout route
export default function CourseId() {
	return (
		<div>
			<h1>Layout Route for courseId</h1>
			<Outlet />
		</div>
	)
}
