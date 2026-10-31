/* ZIGZOO — frontend configuration.
 * CURRENT STATE (2026-11-01): contract deployed on BNB Smart Chain Mainnet,
 * source verified on BscScan, baseURI set to https://zigzoo.xyz/metadata/github/
 * (artwork + metadata hosted on GitHub Pages, no Pinata, no IPFS).
 * Contract v2 mints only to wallets holding a SPACE ID .ai Agent ID
 * (check holdsAgentId on BscScan). The revenue wallet is set at deploy;
 * mint payments go directly to it.
 *
 * DO NOT fill in a fake address, and DO NOT commit a private key to this repo.
 */
window.ZIGZOO_CONFIG = {
  // Deployed contract. Mint counts on the site are read live from the
  // contract — never simulated numbers.
  CONTRACT_ADDRESS: "0xc65754c1d0EdaBf231B1Df399c58062fEE85f03C",
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
