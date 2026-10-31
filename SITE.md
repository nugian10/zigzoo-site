# ZIGZOO — Website (GitHub storage)

This repository stores the ZIGZOO website on GitHub only, as requested.

- `index.html` is the complete, self-contained website: hero, Mint Through
  Your Agent section, and a gallery of 100 real ZIGZOO characters. All CSS,
  JavaScript, and all 100 character images are embedded in this one file,
  so it can be served as a static site with no build step.
- `frontend/` holds the same website as separate source files
  (index.html, style.css, app.js, config.js, agent-skill.md). The character
  image tiles themselves are embedded in the root `index.html`; the
  individual webp tiles are not stored in this repository because the
  GitHub snapshot upload used here only accepts UTF-8 text files.
- `contracts/`, `scripts/`, `test/`, and `docs/` hold the ERC-721 smart
  contract, Hardhat scripts and tests, and deployment documentation.

Key facts (unchanged from the project):
- Supply: 1,111 NFTs, price: 0.0004 BNB per NFT
- Blockchain: BNB Smart Chain Mainnet, Chain ID 56
- Minting: agent-only. There is no manual Mint button on the site;
  minting happens only through an authorized agent, via the agent command
  copied from the site. The contract is NOT deployed yet, so
  `CONTRACT_ADDRESS` in `frontend/config.js` is intentionally empty.
- No private keys or credentials are stored in this repository.
