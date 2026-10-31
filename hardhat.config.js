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
      chainId: 56,
      // Target deploy di bawah Rp 3.000 (dipilih Bryan 2026-11-01):
      // gasPrice 0.05 gwei = 50.000.000 wei. Dengan gas deploy ~1.727.052,
      // biaya ≈ 0,000086 BNB ≈ Rp 1.100 (kurs BNB ~Rp 12.808.548 saat diukur).
      // Kalau transaksi terlalu lama pending, owner boleh menaikkan gasPrice
      // manual — tapi biayanya akan naik di atas target, dan wallet akan
      // menampilkan total pastinya sebelum Approve. JANGAN ubah ini jadi
      // gasPrice default wallet (biasanya 3 gwei ≈ Rp 66.000) kalau targetnya
      // tetap di bawah Rp 3.000.
      gasPrice: 50000000
    }
  },
  etherscan: {
    apiKey: { bsc: process.env.BSCSCAN_API_KEY || "", bscTestnet: process.env.BSCSCAN_API_KEY || "" }
  }
};
