// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract SurfRental {
    enum Status {
        ready, // 0
        returned, // 1
        rented // 2
    }

    struct Board {
        uint id;
        address payable owner;
        string description;
        uint pricePerDay;
        uint deposit;
        Status available;
        address renter;
    }

    

    uint public nextBoardId;
    mapping(uint => Board) public boards;
    mapping(address => uint) public pendingWithdrawals;

    modifier boardExists(uint boardId) {
        require(boardId < nextBoardId, "Board does not exist");
        _;
    }

    event BoardListed(uint boardId, address owner, uint price, uint deposit);
    event BoardRented(uint boardId, address renter);
    event BoardReturned(uint boardId);
    event DepositDecision(bool result);
    event Withdrawal(address indexed who, uint amount);
    // event FetchBoards();

    function listBoard(string memory description, uint pricePerDay, uint deposit) external {
        boards[nextBoardId] = Board(
            nextBoardId,
            payable(msg.sender),
            description,
            pricePerDay,
            deposit,
            Status.ready,
            address(0)
        );
        emit BoardListed(nextBoardId, msg.sender, pricePerDay, deposit);
        nextBoardId++;
    }

    function rentBoard(uint boardId) external payable boardExists(boardId) {
        Board storage board = boards[boardId];
        require(board.available == Status.ready, "Board is not yet ready");
        require(msg.value == board.pricePerDay + board.deposit, "Incorrect payment (check your deposit??)");

        board.available = Status.rented;
        board.renter = msg.sender;

        // rental fee goes to owner immediately
        pendingWithdrawals[board.owner] += msg.value;
        // (bool success, ) = board.owner.call{value: board.pricePerDay}("");
        // require(success, "Transfer to owner failed");

        emit BoardRented(boardId, msg.sender);
    }

    function returnBoard(uint boardId) external boardExists(boardId) {
        Board storage board = boards[boardId];
        require(msg.sender == board.renter, "Not renter");

        board.available = Status.returned;

        emit BoardReturned(boardId);
    }

    function returnDeposit(uint boardId, bool boardIsOk) external boardExists(boardId) {
        Board storage board = boards[boardId];
        require(msg.sender == board.owner, "Only board owner can decide on deposit");
        require(board.available == Status.returned, "Board must be returned first");

        address renter = board.renter;
        board.renter = address(0);
        board.available = Status.ready;
        
        if (boardIsOk) {
            // (bool success, ) = payable(board.renter).call{value: board.deposit}("");
            // require(success, "Transfer to renter failed");
            pendingWithdrawals[renter] += board.deposit;
            pendingWithdrawals[board.owner] -= board.deposit;
        } 
        // else {
        //     // (bool success, ) = board.owner.call{value: board.deposit}("");
        //     // require(success, "Transfer to owner failed");
        //     pendingWithdrawals[board.owner] += board.deposit;
        // }

        
        emit DepositDecision(boardIsOk);
    }

    function withdraw() external {
        uint amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");

        pendingWithdrawals[msg.sender] = 0;

        emit Withdrawal(msg.sender, amount);
        payable(msg.sender).transfer(amount);
    }

    function getAllBoards() external view returns (Board[] memory) {
        Board[] memory allBoards = new Board[](nextBoardId);

        for (uint i = 0; i < nextBoardId; i++) {
            allBoards[i] = boards[i];
        }

        return allBoards;
    }

    function resetBoards() external {
        for (uint i = 0; i < nextBoardId; i++) {
            delete boards[i];
        }
        nextBoardId = 0;
    }
}