// Deploy ZIGZOO v2 ke jaringan yang dipilih lewat --network.
// JANGAN jalankan script ini tanpa persetujuan eksplisit pemilik proyek:
// script ini mengirim transaksi deployment dan memakai BNB untuk gas.
//
// Constructor v2 (berubah dari v1):
//   Zigzoo(baseURI, revenueWallet, agentIdRegistry)
// - baseURI: dari BASE_URI env, default "" (diisi nanti via setBaseURI).
// - revenueWallet: dari REVENUE_WALLET env, default Agentic Wallet Bryan
//   0x89c37649Ba3BAA9E1ce028612b7DE4e9c3a947B7 — pembayaran mint
//   langsung ke wallet ini, tidak mengendap di kontrak.
// - agentIdRegistry: dari AGENT_ID_REGISTRY env, default registry SPACE ID
//   publik 0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F.
//   TIDAK ADA lagi langkah authorize-agent: otorisasi diganti cek SPACE ID.
//
// Contoh (setelah .env diisi, lihat .env.example):
//   npx hardhat run scripts/deploy.js --network bscTestnet   # uji dulu di testnet
//   npx hardhat run scripts/deploy.js --network bsc          # mainnet, manual
//
// Setelah deploy:
// 1. Catat alamat kontrak, JANGAN tempel private key ke mana pun.
// 2. Verifikasi di BscScan (lihat DEPLOY-MAINNET-CHECKLIST.md).
// 3. Isi CONTRACT_ADDRESS di frontend/config.js.
// 4. Periksa holdsAgentId(Agentic Wallet) = true di BscScan (tidak perlu
//    authorize — wallet itu sudah memegang 1 SPACE ID, dicek 2026-11-01).
// 5. Upload metadata, lalu setBaseURI.
const hre = require("hardhat");

async function main() {
  const baseURI = process.env.BASE_URI || "";
  const revenueWallet =
    process.env.REVENUE_WALLET || "0x89c37649Ba3BAA9E1ce028612b7DE4e9c3a947B7";
  const agentIdRegistry =
    process.env.AGENT_ID_REGISTRY || "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F";
  if (!baseURI) {
    console.log("PERINGATAN: BASE_URI kosong. Kontrak tetap bisa di-deploy,");
    console.log("tapi tokenURI akan kosong sampai owner memanggil setBaseURI.");
    console.log("Set BASE_URI di .env sebelum deploy jika metadata sudah siap.\n");
  }
  console.log("Revenue wallet:", revenueWallet);
  console.log("Agent ID registry:", agentIdRegistry);
  const Zigzoo = await hre.ethers.getContractFactory("Zigzoo");
  const zigzoo = await Zigzoo.deploy(baseURI, revenueWallet, agentIdRegistry);
  await zigzoo.waitForDeployment();
  const address = await zigzoo.getAddress();
  console.log("ZIGZOO deployed to:", address);
  console.log("MAX_SUPPLY:", (await zigzoo.MAX_SUPPLY()).toString());
  console.log("MINT_PRICE (wei):", (await zigzoo.MINT_PRICE()).toString());
  console.log("revenueWallet:", await zigzoo.revenueWallet());
  console.log("agentIdRegistry:", await zigzoo.agentIdRegistry());
  console.log("\nLangkah berikutnya:");
  console.log(
    "1. Verifikasi: npx hardhat verify --network <network> " +
      address +
      ' "' +
      baseURI +
      '" ' +
      revenueWallet +
      " " +
      agentIdRegistry
  );
  console.log("2. Isi CONTRACT_ADDRESS di frontend/config.js dengan alamat di atas.");
  console.log("3. Cek di BscScan: holdsAgentId(Agentic Wallet) harus true — tidak ada authorize-agent lagi.");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
