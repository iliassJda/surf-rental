"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Extend the Window interface to include ethereum
declare global {
	interface Window {
		ethereum?: {
			request: (args: { method: string; params?: any[] }) => Promise<any>;
			on: (event: string, callback: (...args: any[]) => void) => void;
			removeListener: (event: string, callback: (...args: any[]) => void) => void;
		};
	}
}

interface WalletContextType {
	isConnected: boolean;
	account: string | null;
	balance: string | null;
	isLoading: boolean;
	connectWallet: () => Promise<void>;
	disconnectWallet: () => void;
	refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
	const context = useContext(WalletContext);
	if (!context) {
		throw new Error("useWallet must be used within a WalletProvider");
	}
	return context;
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
	const [isConnected, setIsConnected] = useState(false);
	const [account, setAccount] = useState<string | null>(null);
	const [balance, setBalance] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const getBalance = async (address: string): Promise<string> => {
		if (typeof window.ethereum !== "undefined") {
			try {
				const balanceWei = await window.ethereum.request({
					method: "eth_getBalance",
					params: [address, "latest"],
				});
				// Convert from Wei to ETH (1 ETH = 10^18 Wei)
				const balanceEth = parseInt(balanceWei, 16) / Math.pow(10, 18);
				return balanceEth.toFixed(4);
			} catch (error) {
				console.error("Error getting balance: Check hardhat node is active", error);
				return "0";
			}
		}
		return "0";
	};

	const refreshBalance = async () => {
		if (account) {
			const newBalance = await getBalance(account);
			setBalance(newBalance);
		}
	};

	const checkConnection = async () => {
		if (typeof window.ethereum !== "undefined") {
			try {
				const accounts = await window.ethereum.request({ method: "eth_accounts" });
				if (accounts.length > 0) {
					setIsConnected(true);
					setAccount(accounts[0]);
					const accountBalance = await getBalance(accounts[0]);
					setBalance(accountBalance);
				}
			} catch (error) {
				console.error("Error checking connection:", error);
			}
		}
		setIsLoading(false);
	};

	const connectWallet = async () => {
		if (typeof window.ethereum !== "undefined") {
			try {
				const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
				if (accounts.length > 0) {
					setIsConnected(true);
					setAccount(accounts[0]);
					const accountBalance = await getBalance(accounts[0]);
					setBalance(accountBalance);
				}
			} catch (error) {
				console.error("Error connecting wallet:", error);
			}
		}
	};

	const disconnectWallet = () => {
		setIsConnected(false);
		setAccount(null);
		setBalance(null);
	};

	useEffect(() => {
		checkConnection();

		if (typeof window.ethereum !== "undefined") {
			const handleAccountsChanged = async (accounts: string[]) => {
				if (accounts.length > 0) {
					setIsConnected(true);
					setAccount(accounts[0]);
					const accountBalance = await getBalance(accounts[0]);
					setBalance(accountBalance);
				} else {
					setIsConnected(false);
					setAccount(null);
					setBalance(null);
				}
			};

			const handleChainChanged = () => {
				// Reload the page when chain changes
				window.location.reload();
			};

			window.ethereum.on("accountsChanged", handleAccountsChanged);
			window.ethereum.on("chainChanged", handleChainChanged);

			return () => {
				if (window.ethereum) {
					window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
					window.ethereum.removeListener("chainChanged", handleChainChanged);
				}
			};
		}
	}, []);

	return (
		<WalletContext.Provider
			value={{
				isConnected,
				account,
				balance,
				isLoading,
				connectWallet,
				disconnectWallet,
				refreshBalance,
			}}
		>
			{children}
		</WalletContext.Provider>
	);
};
