"use client";
import { useSurfRental } from "@/hooks/useSurfRental";
import { useWallet } from "@/contexts/WalletContext";
import { useEffect, useState } from "react";
import { Board } from "@/config/site";
import { Button } from "@heroui/button";
import { ethers } from "ethers";
import { createClient } from "@/utils/supabase/client";

export default function GetAllBoards() {
	const { getAllBoards, resetBoards } = useSurfRental();
	const { isConnected, connectWallet } = useWallet();
	const [boards, setBoards] = useState<Board[]>([]);
	const [loading, setLoading] = useState(false);
	const [reset, setReset] = useState<string | null>(null);
	const [supa, setSupa] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [refreshKey, setRefreshKey] = useState(0); // Add refresh trigger

	const fetchBoards = async () => {
		if (!isConnected) return;

		setLoading(true);
		setError(null);
		try {
			const contractBoards = await getAllBoards();
			setBoards(contractBoards);
			console.log("Fetched boards:", contractBoards);
		} catch (error: any) {
			console.error("Failed to fetch boards from contract:", error);
			setError(error.message || "Failed to fetch boards");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchBoards();
	}, [isConnected, getAllBoards, refreshKey]); // Include getAllBoards and refreshKey

	const handleRefresh = () => {
		setRefreshKey((prev) => prev + 1); // Trigger re-fetch
	};

	const handlePress = async () => {
		setReset(null);
		setSupa(null);
		const supabase = await createClient();
		const { errorMessage } = await resetBoards();
		if (errorMessage) {
			setReset(("[CONTRACT] " + errorMessage) as string);
		} else {
			setReset("[CONTRACT] Reset has been performed successfuly");
		}

		const { error } = await supabase.from("Boards").delete().neq("id", -1);

		if (error) {
			setSupa("[SUPABASE] Error: " + error.message);
		} else {
			setSupa("[SUPABASE] Rows have been deleted");
		}

		// Refresh boards after reset
		// handleRefresh();
	};

	// if (!isConnected) {
	// 	return (
	// 		<div className="flex flex-col items-center justify-center min-h-[400px] text-center">
	// 			<h2 className="text-xl font-semibold mb-4">Connect Wallet</h2>
	// 			<p className="text-default-600 mb-6">
	// 				Please connect your wallet to view boards from the smart contract
	// 			</p>
	// 			<Button onPress={connectWallet} color="primary" variant="shadow">
	// 				Connect Wallet
	// 			</Button>
	// 		</div>
	// 	);
	// }

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<p>Loading boards from smart contract...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[400px] text-center">
				<h2 className="text-xl font-semibold mb-4 text-danger">Error</h2>
				<p className="text-default-600 mb-6">{error}</p>
				<Button onPress={() => window.location.reload()} color="primary" variant="bordered">
					Retry
				</Button>
			</div>
		);
	}

	return (
		<div>
			<div className="mb-6">
				<h1 className="text-2xl font-bold">All Boards from Smart Contract</h1>
				<p className="text-default-600">Found {boards.length} board(s)</p>
				<div className="flex gap-2 mt-1.5">
					<Button onPress={handleRefresh} color="primary" variant="flat" isLoading={loading}>
						Refresh Boards
					</Button>
					<Button onPress={handlePress} color="secondary" variant="flat">
						Reset Contract
					</Button>
				</div>
				{reset && (
					<div
						className={`mt-2 text-sm ${reset.includes("Error") ? "text-danger" : "text-success"}`}
					>
						{reset}
					</div>
				)}
				{supa && (
					<div
						className={`mt-2 text-sm ${supa.includes("Error") ? "text-danger" : "text-success"}`}
					>
						{supa}
					</div>
				)}
			</div>

			{boards.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-default-600">No boards found in the smart contract</p>
				</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{boards.map((board: Board) => (
						<div
							key={board.id || Math.random()}
							className="p-4 border border-default-200 rounded-lg"
						>
							<div className="flex justify-between items-start mb-2">
								<h3 className="font-semibold">{board.description}</h3>
								<span className="text-xs bg-default-100 px-2 py-1 rounded">ID: {board.id}</span>
							</div>
							<div className="text-sm text-default-600 space-y-1">
								<p>
									<strong>Price:</strong> {ethers.formatEther(board.pricePerDay)} ETH/day
								</p>
								<p>
									<strong>Deposit:</strong> {ethers.formatEther(board.deposit)} ETH
								</p>
								<p>
									<strong>Owner:</strong> {board.owner.slice(0, 6)}...{board.owner.slice(-4)}
								</p>
								<p>
									<strong>Status:</strong>
									<span
										className={`ml-1 px-2 py-1 rounded text-xs ${
											board.status === 0
												? "bg-success-100 text-success-800"
												: board.status === 1
													? "bg-warning-100 text-warning-800"
													: "bg-danger-100 text-danger-800"
										}`}
									>
										{board.status === 0
											? "Ready"
											: board.status === 1
												? "Returned"
												: board.status === undefined
													? "Goat Alexis"
													: "Rented"}
									</span>
								</p>
								{board.renter && board.renter !== "0x0000000000000000000000000000000000000000" && (
									<p>
										<strong>Renter:</strong> {board.renter.slice(0, 6)}...{board.renter.slice(-4)}
									</p>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
