# ZIGZOO — Website (GitHub storage)

This repository stores the ZIGZOO website on GitHub only, as requested.

## Deployed site (repository root)

The site Vercel serves from this repository root is the optimized version:

- `index.html` — page structure, with only the 3 hero character images embedded
  (tokens #1, #10, #12). Initial load is about 166 KB of local files
  (index + style.css + app.js + config.js), excluding external fonts and
  the ethers CDN script.
- `style.css`, `app.js`, `config.js`, `agent-skill.md`, `vercel.json` — site
  code and configuration. There is no manual Mint button; minting is
  agent-only, via the command copied from the site.
- `gallery/gallery-chunk-1.js` … `gallery-chunk-9.js` — character
  images, in base64, split into chunks of 12. Only chunks 1–2 are used
  by the live gallery, which shows 20 featured characters only
  (#1–#20). A chunk is only downloaded when its gallery section
  scrolls into view or when the user clicks "Load more". Nothing in
  the gallery is downloaded on the first page load. The remaining
  designs (up to 112 total, each with up to 10 editions, 1,111 tokens
  in total) are in the mint pool via metadata/IPFS, not in the
  live gallery.
- The previous single-file version (all 100 images embedded in one
  4.3 MB HTML file) is superseded by this optimized version.

## Other folders

- `frontend/` — earlier source version of the site (separate files
  referencing `artwork/characters/*.webp` tiles). Kept for reference; the
  deployed site is the optimized root version above.
- `contracts/`, `scripts/`, `test/`, `docs/` — the ERC-721 smart contract,
  Hardhat scripts and tests, and deployment documentation.

Key facts (unchanged):
- Supply: 1,111 NFTs, price: 0.0004 BNB per NFT
- Blockchain: BNB Smart Chain Mainnet, Chain ID 56
- Minting: agent-only. The contract is NOT deployed yet, so
  `CONTRACT_ADDRESS` in `config.js` is intentionally empty.
- No private keys or credentials are stored in this repository.
- Individual webp tiles are not stored as separate files in this
  repository because the GitHub snapshot upload used here only accepts
  UTF-8 text files; the images are stored as base64 in the gallery
  chunks above.
