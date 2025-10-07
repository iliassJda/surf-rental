"use client";

import { createClient } from "@/utils/supabase/client";
import { useWallet } from "@/contexts/WalletContext";

import { Button } from "@heroui/button";
import {
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	useDisclosure,
} from "@heroui/modal";
import { addToast } from "@heroui/toast";
import { useEffect, useState } from "react";
import { Board } from "@/config/site";
import { useSurfRental } from "@/hooks/useSurfRental";
import { useRouter } from "next/navigation";
// import { useRouter } from "next/router";

export default function ListRent() {
	const [data, setData] = useState<Board[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	// const [realtimeStatus, setRealtimeStatus] = useState<string>("Connecting...");
	const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
	const [isRenting, setIsRenting] = useState(false);
	const supabase = createClient();
	const { isOpen, onOpen, onOpenChange } = useDisclosure();
	const router = useRouter();

	const { isConnected, account, balance, connectWallet, isLoading } = useWallet();
	const { rentBoard } = useSurfRental();
	// const { rentBoard, isLoading: contractLoading, error: contractError } = useContract();

	const handleRentClick = (board: Board) => {
		setSelectedBoard(board);
		onOpen();
	};

	const handleConfirmRent = async () => {
		// if (!selectedBoard || !selectedBoard.id) return;
		if (!selectedBoard) return;

		setIsRenting(true);
		try {
			// Call smart contract rent function
			await rentBoard(
				selectedBoard.id as number,
				selectedBoard.pricePerDay.toString(),
				selectedBoard.deposit.toString()
			);

			// Update Supabase to mark as rented
			const { error: updateError } = await supabase
				.from("Boards")
				.update({
					status: 2, // rented
					renter: account,
				})
				.eq("id", selectedBoard.id);

			if (updateError) {
				console.error("Error updating database:", updateError);
			}

			// Close modal and show success
			onOpenChange();
			setSelectedBoard(null);
		} catch (error: any) {
			console.error("Rental failed:", error);
		} finally {
			setIsRenting(false);
			router.refresh();
			// router.reload();
			addToast({
				title: "Board Rented",
				description: "Board rented succesfully",
				color: "success",
			});
		}
	};

	const calculateTotalCost = (board: Board) => {
		return Number(board.pricePerDay) + Number(board.deposit);
		// return board.pricePerDay + board.deposit;
	};

	const hasEnoughBalance = (board: Board) => {
		if (!balance) return false;
		const totalCost = calculateTotalCost(board);
		return parseFloat(balance) >= parseFloat(totalCost.toString());
	};

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				setError(null);

				// Fetch boards that are available for rent (status = 0)
				const { data: boardsData, error: fetchError } = await supabase
					.from("Boards") // Make sure this matches your actual table name
					.select("*")
					.eq("status", 0); // Only get available boards

				if (fetchError) {
					console.error("Fetch error:", fetchError);
					setError(`Error fetching boards: ${fetchError.message}`);
				} else {
					setData(boardsData || []);
				}
			} catch (err) {
				console.error("Unexpected error:", err);
				setError("An unexpected error occurred");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [supabase]);

	// const {data, error} = supabase.from("Boards").select("*");

	if (!isConnected) {
		return (
			<div className="w-full max-w-xs text-center">
				<p className="mb-4 text-default-600">Please connect your wallet to rent a board</p>
				<Button onPress={connectWallet} color="primary" variant="shadow">
					Connect Wallet
				</Button>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="w-full text-center">
				<p>Loading available boards...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="w-full text-center text-danger">
				<p>{error}</p>
				<Button
					onPress={() => window.location.reload()}
					color="primary"
					variant="bordered"
					className="mt-2"
				>
					Retry
				</Button>
			</div>
		);
	}

	if (data.length === 0) {
		return (
			<div className="w-full text-center">
				<p className="text-default-600">No boards available for rent at the moment.</p>
			</div>
		);
	}

	return (
		<div className="w-full">
			<h2 className="text-xl font-bold mb-4">Available Surf Boards</h2>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{data.map((board: Board, index: number) =>
					board.owner == account ? null : (
						<div key={index} className="p-4 border border-default-200 rounded-lg">
							<h3 className="font-semibold mb-2">{board.description}</h3>
							<div className="text-sm text-default-600 space-y-1">
								<p>
									<strong>Price:</strong> {board.pricePerDay} ETH/day
								</p>
								<p>
									<strong>Deposit:</strong> {board.deposit} ETH
								</p>
								{/* <p>
									<strong>Owner:</strong> {board.owner.slice(0, 6)}...{board.owner.slice(-4)}
								</p> */}
							</div>
							<Button
								color="primary"
								variant="shadow"
								className="mt-3 w-full"
								size="sm"
								onPressUp={() => handleRentClick(board)}
							>
								Rent Board
							</Button>
						</div>
					)
				)}
			</div>

			{/* Rental Confirmation Modal */}
			<Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">Confirm Board Rental</ModalHeader>
							<ModalBody>
								{selectedBoard && (
									<div className="space-y-4">
										<div>
											<h3 className="font-semibold text-lg">{selectedBoard.description}</h3>
											<p className="text-sm text-default-600">
												Owner: {selectedBoard.owner.slice(0, 6)}...{selectedBoard.owner.slice(-4)}
											</p>
										</div>

										<div className="bg-default-100 p-4 rounded-lg space-y-2">
											<div className="flex justify-between">
												<span>Rental Price (1 day):</span>
												<span className="font-semibold">{selectedBoard.pricePerDay} ETH</span>
											</div>
											<div className="flex justify-between">
												<span>Security Deposit:</span>
												<span className="font-semibold">{selectedBoard.deposit} ETH</span>
											</div>
											<hr className="my-2" />
											<div className="flex justify-between text-lg font-bold">
												<span>Total Cost:</span>
												<span className="text-primary">
													{calculateTotalCost(selectedBoard)} ETH
												</span>
											</div>
										</div>

										<div className="text-sm text-default-600">
											<p>• The rental fee goes directly to the owner</p>
											<p>
												• Your deposit will be returned when you return the board in good condition
											</p>
											<p>• Make sure you have enough ETH in your wallet</p>
										</div>

										{balance && (
											<div className="text-sm">
												<span>Your Balance: </span>
												<span
													className={`font-semibold ${
														hasEnoughBalance(selectedBoard) ? "text-success" : "text-danger"
													}`}
												>
													{balance} ETH
												</span>
											</div>
										)}

										{/* {contractError && (
											<div className="text-danger text-sm">Error: {contractError}</div>
										)} */}
									</div>
								)}
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onPress={onClose}>
									Cancel
								</Button>
								<Button
									color="primary"
									onPress={handleConfirmRent}
									isLoading={isRenting}
									isDisabled={!selectedBoard || !hasEnoughBalance(selectedBoard)}
								>
									{isRenting ? "Processing..." : "Confirm Rental"}
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</div>
	);
}
