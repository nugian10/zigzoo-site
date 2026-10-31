// Cek SPACE ID untuk kontrak ZIGZOO v2 (read-only, tidak mengirim transaksi).
// Penggunaan:
//   CONTRACT_ADDRESS=0x... AGENT_ADDRESS=0x... npx hardhat run scripts/check-agent-id.js --network bsc
// v2 TIDAK punya otorisasi owner: sebuah wallet bisa mint hanya kalau
// holdsAgentId(wallet) = true, yaitu wallet itu memegang minimal 1
// SPACE ID .ai Agent ID NFT di registry yang dikonfigurasi kontrak.
const hre = require("hardhat");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const agent = process.env.AGENT_ADDRESS;
  if (!contractAddress || !agent) throw new Error("Set CONTRACT_ADDRESS dan AGENT_ADDRESS di environment.");
  const Zigzoo = await hre.ethers.getContractFactory("Zigzoo");
  const zigzoo = Zigzoo.attach(contractAddress);
  console.log("Kontrak:", contractAddress);
  console.log("Wallet yang dicek:", agent);
  console.log("agentIdRegistry:", await zigzoo.agentIdRegistry());
  console.log("revenueWallet:", await zigzoo.revenueWallet());
  console.log("holdsAgentId:", await zigzoo.holdsAgentId(agent));
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
