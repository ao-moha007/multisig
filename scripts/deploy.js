const hre = require("hardhat");

async function main() {
  let owners, owner1, owner2, owner3, nonOwner, otherSigner;
  // Get the signers
  [owner1, owner2, owner3, nonOwner, otherSigner] = await ethers.getSigners();

  owners = [owner1.address, owner2.address, owner3.address];
  // Step 1: Get the contract factory
  const MultiSigWallet = await hre.ethers.getContractFactory("MultiSigWallet");

  // Step 2: Deploy the contract
  console.log("Deploying MultiSigWallet...");
  
  const wallet = await MultiSigWallet.deploy(owners, 2, { value: ethers.parseEther("10.0") });

  // Step 3: Wait for the contract to be deployed
  await wallet.waitForDeployment();

  // Step 4: Log the contract address
  console.log("MyContract deployed to:", wallet.address);

  // Step 5: Verify the contract on Tenderly (optional)
  if (hre.tenderly) {
    console.log("Verifying contract on Tenderly...");
    await hre.tenderly.verify({
      name: "MultiSigWallet",
      address: wallet.address,
    });
    console.log("Contract verified on Tenderly!");
  }
}

// Run the deployment script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });