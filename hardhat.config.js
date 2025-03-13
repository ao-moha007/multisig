require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");
require("hardhat-deploy");
const  dotenv = require("dotenv");
const tenderly = require("@tenderly/hardhat-tenderly");
dotenv.config();

tenderly.setup({ automaticVerifications: true });
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  gasReporter: {
    enabled: true, // Enables reporting
    currency: "ETH", // Shows gas costs in USD
    gasPrice: 20, // Estimated gas price in Gwei
    //coinmarketcap: "YOUR_API_KEY", // Optional: Get live ETH prices
    //outputFile: "gas-report.json", // Optional: Save report to a file
    //noColors: false, // Use colors in the console output
  },
  paths: {
    sources: "./contracts",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    virtual_mainnet: {
      url: process.env.MY_TENDERLY_KEY,
      chainId: 1,
      currency: "VETH"
    },
  },
  tenderly: {
    // https://docs.tenderly.co/account/projects/account-project-slug
    project: "project",
    username: "aizen007",
  },
};
