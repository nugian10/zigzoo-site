// TIDAK BERLAKU LAGI untuk kontrak ZIGZOO v2 (2026-11-01).
// v2 menghapus authorizedAgents / setAgentAuthorization / isAuthorizedAgent.
// Otorisasi digantikan cek SPACE ID: wallet bisa mint hanya kalau memegang
// minimal 1 SPACE ID .ai Agent ID NFT (holdsAgentId = true).
// JANGAN jalankan script ini untuk v2 — gunakan scripts/check-agent-id.js
// (read-only) untuk memeriksa holdsAgentId sebuah wallet.
// File ini dipertahankan hanya sebagai penanda, supaya tidak ada yang
// keliru menjalankan otorisasi owner pada kontrak v2.
throw new Error(
  "authorize-agent.js sudah tidak berlaku untuk ZIGZOO v2. " +
  "Gunakan: CONTRACT_ADDRESS=0x... AGENT_ADDRESS=0x... " +
  "npx hardhat run scripts/check-agent-id.js --network bsc"
);
