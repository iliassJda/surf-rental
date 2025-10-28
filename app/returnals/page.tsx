import { title } from "@/components/primitives";
import ReturnalList from "@/components/returnalList";

export default function Returnals() {
	return (
		<section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
			<div className="inline-block max-w-xl text-center justify-center mb-6">
				<h1 className={title()}>
					<span className={title({ color: "blue" })}>Your&nbsp;</span>returnals
				</h1>
			</div>
			<ReturnalList />
		</section>
	);
}
