"use client";

import { Form } from "@heroui/form";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { useWallet } from "@/contexts/WalletContext";
import { createClient } from "@/utils/supabase/client";
import { useState } from "react";
import { Board } from "@/config/site";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/utils/constants";
import { ethers } from "ethers";

// interface Board {
// 	description: string;
// 	owner: string;
// 	renter: string;
// 	pricePerDay: number;
// 	deposit: number;
// 	status: number;
// }

export default function ListForm() {
	const supabase = createClient();
	const { isConnected, account, balance, connectWallet, isLoading } = useWallet();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitMessage, setSubmitMessage] = useState<string | null>(null);

	if (!isConnected) {
		return (
			<div className="w-full max-w-xs text-center">
				<p className="mb-4 text-default-600">Please connect your wallet to list a board</p>
				<Button onPress={connectWallet} color="primary" variant="shadow">
					Connect Wallet
				</Button>
			</div>
		);
	}

	const submit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);
		setSubmitMessage(null);

		const formData = new FormData(e.currentTarget);

		const description = formData.get("description") as string;
		// Normalize decimals (handle locales using comma) and trim
		const rawPrice = ((formData.get("priceperday") as string) || "").replace(",", ".").trim();
		const rawDeposit = ((formData.get("deposit") as string) || "").replace(",", ".").trim();

		if (!rawPrice || !rawDeposit) {
			setIsSubmitting(false);
			setSubmitMessage("Please provide both price and deposit.");
			return;
		}

		// Validate numeric inputs
		const priceEthNum = Number(rawPrice);
		const depositEthNum = Number(rawDeposit);
		if (
			!Number.isFinite(priceEthNum) ||
			!Number.isFinite(depositEthNum) ||
			priceEthNum < 0 ||
			depositEthNum < 0
		) {
			setIsSubmitting(false);
			setSubmitMessage("Price and deposit must be valid positive numbers.");
			return;
		}

		// Convert to wei for the contract call (BigInt, not serialized)
		let priceWei: bigint;
		let depositWei: bigint;
		try {
			priceWei = ethers.parseEther(rawPrice);
			depositWei = ethers.parseEther(rawDeposit);
		} catch (convErr) {
			console.error("Failed to parse ETH amounts:", convErr);
			setIsSubmitting(false);
			setSubmitMessage("Invalid number format. Use a dot for decimals, e.g., 2.12");
			return;
		}

		try {
			const provider = new ethers.BrowserProvider((window as any).ethereum);
			const signer = await provider.getSigner();
			const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

			const tx = await contract.listBoard(description, priceWei, depositWei);
			const receipt = await tx.wait();

			const event = receipt.logs
				.map((log: any) => {
					try {
						return contract.interface.parseLog(log);
					} catch {
						return null;
					}
				})
				.find((parsed: any) => parsed?.name === "BoardListed");

			const boardId = event?.args?.boardId.toString();

			console.log("This is the boardId", boardId);

			// Store human-readable ETH amounts (strings) in Supabase; avoid BigInt serialization
			const newData: Board = {
				id: boardId,
				description: description,
				owner: account as string,
				// owner: signer.address,
				renter: "",
				pricePerDay: rawPrice,
				deposit: rawDeposit,
				status: 0,
			};

			const { data, error } = await supabase.from("Boards").insert([newData]);

			if (error) {
				// console.log("Error inserting data:", error);
				setSubmitMessage(`Error: ${error.message}`);
			} else {
				console.log("Data inserted successfully:", data);
				setSubmitMessage("Board listed successfully!");
				// Reset form
				// e.currentTarget.reset();
			}
		} catch (err) {
			// console.error("Unexpected error:", err);
			setSubmitMessage("An unexpected error occurred");
		} finally {
			setIsSubmitting(false);
		}
		// try {
		// 	const formData = new FormData(e.currentTarget);

		// 	const newData: Board = {
		// 		description: formData.get("description") as string,
		// 		owner: account as string,
		// 		renter: "",
		// 		pricePerDay: Number(formData.get("priceperday") as string),
		// 		deposit: Number(formData.get("deposit") as string),
		// 		status: 0,
		// 	};

		// 	const { data, error } = await supabase
		// 		.from("Boards") // Replace 'boards' with your actual table name
		// 		.insert([newData])
		// 		.select();

		// 	if (error) {
		// 		console.error("Error inserting data:", error);
		// 		setSubmitMessage(`Error: ${error.message}`);
		// 	} else {
		// 		console.log("Data inserted successfully:", data);
		// 		setSubmitMessage("Board listed successfully!");
		// 		// Reset form
		// 		// e.currentTarget.reset();
		// 	}
		// } catch (error) {
		// 	console.error("Unexpected error:", error);
		// 	setSubmitMessage("An unexpected error occurred");
		// } finally {
		// 	setIsSubmitting(false);
		// }
	};
	return (
		<div className="w-full max-w-xs">
			<Form className="w-full" onSubmit={submit}>
				<Input
					isRequired
					label="Description"
					labelPlacement="outside"
					name="description"
					placeholder="Enter the board's description"
					type="text"
				/>
				<Input
					isRequired
					label="Price"
					labelPlacement="outside"
					name="priceperday"
					placeholder="0.00"
					min="0"
					step="0.01"
					startContent={
						<div className="pointer-events-none flex items-center">
							<span className="text-default-400 text-small">ETH</span>
						</div>
					}
					type="number"
				/>
				<Input
					isRequired
					label="Deposit"
					labelPlacement="outside"
					name="deposit"
					placeholder="0.00"
					min="0"
					step="0.01"
					startContent={
						<div className="pointer-events-none flex items-center">
							<span className="text-default-400 text-small">ETH</span>
						</div>
					}
					type="number"
				/>
				<Button
					type="submit"
					color="primary"
					variant="shadow"
					isLoading={isSubmitting}
					disabled={isSubmitting}
				>
					{isSubmitting ? "Listing..." : "Submit"}
				</Button>
				{submitMessage && (
					<div
						className={`mt-2 text-sm ${submitMessage.includes("Error") ? "text-danger" : "text-success"}`}
					>
						{submitMessage}
					</div>
				)}
			</Form>
		</div>
	);
}
