"use client";

"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function ConnectWallet() {
	const [account, setAccount] = useState<string | null>(null);

	// Check if wallet already connected
	useEffect(() => {
		if (typeof window !== "undefined" && (window as any).ethereum) {
			(window as any).ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
				if (accounts.length > 0) setAccount(accounts[0]);
			});
		}
	}, []);

	async function connectWallet() {
		if (!(window as any).ethereum) {
			alert("MetaMask is not installed. Please install it to use this app.");
			return;
		}

		try {
			const provider = new ethers.BrowserProvider((window as any).ethereum);
			const accounts = await provider.send("eth_requestAccounts", []);
			setAccount(accounts[0]);
		} catch (error) {
			console.error("Error connecting to MetaMask:", error);
		}
	}

	return (
		<button
			onClick={connectWallet}
			className="px-3 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-lg hover:opacity-90 transition-all ml-1"
		>
			{account
				? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}`
				: "Connecting your Wallet"}
		</button>
	);
}
