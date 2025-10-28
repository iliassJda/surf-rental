"use client";
import {
	Navbar as HeroUINavbar,
	NavbarContent,
	NavbarMenu,
	NavbarMenuToggle,
	NavbarBrand,
	NavbarItem,
	NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Kbd } from "@heroui/kbd";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { useWallet } from "@/contexts/WalletContext";
import { Logo } from "@/components/icons";
import {
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	useDisclosure,
} from "@heroui/modal";
import { useState } from "react";
import { useSurfRental } from "@/hooks/useSurfRental";
import { ethers } from "ethers";
import { addToast } from "@heroui/toast";

export const Navbar = () => {
	const { isConnected, account, connectWallet, isLoading } = useWallet();
	const { isOpen, onOpen, onOpenChange } = useDisclosure();
	const [withdrawal, setWithdrawal] = useState<string | null>(null);
	const [isWithdrawing, setIsWithdrawing] = useState(false);

	const { getPendingWithdrawals, withdraw } = useSurfRental();

	const handleWithdrawClick = async () => {
		if (!account) {
			setWithdrawal(null);
			onOpen();
			return;
		}

		try {
			// fetch pending withdrawals from contract (wei bigint or string)
			const pending = await getPendingWithdrawals(account as any);

			if (pending === undefined || pending === null) {
				setWithdrawal(null);
			} else {
				// format to ETH string for display
				try {
					setWithdrawal(String(ethers.formatEther(pending)));
				} catch (e) {
					// fallback: toString
					setWithdrawal(String(pending.toString()));
				}
			}
		} catch (err) {
			console.error("Failed to fetch pending withdrawals", err);
			setWithdrawal(null);
		} finally {
			console.log(withdrawal, "is the pending amount of the following user: ", account);
			onOpen();
		}
	};

	const handleConfirmWithdraw = async () => {
		setIsWithdrawing(true);
		try {
			await withdraw();
			// close modal after successful withdraw
			onOpenChange();
			// addToast(`You have withdrawn ${withdrawal} ETH`);
			addToast({
				title: "Withdrawal Successfull",
				description: `${withdrawal} has been withdrawn`,
				color: "success",
			});
			setWithdrawal(null);
		} catch (err) {
			console.error("Withdraw failed", err);
		} finally {
			setIsWithdrawing(false);
		}
	};

	return (
		<HeroUINavbar maxWidth="xl" position="sticky">
			<NavbarContent className="basis-1/5 sm:basis-full" justify="start">
				<NavbarBrand as="li" className="gap-3 max-w-fit mx-4">
					<NextLink className="flex justify-start items-center gap-1" href="/">
						<Logo />
						<p className="font-bold text-inherit">SURF'IT</p>
					</NextLink>
				</NavbarBrand>
				<ul className="hidden lg:flex gap-4 justify-end">
					{siteConfig.navItems.map((item) => (
						<NavbarItem key={item.href}>
							<NextLink
								className={clsx(
									linkStyles({ color: "foreground" }),
									"data-[active=true]:text-primary data-[active=true]:font-medium"
								)}
								color="foreground"
								href={item.href}
							>
								{item.label}
							</NextLink>
						</NavbarItem>
					))}
				</ul>
			</NavbarContent>

			<NavbarContent className="hidden sm:flex basis-1/5 sm:basis-full" justify="end">
				<NavbarItem className="hidden sm:flex gap-2">
					<ThemeSwitch />
				</NavbarItem>
				<NavbarItem>
					{!isLoading &&
						(isConnected ? (
							<Button
								className="text-sm font-normal text-default-600 bg-default-100"
								variant="flat"
								size="sm"
							>
								{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connected"}
							</Button>
						) : (
							<Button
								className="text-sm font-normal"
								color="primary"
								variant="solid"
								size="sm"
								onPress={connectWallet}
							>
								Connect Wallet
							</Button>
						))}
				</NavbarItem>
				{isConnected ? (
					<NavbarItem>
						<Button
							className="text-sm font-normal"
							color="primary"
							variant="solid"
							size="sm"
							onPress={handleWithdrawClick}
						>
							Withdraw your ETH
						</Button>
					</NavbarItem>
				) : null}
			</NavbarContent>

			<NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
				<ThemeSwitch />
				<NavbarMenuToggle />
			</NavbarContent>

			<Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">Confirm Withdraw</ModalHeader>
							<ModalBody>
								<div className="space-y-4">
									{withdrawal ? (
										<div className="p-4 bg-default-50 dark:bg-default-100 rounded-lg text-center">
											<p className="text-sm text-default-600 mb-1">Pending withdrawal</p>
											<p className="text-2xl font-bold text-foreground">{withdrawal} ETH</p>
											<p className="text-sm text-default-500 mt-2">
												You can withdraw this amount to your wallet.
											</p>
										</div>
									) : (
										<div className="p-4 bg-default-50 dark:bg-default-800 rounded-lg text-center">
											<p className="text-sm text-default-600">No pending withdrawals available.</p>
										</div>
									)}
								</div>
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onPress={onClose}>
									Cancel
								</Button>
								<Button
									color="primary"
									variant="shadow"
									onPress={handleConfirmWithdraw}
									isLoading={isWithdrawing}
									isDisabled={!withdrawal || Number(withdrawal) <= 0}
								>
									Withdraw
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</HeroUINavbar>
	);
};
