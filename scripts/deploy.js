// Deploy ZIGZOO ke jaringan yang dipilih lewat --network.
// JANGAN jalankan script ini tanpa persetujuan eksplisit pemilik proyek:
// script ini mengirim transaksi deployment dan memakai BNB untuk gas.
//
// Contoh (setelah .env diisi, lihat .env.example):
//   npx hardhat run scripts/deploy.js --network bscTestnet   # uji dulu di testnet
//   npx hardhat run scripts/deploy.js --network bsc          # mainnet, manual
//
// Setelah deploy:
// 1. Catat alamat kontrak, JANGAN tempel private key ke mana pun.
// 2. Verifikasi di BscScan (lihat docs/DEPLOYMENT.md).
// 3. Isi CONTRACT_ADDRESS di frontend/config.js.
// 4. Otorisasi agent lewat scripts/authorize-agent.js.
// 5. Upload metadata, lalu setBaseURI.
const hre = require("hardhat");

async function main() {
  const baseURI = process.env.BASE_URI || "";
  if (!baseURI) {
    console.log("PERINGATAN: BASE_URI kosong. Kontrak tetap bisa di-deploy,");
    console.log("tapi tokenURI akan kosong sampai owner memanggil setBaseURI.");
    console.log("Set BASE_URI di .env sebelum deploy jika metadata sudah siap.\n");
  }
  const Zigzoo = await hre.ethers.getContractFactory("Zigzoo");
  const zigzoo = await Zigzoo.deploy(baseURI);
  await zigzoo.waitForDeployment();
  const address = await zigzoo.getAddress();
  console.log("ZIGZOO deployed to:", address);
  console.log("MAX_SUPPLY:", (await zigzoo.MAX_SUPPLY()).toString());
  console.log("MINT_PRICE (wei):", (await zigzoo.MINT_PRICE()).toString());
  console.log("\nLangkah berikutnya:");
  console.log("1. Verifikasi: npx hardhat verify --network <network> " + address + ' "' + baseURI + '"');
  console.log("2. Isi CONTRACT_ADDRESS di frontend/config.js dengan alamat di atas.");
  console.log("3. Otorisasi agent: AGENT_ADDRESS=0x... npx hardhat run scripts/authorize-agent.js --network <network>");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
