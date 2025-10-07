// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract SurfRental {
    enum status {
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
        status available;
        address renter;
    }

    

    uint public nextBoardId;
    mapping(uint => Board) public boards;

    modifier boardExists(uint boardId) {
        require(boardId < nextBoardId, "Board does not exist");
        _;
    }

    event BoardListed(uint boardId, address owner, uint price, uint deposit);
    event BoardRented(uint boardId, address renter);
    event BoardReturned(uint boardId);
    event DepositDecision(bool result);
    event FetchBoards();

    function listBoard(string memory description, uint pricePerDay, uint deposit) external {
        boards[nextBoardId] = Board(
            nextBoardId,
            payable(msg.sender),
            description,
            pricePerDay,
            deposit,
            status.ready,
            address(0)
        );
        emit BoardListed(nextBoardId, msg.sender, pricePerDay, deposit);
        nextBoardId++;
    }

    function rentBoard(uint boardId) external payable boardExists(boardId) {
        Board storage board = boards[boardId];
        require(board.available == status.ready, "Board is not yet ready");
        require(msg.value == board.pricePerDay + board.deposit, "Incorrect payment (check your deposit??)");

        board.available = status.rented;
        board.renter = msg.sender;

        // rental fee goes to owner immediately
        (bool success, ) = board.owner.call{value: board.pricePerDay}("");
        require(success, "Transfer to owner failed");

        emit BoardRented(boardId, msg.sender);
    }

    function returnBoard(uint boardId) external boardExists(boardId) {
        Board storage board = boards[boardId];
        require(msg.sender == board.renter, "Not renter");

        board.available = status.returned;

        emit BoardReturned(boardId);
    }

    function returnDeposit(uint boardId, bool boardIsOk) external boardExists(boardId) {
        Board storage board = boards[boardId];
        require(msg.sender == board.owner, "Only board owner can decide on deposit");
        require(board.available == status.returned, "Board must be returned first");
        
        if (boardIsOk) {
            (bool success, ) = payable(board.renter).call{value: board.deposit}("");
            require(success, "Transfer to renter failed");
        } else {
            (bool success, ) = board.owner.call{value: board.deposit}("");
            require(success, "Transfer to owner failed");
        }

        board.renter = address(0);
        board.available = status.ready;
        emit DepositDecision(boardIsOk);
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