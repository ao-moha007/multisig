# MultiSig Wallet

# Overview

The MultiSig Wallet is a secure Ethereum smart contract that requires multiple owners to approve transactions before execution. It enhances security by preventing unauthorized transactions and mitigating risks like key compromise.

# Features

Multi-Signature Security: Requires a predefined number of owner approvals before executing a transaction.

Ether Deposits: Accepts and stores ETH securely.

Transaction Proposal & Approval: Owners can propose transactions, and other owners must approve them.

Non-Reentrant Execution: Uses OpenZeppelin’s ReentrancyGuard to prevent reentrancy attacks.

Owner Management: Provides visibility into wallet owners and transaction details.

This contract is ideal for DAOs, business treasuries, and joint fund management, ensuring transactions are executed with collective agreement.
