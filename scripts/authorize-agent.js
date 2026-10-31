// Otorisasi / cabut otorisasi satu alamat agent di kontrak ZIGZOO.
// Penggunaan:
//   CONTRACT_ADDRESS=0x... AGENT_ADDRESS=0x... npx hardhat run scripts/authorize-agent.js --network bsc
// Cabut otorisasi:
//   CONTRACT_ADDRESS=0x... AGENT_ADDRESS=0x... REVOKE=1 npx hardhat run scripts/authorize-agent.js --network bsc
// Script ini HANYA boleh dijalankan owner kontrak, dan hanya atas
// persetujuan pemilik proyek. Ini adalah satu-satunya cara sebuah wallet
// menjadi "agent terverifikasi" — bukan dari jenis wallet-nya saja.
const hre = require("hardhat");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const agent = process.env.AGENT_ADDRESS;
  if (!contractAddress || !agent) throw new Error("Set CONTRACT_ADDRESS dan AGENT_ADDRESS di environment.");
  const authorized = process.env.REVOKE !== "1";
  const Zigzoo = await hre.ethers.getContractFactory("Zigzoo");
  const zigzoo = Zigzoo.attach(contractAddress);
  const [signer] = await hre.ethers.getSigners();
  console.log("Owner/signer:", signer.address);
  console.log("Kontrak:", contractAddress);
  console.log((authorized ? "Mengotorisasi" : "Mencabut") + " agent:", agent);
  const tx = await zigzoo.setAgentAuthorization(agent, authorized);
  await tx.wait();
  console.log("Selesai. Hash:", tx.hash);
  console.log("isAuthorizedAgent sekarang:", await zigzoo.isAuthorizedAgent(agent));
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
