"use client";

import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/utils/constants";
import { useWallet } from "@/contexts/WalletContext";
import { Board } from "@/config/site";
import { useCallback } from "react";

export function useSurfRental() {
	const { isConnected, account } = useWallet();

	const getProvider = () => {
		if (typeof window !== "undefined" && window.ethereum) {
			return new ethers.BrowserProvider(window.ethereum);
		}
		throw new Error("Ethereum provider not found");
	};

	// const getContract = async () => {
	// 	if (!isConnected) throw new Error("Wallet not connected");
	// 	try {
	// 		const provider = getProvider();
	// 		const signer = await provider.getSigner();
	// 		return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
	// 	} catch (err) {
	// 		console.error("Failed to init contract", err);
	// 		throw new Error("Failed to initialize contract");
	// 	}
	// };

	const getContract = async (useReadOnly = false) => {
		try {
			// Use read-only provider if wallet not connected or explicitly requested
			if (!isConnected || useReadOnly) {
				const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
				return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
			}

			// Otherwise use signer from wallet
			const provider = getProvider();
			const signer = await provider.getSigner();
			return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
		} catch (err) {
			console.error("Failed to init contract", err);
			throw new Error("Failed to initialize contract");
		}
	};

	const rentBoard = async (boardId: number, pricePerDayEth: string, depositEth: string) => {
		const contract = await getContract();
		// Calculate total payment (price + deposit)
		const priceWei = ethers.parseEther(pricePerDayEth);
		const depositWei = ethers.parseEther(depositEth);
		const totalPayment = priceWei + depositWei;

		const tx = await contract.rentBoard(boardId, { value: totalPayment });
		await tx.wait();
	};

	const getAllBoards = useCallback(async (): Promise<Board[]> => {
		const contract = await getContract(true);

		// const boards = (await contract.getAllBoards()) as Board[];
		// console.log(
		// 	boards.map((board) => board.status),
		// 	" YEY"
		// );

		// Get nextBoardId to know how many boards exist
		const nextBoardId = await contract.nextBoardId();
		const boards: Board[] = [];
		console.log("The next board id is: ", nextBoardId);
		// Fetch each board by ID
		for (let i = 0; i < Number(nextBoardId); i++) {
			try {
				const boardData = await contract.boards(i);
				// Convert from contract format to Board interface
				const board: Board = {
					id: Number(boardData.id),
					description: boardData.description,
					owner: boardData.owner,
					renter: boardData.renter,
					pricePerDay: boardData.pricePerDay,
					deposit: boardData.deposit,
					status: Number(boardData.available), // available is the enum status
				};
				console.log("board status = ", board.status);
				boards.push(board);
			} catch (err) {
				console.error(`Failed to fetch board ${i}:`, err);
			}
		}

		return boards;
	}, [isConnected]); // Depend on isConnected to recreate when wallet state changes

	const listBoard = async (description: string, pricePerDayEth: string, depositEth: string) => {
		// Validate numeric inputs
		const priceEthNum = Number(pricePerDayEth);
		const depositEthNum = Number(depositEth);

		if (
			!Number.isFinite(priceEthNum) ||
			!Number.isFinite(depositEthNum) ||
			priceEthNum < 0 ||
			depositEthNum < 0
		) {
			// setIsSubmitting(false);
			// setSubmitMessage("Price and deposit must be valid positive numbers.");
			return {
				message: "Price and deposit must be valid positive numbers.",
			};
		}

		// Convert to wei for the contract call (BigInt, not serialized)
		let priceWei: bigint;
		let depositWei: bigint;
		try {
			priceWei = ethers.parseEther(pricePerDayEth);
			depositWei = ethers.parseEther(depositEth);
		} catch (convErr) {
			console.error("Failed to parse ETH amounts:", convErr);
			// setIsSubmitting(false);
			// setSubmitMessage("Invalid number format. Use a dot for decimals, e.g., 2.12");

			return {
				message: "Invalid number format. Use a dot for decimals, e.g., 2.12",
			};
		}

		const contract = await getContract();

		const tx = await contract.listBoard(description, priceWei, depositWei);
		const receipt = await tx.wait();
		return { receipt, contract };
	};

	const resetBoards = async () => {
		try {
			const contract = await getContract();
			const tx = await contract.resetBoards();

			const receipt = await tx.wait();
			return { receipt, contract };
		} catch (err) {
			return { errorMessage: err };
		}
	};

	const returnBoard = async (board: Board) => {
		try {
			const contract = await getContract();
			const tx = await contract.returnBoard(board.id);

			const receipt = await tx.wait();
			return { receipt, contract };
		} catch (error) {
			return { errorMessage: error };
		}
	};

	return {
		returnBoard,
		rentBoard,
		listBoard,
		getAllBoards,
		resetBoards,
	};
}
