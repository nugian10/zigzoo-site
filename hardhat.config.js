require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "cancun" }
  },
  networks: {
    hardhat: {},
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 97
    },
    bsc: {
      url: process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org/",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 56
    }
  },
  etherscan: {
    apiKey: { bsc: process.env.BSCSCAN_API_KEY || "", bscTestnet: process.env.BSCSCAN_API_KEY || "" }
  }
};
