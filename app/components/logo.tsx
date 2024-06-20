import { Link } from "@remix-run/react";

export function Logo() {
	return (
		<Link to="/" className="group grid leading-snug">
			<span className="font-light transition group-hover:-translate-x-1">
				Epic
			</span>
			<span className="font-bold transition group-hover:translate-x-1">
				Forms
			</span>
		</Link>
	)
}
