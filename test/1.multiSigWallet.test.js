const { expect } = require("chai");
const { ethers , deployments } = require("hardhat");

describe("MultiSigWallet", function () {
    let MultiSigWallet, wallet, owner1, owner2, owner3, nonOwner, otherSigner;
    let requiredSignatures = 2;
    let owners;

    beforeEach(async () => {
        // Get the signers
        [owner1, owner2, owner3, nonOwner, otherSigner] = await ethers.getSigners();

        owners = [owner1.address, owner2.address, owner3.address];

        // Deploy the MultiSigWallet contract
        MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
        // Deploy the contract and send 10 ETH in the constructor
        wallet = await MultiSigWallet.deploy(owners, 2, { value: ethers.parseEther("10.0") });
        

        await wallet.waitForDeployment();
        
        // Access ABI directly from the deployed contract artifact
        const artifact = await deployments.getArtifact("MultiSigWallet");

        // Log the deployed contract address using Hardhat Deploy
        await deployments.save("MultiSigWallet", {
            address: await wallet.getAddress(),
            abi:  artifact.abi, // Access ABI from the artifact,
        });
        
    });
    
    

    describe("Deployment", function () {

        it("should deploy and save the contract", async () => {
            const contract = await deployments.get("MultiSigWallet");
            
            expect(contract.address).to.be.properAddress;
            console.log("MultiSigWallet contract address:", contract.address);
        });

        it("should set a balance in the wallet", async function () {
            const balance = await ethers.provider.getBalance(await wallet.getAddress());
            expect(balance).to.be.gt(0); // Ensures the balance is greater than 0
        });

        it("should set the correct owners", async function () {
            const walletOwners = await wallet.getOwners();
            expect(walletOwners).to.deep.equal(owners);
        });

        it("should set the correct required signatures", async function () {
            const required = await wallet.requiredSignatures();
            expect(required).to.equal(requiredSignatures);
        });
        
        
    });

    describe("Transactions", function () {
        let txData;

        beforeEach(() => {
            txData = ethers.hexlify(ethers.toUtf8Bytes("Test transaction"));
        });

        it("should allow an owner to propose a transaction", async function () {
            await wallet.connect(owner1).proposeTransaction(owner1.address, 1, txData);
            const transactionDetails = await wallet.getTransactionDetails(0);
            expect(transactionDetails.to).to.equal(owner1.address);
            expect(transactionDetails.value).to.equal(1);
            expect(transactionDetails.data).to.equal(txData);
        });

        it("should require multiple approvals to execute a transaction", async function () {
            await wallet.connect(owner1).proposeTransaction(owner1.address, 1, txData);
            await expect(wallet.connect(owner1).executeTransaction(0)).to.be.revertedWith("Not enough approvals");

            // Only one approval, can't execute
            await wallet.connect(owner2).approveTransaction(0);
            await expect(wallet.connect(owner1).executeTransaction(0)).to.be.revertedWith("Not enough approvals");

            // Approve with the second owner
            await wallet.connect(owner3).approveTransaction(0);
            await expect(wallet.connect(owner1).executeTransaction(0)).to.not.be.reverted;
        });

        it("should execute a transaction after enough approvals", async function () {
            const initialBalance = await ethers.provider.getBalance(await owner1.getAddress());
            await wallet.connect(owner1).proposeTransaction(owner1.address, ethers.parseEther("1.0"), txData);
            await wallet.connect(owner2).approveTransaction(0);
            await wallet.connect(owner3).approveTransaction(0);

            // Execute transaction
            await expect(wallet.connect(owner1).executeTransaction(0))
                .to.emit(wallet, "TransactionExecuted")
                .withArgs(0, owner1.address, ethers.parseEther("1.0"), txData);

            const finalBalance = await ethers.provider.getBalance(await owner1.getAddress());
             // Use BigInt subtraction since Ethers v6 returns BigInt
            expect(finalBalance - initialBalance).to.be.lt(ethers.parseEther("1.0"));

        });

        it("should not allow non-owners to propose transactions", async function () {
            await expect(wallet.connect(nonOwner).proposeTransaction(owner1.address, 1, txData))
                .to.be.revertedWith("Not an owner");
        });

        it("should not allow double approvals", async function () {
            await wallet.connect(owner1).proposeTransaction(owner1.address, 1, txData);
            await wallet.connect(owner2).approveTransaction(0);
            await expect(wallet.connect(owner2).approveTransaction(0))
                .to.be.revertedWith("Transaction already approved by this owner");
        });

        it("should not allow executing an already executed transaction", async function () {
            await wallet.connect(owner1).proposeTransaction(owner1.address, 1, txData);
            await wallet.connect(owner2).approveTransaction(0);
            await wallet.connect(owner3).approveTransaction(0);
            await wallet.connect(owner1).executeTransaction(0);

            await expect(wallet.connect(owner1).executeTransaction(0))
                .to.be.revertedWith("Transaction already executed");
        });

        it("should emit events when transactions are proposed, approved, and executed", async function () {
            await expect(wallet.connect(owner1).proposeTransaction(owner1.address, 1, txData))
                .to.emit(wallet, "TransactionProposed")
                .withArgs(0, owner1.address, 1, txData);

            await expect(wallet.connect(owner2).approveTransaction(0))
                .to.emit(wallet, "TransactionApproved")
                .withArgs(0, owner2.address);

            await expect(wallet.connect(owner3).approveTransaction(0))
                .to.emit(wallet, "TransactionApproved")
                .withArgs(0, owner3.address);

            await expect(wallet.connect(owner1).executeTransaction(0))
                .to.emit(wallet, "TransactionExecuted")
                .withArgs(0, owner1.address, 1, txData);
        });
    });

    describe("Edge Cases", function () {
        it("should not allow less than the required number of owners", async function () {
            await expect(MultiSigWallet.deploy([owner1.address], 2)).to.be.revertedWith("Owners less than required signatures");
        });

        it("should not allow zero address as an owner", async function () {
            await expect(MultiSigWallet.deploy([owner1.address, "0x0000000000000000000000000000000000000000"], 2)).to.be.revertedWith("Owner cannot be zero address");
        });
    });
});
//module.exports.tags = ["MultiSigWallet"];