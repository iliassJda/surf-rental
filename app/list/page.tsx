import { title } from "@/components/primitives";
import ListForm from "@/components/listBoardForm";

export default function PricingPage() {
	return (
		// <div>
		// 	<h1 className={title()}>List your board</h1>
		// 	<ListForm />
		// </div>
		<section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
			<div className="inline-block max-w-xl text-center justify-center mb-6">
				<h1 className={title()}>
					List your <span className={title({ color: "blue" })}>Board&nbsp;</span>
				</h1>
			</div>
			<ListForm />
		</section>
	);
}
