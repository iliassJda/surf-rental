"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Board } from "@/config/site";
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
import { useRouter } from "next/navigation";
import { useSurfRental } from "@/hooks/useSurfRental";
import { addToast } from "@heroui/toast";
import { Switch } from "@heroui/switch";

export default function ReturnalList() {
	const [data, setData] = useState<Board[]>([]);
	// const [returnData, setReturnData] = useState<Board[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [boardOk, setBoardOk] = useState(true);
	// const [realtimeStatus, setRealtimeStatus] = useState<string>("Connecting...");
	const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
	const [isReturning, setIsReturning] = useState(false);
	const supabase = createClient();
	const { isOpen, onOpen, onOpenChange } = useDisclosure();
	const router = useRouter();

	const { isConnected, account, balance, connectWallet, isLoading } = useWallet();
	const { returnDeposit } = useSurfRental();

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				setError(null);

				let boardsData;

				// Fetch boards that are rented (status = 2)
				const { data: rawData, error: fetchError } = await supabase
					.from("Boards") // Make sure this matches your actual table name
					.select("*")
					.eq("status", 1);

				boardsData = rawData?.filter((board: Board) => board.owner === account) || [];

				if (fetchError) {
					console.error("Fetch error:", fetchError);
					setError(`Error fetching boards: ${fetchError.message}`);
				} else {
					setData(boardsData);
				}
			} catch (err) {
				console.error("Unexpected error:", err);
				setError("An unexpected error occurred");
			} finally {
				setLoading(false);
			}
		};
		if (account) {
			fetchData();
		}
	}, [supabase, account]);

	const handleReturnBoard = (board: Board) => {
		setSelectedBoard(board);
		onOpen();
	};

	const handleConfirmDeposit = async () => {
		// if (!selectedBoard || !selectedBoard.id) return;
		if (!selectedBoard) return;

		setIsReturning(true);
		try {
			// Call smart contract deposit function
			await returnDeposit(selectedBoard, boardOk);

			// Update Supabase to mark as rented
			const { error: updateError } = await supabase
				.from("Boards")
				.update({
					status: 0, // ready
					renter: null,
				})
				.eq("id", selectedBoard.id);

			if (updateError) {
				console.error("Error updating database:", updateError);
				addToast({
					title: "Error Updating SUPABASE",
					description: "Unexpected error has occured while updating the database",
					color: "danger",
				});
			}

			// Close modal and show success
			onOpenChange();
			setSelectedBoard(null);
			setBoardOk(true);
		} catch (error: any) {
			console.error("Deposit failed:", error);
		} finally {
			setIsReturning(false);
			// router.refresh();
			// router.reload();
			addToast({
				title: boardOk ? "Deposit returned" : "Deposit Kept",
				description: boardOk
					? "Deposit returned succesfully"
					: "Deposit is kept due to the condition of the board",
				color: boardOk ? "success" : "danger",
			});
		}
	};

	if (!isConnected) {
		return (
			<div className="w-full max-w-xs text-center">
				<p className="mb-4 text-default-600">Please connect your wallet to see your boards</p>
				<Button onPress={connectWallet} color="primary" variant="shadow">
					Connect Wallet
				</Button>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="w-full text-center">
				<p>Loading your boards...</p>
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
				<p className="text-default-600">No returnals yet</p>
			</div>
		);
	}

	return (
		<div className="w-full">
			<h2 className="text-xl font-bold mb-4">Returned Boards</h2>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
				{data.map((board: Board, index: number) => (
					<div key={index} className="border border-default-200 rounded-lg">
						{/* Board Content */}
						<div className="p-6">
							<h3 className="font-bold text-lg text-foreground mb-3 pr-16">{board.description}</h3>

							<div className="space-y-3 mb-6">
								<div
									className={`flex items-center justify-between p-3 ${boardOk ? "bg-primary-100" : "bg-danger-100"} rounded-lg`}
								>
									<span className="text-sm font-medium text-default-600">Deposit Paid</span>
									<span className="font-bold text-primary-500">{board.deposit} ETH</span>
								</div>
								<div className="flex items-center justify-between p-3 bg-default-50 rounded-lg">
									<span className="text-sm font-medium text-default-600">renter</span>
									<span className="font-mono text-sm text-foreground">
										{board.renter.slice(0, 6)}...{board.renter.slice(-4)}
									</span>
								</div>
								<Switch isSelected={boardOk} onValueChange={setBoardOk}>
									Board Condition
								</Switch>
								<p className="text-small text-default-500">
									Selected: {boardOk ? "Good condition" : "Kapoot"}
								</p>
							</div>

							<Button
								color={`${boardOk ? "primary" : "danger"}`}
								variant="shadow"
								className="w-full font-medium group-hover:scale-105 transition-transform"
								size="lg"
								onPress={() => handleReturnBoard(board)}
							>
								Confirm returnal
							</Button>
						</div>
					</div>
				))}
			</div>

			{/* Board Return Confirmation Modal */}
			<Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur" size="lg">
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1 pb-2">
								<h2 className="text-2xl font-bold text-foreground">Confirm the returnal</h2>
								<p className="text-sm text-default-500">Confirm returnal and send deposit</p>
							</ModalHeader>
							<ModalBody className="py-6">
								{selectedBoard && (
									<div className="space-y-6">
										{/* Board Information Card */}
										<div className="bg-gradient-to-r from-primary-200 to-secondary-200 p-6 rounded-lg ">
											<div className="flex items-start justify-between mb-4">
												<div>
													<h3 className="text-xl font-bold text-foreground mb-1">
														{selectedBoard.description}
													</h3>
													<p className="text-sm text-default-600 flex items-center gap-2">
														<span className="inline-block w-2 h-2 bg-primary rounded-full"></span>
														Renter: {selectedBoard.renter.slice(0, 6)}...
														{selectedBoard.renter.slice(-4)}
													</p>
												</div>
											</div>
										</div>

										{/* Deposit Information */}
										<div className="bg-default-100 p-6 rounded-xl space-y-4">
											<div className="flex items-center gap-3 mb-4">
												<div>
													<h4 className="font-semibold text-foreground">
														Deposit Return Information
													</h4>
													<p className="text-sm text-default-600">Your security deposit details</p>
												</div>
											</div>

											<div className="grid grid-cols-2 gap-4">
												<div className="dark:bg-default-200 p-4 rounded-lg border border-default-200 dark:border-default-100">
													<p className="text-xs uppercase tracking-wide text-default-500 dark:text-default-500 mb-1">
														Security Deposit
													</p>
													<p className="text-lg font-bold text-primary">
														{selectedBoard.deposit} ETH
													</p>
												</div>
											</div>
										</div>

										{/* Return Process Information */}
										{boardOk ? null : (
											<div className={`border bg-danger-50 border-danger-200 rounded-xl p-4`}>
												<div className="flex items-start gap-3">
													<div>
														<h5
															className={`font-semibold text-danger-800 dark:text-danger-400 mb-1`}
														>
															Keep Deposit due too questionable condition
														</h5>
														<p className={`text-sm text-danger-700 dark:text-danger-300 `}>
															You will keep the deposit bedause you think that the board's condition
															is not good enough to return the deposit to the renter.
														</p>
													</div>
												</div>
											</div>
										)}
									</div>
								)}
							</ModalBody>
							<ModalFooter className="pt-6">
								<Button color="danger" variant="light" onPress={onClose} className="font-medium">
									Cancel
								</Button>
								<Button
									color={boardOk ? "primary" : "danger"}
									variant="shadow"
									className="font-medium px-8"
									onPress={handleConfirmDeposit}
									isLoading={isReturning}
								>
									{isReturning ? "Processing Deposit..." : "Confirm Deposit"}
									{/* Confirm Return */}
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</div>
	);
}
