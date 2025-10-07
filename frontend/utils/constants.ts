import SurfRental from "@/abi/SurfRental.json";

export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const CONTRACT_ABI = SurfRental.abi;

// export const CONTRACT_ABI = [
// 	{
// 		anonymous: false,
// 		inputs: [
// 			{
// 				indexed: false,
// 				internalType: "uint256",
// 				name: "boardId",
// 				type: "uint256",
// 			},
// 			{
// 				indexed: false,
// 				internalType: "address",
// 				name: "owner",
// 				type: "address",
// 			},
// 			{
// 				indexed: false,
// 				internalType: "uint256",
// 				name: "price",
// 				type: "uint256",
// 			},
// 			{
// 				indexed: false,
// 				internalType: "uint256",
// 				name: "deposit",
// 				type: "uint256",
// 			},
// 		],
// 		name: "BoardListed",
// 		type: "event",
// 	},
// 	{
// 		anonymous: false,
// 		inputs: [
// 			{
// 				indexed: false,
// 				internalType: "uint256",
// 				name: "boardId",
// 				type: "uint256",
// 			},
// 			{
// 				indexed: false,
// 				internalType: "address",
// 				name: "renter",
// 				type: "address",
// 			},
// 		],
// 		name: "BoardRented",
// 		type: "event",
// 	},
// 	{
// 		anonymous: false,
// 		inputs: [
// 			{
// 				indexed: false,
// 				internalType: "uint256",
// 				name: "boardId",
// 				type: "uint256",
// 			},
// 		],
// 		name: "BoardReturned",
// 		type: "event",
// 	},
// 	{
// 		anonymous: false,
// 		inputs: [
// 			{
// 				indexed: false,
// 				internalType: "bool",
// 				name: "result",
// 				type: "bool",
// 			},
// 		],
// 		name: "DepositDecision",
// 		type: "event",
// 	},
// 	{
// 		inputs: [
// 			{
// 				internalType: "uint256",
// 				name: "",
// 				type: "uint256",
// 			},
// 		],
// 		name: "boards",
// 		outputs: [
// 			{
// 				internalType: "uint256",
// 				name: "id",
// 				type: "uint256",
// 			},
// 			{
// 				internalType: "address payable",
// 				name: "owner",
// 				type: "address",
// 			},
// 			{
// 				internalType: "string",
// 				name: "description",
// 				type: "string",
// 			},
// 			{
// 				internalType: "uint256",
// 				name: "pricePerDay",
// 				type: "uint256",
// 			},
// 			{
// 				internalType: "uint256",
// 				name: "deposit",
// 				type: "uint256",
// 			},
// 			{
// 				internalType: "enum SurfRental.status",
// 				name: "available",
// 				type: "uint8",
// 			},
// 			{
// 				internalType: "address",
// 				name: "renter",
// 				type: "address",
// 			},
// 		],
// 		stateMutability: "view",
// 		type: "function",
// 	},
// 	{
// 		inputs: [
// 			{
// 				internalType: "string",
// 				name: "description",
// 				type: "string",
// 			},
// 			{
// 				internalType: "uint256",
// 				name: "pricePerDay",
// 				type: "uint256",
// 			},
// 			{
// 				internalType: "uint256",
// 				name: "deposit",
// 				type: "uint256",
// 			},
// 		],
// 		name: "listBoard",
// 		outputs: [],
// 		stateMutability: "nonpayable",
// 		type: "function",
// 	},
// 	{
// 		inputs: [],
// 		name: "nextBoardId",
// 		outputs: [
// 			{
// 				internalType: "uint256",
// 				name: "",
// 				type: "uint256",
// 			},
// 		],
// 		stateMutability: "view",
// 		type: "function",
// 	},
// 	{
// 		inputs: [
// 			{
// 				internalType: "uint256",
// 				name: "boardId",
// 				type: "uint256",
// 			},
// 		],
// 		name: "rentBoard",
// 		outputs: [],
// 		stateMutability: "payable",
// 		type: "function",
// 	},
// 	{
// 		inputs: [
// 			{
// 				internalType: "uint256",
// 				name: "boardId",
// 				type: "uint256",
// 			},
// 		],
// 		name: "returnBoard",
// 		outputs: [],
// 		stateMutability: "nonpayable",
// 		type: "function",
// 	},
// 	{
// 		inputs: [
// 			{
// 				internalType: "uint256",
// 				name: "boardId",
// 				type: "uint256",
// 			},
// 			{
// 				internalType: "bool",
// 				name: "boardIsOk",
// 				type: "bool",
// 			},
// 		],
// 		name: "returnDeposit",
// 		outputs: [],
// 		stateMutability: "nonpayable",
// 		type: "function",
// 	},
// ];
