import { title } from "@/components/primitives";
import ListRent from "@/components/rentList";

export default function DocsPage() {
	return (
		<section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
			<div className="inline-block max-w-xl text-center justify-center mb-6">
				<h1 className={title()}>
					Rent your <span className={title({ color: "blue" })}>Board&nbsp;</span>
				</h1>
			</div>
			<ListRent />
		</section>
	);
}
