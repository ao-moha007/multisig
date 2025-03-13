// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";


contract MultiSigWallet is ReentrancyGuard {
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint public immutable  requiredSignatures;

    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool executed;
        uint approvalCount;
    }

    Transaction[] public transactions;
    mapping(uint => mapping(address => bool)) public approvals;

    // Events
    event Deposit(address indexed sender, uint amount);
    event TransactionProposed(uint transactionId, address indexed to, uint value, bytes data);
    event TransactionApproved(uint transactionId, address indexed owner);
    event TransactionExecuted(uint transactionId, address indexed to, uint value, bytes data);

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }

    modifier transactionExists(uint transactionId) {
        require(transactionId < transactions.length, "Transaction does not exist");
        _;
    }

    modifier notExecuted(uint transactionId) {
        require(!transactions[transactionId].executed, "Transaction already executed");
        _;
    }

    modifier notApproved(uint transactionId) {
        require(!approvals[transactionId][msg.sender], "Transaction already approved by this owner");
        _;
    }

    // Constructor to initialize the wallet with owners and required signatures
    constructor(address[] memory _owners, uint _requiredSignatures) payable  {
        require(_owners.length >= _requiredSignatures, "Owners less than required signatures");
        require(_requiredSignatures > 0, "Require at least one signature");

        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Owner cannot be zero address");
            require(!isOwner[owner], "Owner already exists");

            isOwner[owner] = true;
            owners.push(owner);
        }

        requiredSignatures = _requiredSignatures;
    }

    // Deposit Ether into the wallet
    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    // Propose a new transaction
    function proposeTransaction(address to, uint value, bytes memory data) external onlyOwner {
        uint transactionId = transactions.length;
        transactions.push(Transaction({
            to: to,
            value: value,
            data: data,
            executed: false,
            approvalCount: 0
        }));

        emit TransactionProposed(transactionId, to, value, data);
    }

    // Approve a transaction
    function approveTransaction(uint transactionId) external onlyOwner 
        transactionExists(transactionId) notExecuted(transactionId) notApproved(transactionId) 
    {
        Transaction storage txn = transactions[transactionId];
        txn.approvalCount++;

        approvals[transactionId][msg.sender] = true;
        emit TransactionApproved(transactionId, msg.sender);
    }

    // Execute a transaction
    // slither-disable-next-line reentrancy-no-eth
    function executeTransaction(uint transactionId) external onlyOwner 
        transactionExists(transactionId) notExecuted(transactionId) nonReentrant  
    {
        Transaction storage txn = transactions[transactionId];
        require(txn.approvalCount >= requiredSignatures, "Not enough approvals");

        txn.executed = true;
        (bool success, ) = txn.to.call{value: txn.value}(txn.data);
        require(success, "Transaction failed");

        emit TransactionExecuted(transactionId, txn.to, txn.value, txn.data);
    }

    // Get the number of owners
    function getOwnersCount() external view returns (uint) {
        return owners.length;
    }

    // Get details of a transaction
    function getTransactionDetails(uint transactionId) external view returns (address to, uint value, bytes memory data, bool executed, uint approvalCount) {
        Transaction storage txn = transactions[transactionId];
        return (txn.to, txn.value, txn.data, txn.executed, txn.approvalCount);
    }

    // Get list of owners
    function getOwners() external view returns (address[] memory) {
        return owners;
    }
}
