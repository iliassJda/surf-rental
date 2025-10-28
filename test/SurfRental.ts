// import { time, loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
// import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

// Enum values from the contract
const BoardStatus = {
	READY: 0,
	RETURNED: 1,
	RENTED: 2,
};

describe("Surf Rental", function () {
	async function deployFixture() {
		const [owner, renter] = await ethers.getSigners();

		const hardhatSurfRental = await ethers.deployContract("SurfRental");
		return { hardhatSurfRental, owner, renter };
	}
	// beforeEach(async function () {
	//   const [owner, renter] = await ethers.getSigners();
	//   const SurfRental = await ethers.deployContract("SurfRental");
	// })

	it("Should let owner list a board", async function () {
		const { hardhatSurfRental } = await loadFixture(deployFixture);
		await hardhatSurfRental.listBoard(
			"Shortboard",
			ethers.parseEther("0.2"),
			ethers.parseEther("0.05")
		);
		const board = await hardhatSurfRental.boards(0);
		// console.log(hardhatSurfRental.boards);

		expect(board.description).to.equal("Shortboard");
		expect(board.available).to.equal(BoardStatus.READY);
	});

	it("Should let renter rent a board", async function () {
		const { hardhatSurfRental, renter, owner } = await loadFixture(deployFixture);

		await hardhatSurfRental.listBoard(
			"Shortboard",
			ethers.parseEther("0.2"),
			ethers.parseEther("0.05")
		);

		await hardhatSurfRental.connect(renter).rentBoard(0, { value: ethers.parseEther("0.25") });
		const board = await hardhatSurfRental.boards(0);
		const ownerBalance = await hardhatSurfRental.pendingWithdrawals(owner.address);
		expect(board.available).to.equal(BoardStatus.RENTED);
		expect(board[6]).to.equal(renter);
		expect(ownerBalance).to.equal(ethers.parseEther("0.2"));
		// await hardhatSurfRental.rentBoard(0);
	});

	it("Should let renter return a board and get the deposit back fully", async function () {
		const { hardhatSurfRental, renter, owner } = await loadFixture(deployFixture);

		await hardhatSurfRental.listBoard(
			"Shortboard",
			ethers.parseEther("0.2"),
			ethers.parseEther("0.05")
		);

		// Get renter's balance before renting
		// const initialBalance = await ethers.provider.getBalance(renter.address);

		await hardhatSurfRental.connect(renter).rentBoard(0, { value: ethers.parseEther("0.25") });

		await hardhatSurfRental.connect(renter).returnBoard(0);
		let board = await hardhatSurfRental.boards(0);
		expect(board.available).to.equal(BoardStatus.RETURNED);

		// Get renter's balance before deposit return
		const balanceBeforeDeposit = await hardhatSurfRental.pendingWithdrawals(renter.address);

		// // For this test, we assume that the board was returned ok
		await hardhatSurfRental.returnDeposit(0, true);

		// // Get renter's balance after deposit return
		const balanceAfterDeposit = await hardhatSurfRental.pendingWithdrawals(renter.address);

		// // Check that the renter received the deposit (0.05 ETH)
		const depositReceived = balanceAfterDeposit - balanceBeforeDeposit;

		// const depositReceived = await hardhatSurfRental.pendingWithdrawals(renter.address);
		expect(depositReceived).to.equal(ethers.parseEther("0.05"));

		// Check final board state
		board = await hardhatSurfRental.boards(0);
		expect(board.available).to.equal(BoardStatus.READY);
		expect(board.renter).to.equal(ethers.ZeroAddress); // renter should be reset
	});

	it("Should return all the listed boards", async function () {
		const { hardhatSurfRental, renter, owner } = await loadFixture(deployFixture);

		await hardhatSurfRental.listBoard(
			"Longboard",
			ethers.parseEther("0.3"),
			ethers.parseEther("0.1")
		);

		await hardhatSurfRental.listBoard(
			"Shortboard",
			ethers.parseEther("0.9"),
			ethers.parseEther("0.2")
		);

		const boards = await hardhatSurfRental.getAllBoards();

		expect(boards.length).to.equal(2);
	});

	it("Should empty the board list", async function () {
		const { hardhatSurfRental, renter, owner } = await loadFixture(deployFixture);

		await hardhatSurfRental.listBoard(
			"Longboard",
			ethers.parseEther("0.3"),
			ethers.parseEther("0.1")
		);

		await hardhatSurfRental.listBoard(
			"Shortboard",
			ethers.parseEther("0.9"),
			ethers.parseEther("0.2")
		);

		let boards = await hardhatSurfRental.getAllBoards();

		expect(boards.length).to.equal(2);

		await hardhatSurfRental.resetBoards();

		boards = await hardhatSurfRental.getAllBoards();

		expect(boards.length).to.equal(0);
	});

	it("Should bring the balance to 0 when withdrawing", async function () {
		const { hardhatSurfRental, renter, owner } = await loadFixture(deployFixture);
		await hardhatSurfRental.listBoard(
			"Longboard",
			ethers.parseEther("0.3"),
			ethers.parseEther("0.1")
		);

		await hardhatSurfRental.connect(renter).rentBoard(0, { value: ethers.parseEther("0.4") });

		const ownerBalanceBefore = await hardhatSurfRental.pendingWithdrawals(owner.address);
		const realBalanceBefore = await ethers.provider.getBalance(owner.address);

		expect(ownerBalanceBefore).to.equal(ethers.parseEther("0.3"));

		const tx = await hardhatSurfRental.withdraw();
		const receipt = await tx.wait();
		const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

		const ownerBalanceAfter = await hardhatSurfRental.pendingWithdrawals(owner.address);
		const realBalanceAfter = await ethers.provider.getBalance(owner.address);

		// const netGain = realBalanceAfter - realBalanceBefore + gasUsed;
		expect(ownerBalanceAfter).to.equal(ethers.parseEther("0"));
		// expect(netGain).to.equal(ethers.parseEther("0.3"));
	});

	it("Should give deposit to owner when board is damaged", async function () {
		const { hardhatSurfRental, renter, owner } = await loadFixture(deployFixture);

		await hardhatSurfRental.listBoard(
			"Longboard",
			ethers.parseEther("0.3"),
			ethers.parseEther("0.1")
		);

		await hardhatSurfRental.connect(renter).rentBoard(0, { value: ethers.parseEther("0.4") });
		await hardhatSurfRental.connect(renter).returnBoard(0);

		// Get owner's balance before deposit decision
		// const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
		const ownerBalanceBefore = await hardhatSurfRental.pendingWithdrawals(owner.address);
		// console.log("BEFORE: ", ownerBalanceBefore);

		// Board is damaged, so owner keeps the deposit
		await hardhatSurfRental.returnDeposit(0, false);
		// const receipt = await tx.wait();
		// const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

		// Get owner's balance after deposit decision
		// const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
		const ownerBalanceAfter = await hardhatSurfRental.pendingWithdrawals(owner.address);
		// console.log("AFTER: ", ownerBalanceAfter);

		// Owner should receive deposit minus gas costs
		// const netGain = ownerBalanceAfter - ownerBalanceBefore + gasUsed;
		const netGain = ownerBalanceAfter - ownerBalanceBefore;
		// console.log("THis is the gain", netGain, " And it should return: ", ethers.parseEther("0.1"));
		expect(netGain).to.equal(ethers.parseEther("0.1"));

		// Check final board state
		const board = await hardhatSurfRental.boards(0);
		expect(board.available).to.equal(BoardStatus.READY);
		expect(board.renter).to.equal(ethers.ZeroAddress);
	});
});
