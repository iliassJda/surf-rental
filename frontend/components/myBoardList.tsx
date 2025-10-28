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

export default function MyBoardList() {
	const [data, setData] = useState<Board[]>([]);
	const [returnData, setReturnData] = useState<Board[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	// const [realtimeStatus, setRealtimeStatus] = useState<string>("Connecting...");
	const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
	const [isReturning, setIsReturning] = useState(false);
	const supabase = createClient();
	const { isOpen, onOpen, onOpenChange } = useDisclosure();
	const router = useRouter();

	const { isConnected, account, balance, connectWallet, isLoading } = useWallet();
	const { returnBoard } = useSurfRental();

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				setError(null);

				let boardsData;
				let returnedBoardData;

				// Fetch boards that are rented (status = 2)
				const { data: rawData, error: fetchError } = await supabase
					.from("Boards") // Make sure this matches your actual table name
					.select("*")
					.eq("status", 2);

				boardsData = rawData?.filter((board: Board) => board.renter === account) || [];

				if (fetchError) {
					console.error("Fetch error:", fetchError);
					setError(`Error fetching boards: ${fetchError.message}`);
				} else {
					setData(boardsData);
				}

				const { data: rawReturnedData, error: fError } = await supabase
					.from("Boards")
					.select("*")
					.eq("status", 1);

				console.log(rawReturnedData);

				returnedBoardData = rawReturnedData?.filter((board: Board) => board.renter === account);

				console.log(returnedBoardData);

				if (fError) {
					console.error("Fetch error:", fError);
					setError(`Error fetching boards: ${fError.message}`);
				} else {
					setReturnData(returnedBoardData || []);
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

	const handleConfirmReturn = async () => {
		// if (!selectedBoard || !selectedBoard.id) return;
		if (!selectedBoard) return;

		setIsReturning(true);
		try {
			// Call smart contract rent function
			returnBoard(selectedBoard);

			// Update Supabase to mark as rented
			const { error: updateError } = await supabase
				.from("Boards")
				.update({
					status: 1, // returned
					// renter: null,
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
		} catch (error: any) {
			console.error("Rental failed:", error);
		} finally {
			setIsReturning(false);
			router.refresh();
			// router.reload();
			addToast({
				title: "Board Returned",
				description: "Board returned succesfully",
				color: "success",
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

	if (data.length === 0 && returnData.length === 0) {
		return (
			<div className="w-full text-center">
				<p className="text-default-600">You have no boards :(</p>
			</div>
		);
	}

	return (
		<div className="w-full">
			<h2 className="text-xl font-bold mb-4">Rented Boards</h2>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
				{data.map((board: Board, index: number) => (
					<div key={index} className="border border-default-200 rounded-lg">
						{/* Board Content */}
						<div className="p-6">
							<h3 className="font-bold text-lg text-foreground mb-3 pr-16">{board.description}</h3>

							<div className="space-y-3 mb-6">
								<div className="flex items-center justify-between p-3 bg-default-50 rounded-lg">
									<span className="text-sm font-medium text-default-600">Daily Price</span>
									<span className="font-bold text-foreground">{board.pricePerDay} ETH</span>
								</div>
								<div className="flex items-center justify-between p-3 bg-primary-100 rounded-lg">
									<span className="text-sm font-medium text-default-600">Deposit Paid</span>
									<span className="font-bold text-primary-500">{board.deposit} ETH</span>
								</div>
								<div className="flex items-center justify-between p-3 bg-default-50 rounded-lg">
									<span className="text-sm font-medium text-default-600">Owner</span>
									<span className="font-mono text-sm text-foreground">
										{board.owner.slice(0, 6)}...{board.owner.slice(-4)}
									</span>
								</div>
							</div>

							<Button
								color="primary"
								variant="shadow"
								className="w-full font-medium group-hover:scale-105 transition-transform"
								size="lg"
								onPress={() => handleReturnBoard(board)}
							>
								Return Board
							</Button>
						</div>
					</div>
				))}
			</div>
			<div className="mb-6">
				<h2 className="text-2xl font-bold text-foreground mb-2">Returned Boards</h2>
				<p className="text-default-600">Boards you've returned</p>
			</div>
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
				{returnData.map((board: Board, index: number) => (
					<div key={index} className="border border-default-200 rounded-lg">
						{/* Status Badge */}
						{/* <div className="absolute top-3 right-3 z-10">
							<div className="bg-success-100 dark:bg-success-900/50 px-3 py-1 rounded-full">
								<span className="text-xs font-medium text-success-700 dark:text-success-300">
									✓ Returned
								</span>
							</div>
						</div> */}

						{/* Board Content */}
						<div className="p-6">
							<h3 className="font-bold text-lg text-foreground mb-3 pr-20">{board.description}</h3>

							<div className="space-y-3 mb-6">
								<div className="flex items-center justify-between p-3 bg-default-50  rounded-lg">
									<span className="text-sm font-medium text-default-600">Daily Rate</span>
									<span className="font-bold text-foreground">{board.pricePerDay} ETH</span>
								</div>
								<div className="flex items-center justify-between p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
									<span className="text-sm font-medium text-default-600">Deposit Status</span>
									<span className="font-bold text-warning-600 dark:text-warning-400">
										{board.deposit} ETH Deposit
									</span>
								</div>
								<div className="flex items-center justify-between p-3 bg-default-50 rounded-lg">
									<span className="text-sm font-medium text-default-600">Owner</span>
									<span className="font-mono text-sm text-foreground">
										{board.owner.slice(0, 6)}...{board.owner.slice(-4)}
									</span>
								</div>
							</div>

							{/* Return confirmation message */}
							<div className="bg-warning-50 dark:bg-warning-900/20 border-warning-100 dark:border-warning-800 rounded-lg p-3">
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium text-warning-700 dark:text-warning-300">
										Successfully returned, waiting for owner
									</span>
								</div>
							</div>
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
								<h2 className="text-2xl font-bold text-foreground">Return Surf Board</h2>
								<p className="text-sm text-default-500">
									Complete your rental and get your deposit back
								</p>
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
														Owner: {selectedBoard.owner.slice(0, 6)}...
														{selectedBoard.owner.slice(-4)}
													</p>
												</div>
												{/* <div className="bg-success-100 dark:bg-success-900/30 px-3 py-1 rounded-full">
													<span className="text-xs font-medium text-success-700 dark:text-success-300">
														Currently Rented
													</span>
												</div> */}
											</div>
										</div>

										{/* Deposit Information */}
										<div className="bg-default-100 p-6 rounded-xl space-y-4">
											<div className="flex items-center gap-3 mb-4">
												{/* <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
													<svg
														className="w-5 h-5 text-primary"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
														/>
													</svg>
												</div> */}
												<div>
													<h4 className="font-semibold text-foreground">
														Deposit Return Information
													</h4>
													<p className="text-sm text-default-600">Your security deposit details</p>
												</div>
											</div>

											<div className="grid grid-cols-2 gap-4">
												<div className="p-4 rounded-lg border border-default-200">
													<p className="text-xs uppercase tracking-wide text-default-500 mb-1">
														Daily Rate
													</p>
													<p className="text-lg font-bold text-foreground">
														{selectedBoard.pricePerDay} ETH
													</p>
												</div>
												<div className="dark:bg-default-900 p-4 rounded-lg border border-default-200 dark:border-default-700">
													<p className="text-xs uppercase tracking-wide text-default-500 dark:text-default-300 mb-1">
														Security Deposit
													</p>
													<p className="text-lg font-bold text-primary">
														{selectedBoard.deposit} ETH
													</p>
												</div>
											</div>
										</div>

										{/* Return Process Information */}
										<div className="bg-warning-50 border border-warning-200 rounded-xl p-4">
											<div className="flex items-start gap-3">
												{/* <div className="w-6 h-6 bg-warning-100 dark:bg-warning-900/50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
													<svg
														className="w-3 h-3 text-warning-600"
														fill="currentColor"
														viewBox="0 0 20 20"
													>
														<path
															fillRule="evenodd"
															d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
															clipRule="evenodd"
														/>
													</svg>
												</div> */}
												<div>
													<h5 className="font-semibold text-warning-800 dark:text-warning-400 mb-1">
														Deposit Return Policy
													</h5>
													<p className="text-sm text-warning-700 dark:text-warning-300">
														Your deposit will be returned based on the board's condition. Any
														damages may result in partial deductions from your security deposit.
													</p>
												</div>
											</div>
										</div>

										{/* Action Timeline */}
										<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
											<h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
												{/* <svg
													className="w-4 h-4"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M13 10V3L4 14h7v7l9-11h-7z"
													/>
												</svg> */}
												What happens next?
											</h5>
											<div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
												<div className="flex items-center gap-2">
													<div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
													<span>Board return is processed on the blockchain</span>
												</div>
												<div className="flex items-center gap-2">
													<div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
													<span>Owner inspects the board condition</span>
												</div>
												<div className="flex items-center gap-2">
													<div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
													<span>Deposit is returned to your wallet</span>
												</div>
											</div>
										</div>
									</div>
								)}
							</ModalBody>
							<ModalFooter className="pt-6">
								<Button color="danger" variant="light" onPress={onClose} className="font-medium">
									Cancel
								</Button>
								<Button
									color="primary"
									variant="shadow"
									className="font-medium px-8"
									onPress={handleConfirmReturn}
									isLoading={isReturning}
								>
									{isReturning ? "Processing Return..." : "Confirm Return"}
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
