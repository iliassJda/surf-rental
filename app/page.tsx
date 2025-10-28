"use client";
import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";
import ConnectWallet from "@/components/connectWallet";
import { useWallet } from "@/contexts/WalletContext";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";

export default function Home() {
	const { isConnected, account, balance, connectWallet, isLoading } = useWallet();

	return (
		// <div>test</div>
		<section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
			<div className="inline-block max-w-xl text-center justify-center mb-6">
				<span className={title()}>Enjoy&nbsp;</span>
				<span className={title({ color: "blue" })}>surfing&nbsp;</span>
				<br />
				<span className={title()}>by renting or listing your board!</span>
				{/* <div className={subtitle({ class: "mt-4" })}>
					Beautiful, fast and modern React UI library.
				</div> */}
			</div>

			{!isLoading && isConnected ? (
				<div className="flex gap-3">
					<Link
						className={buttonStyles({
							color: "primary",
							radius: "full",
							variant: "shadow",
						})}
						href="/rent"
					>
						Rent Your Board
					</Link>
					<Link className={buttonStyles({ variant: "bordered", radius: "full" })} href="/list">
						{/* <GithubIcon size={20} /> */}
						List your Board
					</Link>
				</div>
			) : null}

			{!isLoading && isConnected ? (
				<div className="mt-8">
					<Snippet hideCopyButton hideSymbol variant="flat" className="">
						<div className="flex flex-col items-center gap-2 py-2">
							<span className={title({ size: "sm" })}>
								Wallet <span className={title({ color: "blue", size: "sm" })}> Connected</span>
							</span>

							<div className="flex flex-col sm:flex-row items-center gap-2 text-sm text-default-600">
								<span className="font-mono bg-default-100 px-2 py-1 rounded">
									{account?.slice(0, 6)}...{account?.slice(-4)}
								</span>
								<span className="hidden sm:inline">•</span>
								<span className="flex items-center gap-1">
									<span className="text-success-600 font-semibold">{balance} ETH</span>
								</span>
							</div>
						</div>
					</Snippet>
				</div>
			) : (
				<div className="mt-8">
					<Snippet hideCopyButton hideSymbol variant="bordered">
						<span>
							Get started by <ConnectWallet />{" "}
						</span>
					</Snippet>
				</div>
			)}
		</section>
	);
}
