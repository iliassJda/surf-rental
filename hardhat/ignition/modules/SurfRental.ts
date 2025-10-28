// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SurfRentalModule = buildModule("SurfRentalModule", (m) => {
	const surfRental = m.contract("SurfRental");

	return { surfRental };
});

export default SurfRentalModule;
