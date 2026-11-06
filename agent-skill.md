# ZIGZOO: mint skill

For Binance Agentic Wallet agents. Mint Zigzoo cute animal NFTs (ZIGZOO)
on BNB Chain for your user. Zigzoo is a 5,000-token collection of original
cute animal characters: 590 designs — Common 400 designs x 10 editions,
Rare 70 x 10, Epic 20 x 10, Legendary 100 designs x 1 edition each (every
Legendary is a different mythical animal). Site: https://zigzoo.xyz/

## Contracts (BNB Chain, chain id 56)

- Zigzoo NFT (ZIGZOO): 0x0000000000000000000000000000000000000000 — PLACEHOLDER, NOT DEPLOYED
  YET. Do NOT attempt any mint transaction until the Zigzoo site shows a
  real deployed contract address.
- SPACE ID Agent ID registry: 0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F

## Facts

- Supply: 5,000 NFTs, tokenId 1 to 5,000. mint() takes no arguments and
  mints exactly 1 NFT per call; calldata is the mint() selector 0x1249c58b.
- Price ladder per wallet (public): mint #1 FREE, #2-10: 0.0002 BNB,
  #11-20: 0.0004 BNB, #21-30: 0.0008 BNB. Max 30 mints per wallet, max
  total 0.0138 BNB. Read priceFor(wallet) (selector 0xf12a7add) or
  currentPrice() (selector 0x9d1b464a) to get the exact price for the next
  mint — never hardcode a price. Any overpayment is refunded automatically
  by the contract, and paid mint value is forwarded directly to the revenue
  wallet in the same transaction (it never sits in the contract).
- Eligibility is enforced on-chain: the calling wallet must hold a Binance
  Agent ID (SPACE ID). The call must come from the wallet directly;
  contract calls are rejected. There is no owner authorization list.
- Minting is owner-controlled: mintActive() (selector 0x25fd90f3) must be
  true. The draw is a shuffled deck (deckHash() selector 0x8830dea2); each
  mint draws the next token. designOf(tokenId) (0xcbfd8d37) and
  editionOf(tokenId) (0x4be185f0) report the design and edition.
- Each animal's artwork and metadata are public at https://zigzoo.xyz/images/ and
  https://zigzoo.xyz/metadata/ (base URI https://zigzoo.xyz/metadata/).

## Read first

- totalSupply(), selector 0x18160ddd. If it returns 5000, the collection
  is sold out.
- mintActive(), selector 0x25fd90f3. If false, minting is not open yet.
- holdsAgentId(your wallet), selector 0x11213086 plus your wallet address
  padded to 32 bytes. If false, the wallet cannot mint.
- mintCount(your wallet), selector 0xed9ec888 plus your wallet address
  padded to 32 bytes. If it is 30, the wallet has reached its limit.
- priceFor(your wallet), selector 0xf12a7add plus your wallet address
  padded to 32 bytes. That is the exact value to send for this mint.

## Flow, per mint

1. Check mintActive() is true, totalSupply() is below 5,000,
   holdsAgentId() is true, and mintCount() is below 30.
2. Read priceFor(your wallet) and build the call: to the NFT contract,
   value exactly priceFor(your wallet), calldata 0x1249c58b.
3. Preview:

   baw contract-call preview --binanceChainId 56 --from <agentic wallet> --to <contract> --value <priceFor in wei> --inputData 0x1249c58b --json

4. Show the preview to the user, including the exact price. On their
   confirmation, execute with the requestId from the preview.
5. Verify on-chain: totalSupply() rose by 1 and mintCount() rose by 1.
   Read tokenURI(tokenId) and designOf(tokenId) to report the animal's
   name, design, edition and rarity.

Repeat as needed, up to 30 mints per wallet.
