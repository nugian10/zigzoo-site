/* ZIGZOO — frontend configuration.
 * HOW TO ACTIVATE MINT AFTER MANUAL DEPLOYMENT:
 * 1. Deploy contracts/Zigzoo.sol to BNB Smart Chain Mainnet (see docs/DEPLOYMENT.md).
 * 2. Verify the contract on BscScan.
 * 3. Fill CONTRACT_ADDRESS below with the deployed address.
 * 4. No authorization step: contract v2 mints only to wallets holding a
 *    SPACE ID .ai Agent ID (check holdsAgentId on BscScan). The revenue
 *    wallet is set at deploy; mint payments go directly to it.
 * 5. Upload metadata to IPFS, then set the baseURI via setBaseURI.
 *
 * DO NOT fill in a fake address, and DO NOT commit a private key to this repo.
 */
window.ZIGZOO_CONFIG = {
  // Empty = contract not deployed yet. The frontend will show the status
  // "waiting for deployment" and disable the Mint button — not fake numbers.
  CONTRACT_ADDRESS: "",
  CHAIN_ID: 56,
  CHAIN_NAME: "BNB Smart Chain",
  RPC_URL: "https://bsc-dataseed.binance.org/",
  EXPLORER_TX: "https://bscscan.com/tx/",
  EXPLORER_ADDRESS: "https://bscscan.com/address/",
  MINT_PRICE_BNB: "0.0005",
  MAX_SUPPLY: 1111,
  // Official links: fill ONLY with official accounts once announced.
  // Leave the string empty if there is none yet — the footer will show
  // "Official links will be announced" instead of a fake link.
  SOCIALS: { x: "https://x.com/zigzooNFT", discord: "", telegram: "", website: "" }
};
