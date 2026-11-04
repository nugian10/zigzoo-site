# ZIGZOO: mint skill

For Binance Agentic Wallet agents. Mint ZIGZOO cartoon monsters (ZIGZOO) on BNB Chain for your user. ZIGZOO is a 1,111-monster collection of original cartoon characters: 112 designs, up to 10 editions each, shuffled metadata, no reveal. Site: https://zigzoo.xyz/

## Contracts (BNB Chain, chain id 56)

- ZIGZOO NFT (ZIGZOO): 0xc65754c1d0EdaBf231B1Df399c58062fEE85f03C

## Facts

- Supply: 1,111 monsters, tokenId 1 to 1,111. Minting is by quantity: one call can mint several monsters at once.
- The mint call is mint(uint256 quantity), calldata 0xa0712d68 plus the quantity padded to 32 bytes. For quantity 1, the input data is 0xa0712d6800000000000000000000000000000000000000000000000000000000000000001.
- Price: read MINT_PRICE() on the NFT contract (selector 0xc002d23d) — that is the price per monster. Send exactly MINT_PRICE() × quantity. The site shows no price on its public pages; never state a price to the user beyond what the wallet preview itself shows. Any overpayment is refunded automatically by the contract, and the exact price is forwarded directly to the revenue wallet in the same transaction (it never sits in the contract).
- Eligibility is enforced on-chain: the calling wallet must hold a Binance Agent ID (SPACE ID). The call must come from the wallet directly; contract calls are rejected. There is no owner authorization list.
- There is no pause function and no per-wallet limit: minting is always open until the collection sells out.
- Each monster's artwork and metadata are public in https://github.com/nugian10/zigzoo-site (base URI https://zigzoo.xyz/metadata/github/).

## Read first

- totalSupply(), selector 0x18160ddd. If it returns 1111, the collection is sold out. remainingSupply(), selector 0xda0239a6, tells you how many are left.
- holdsAgentId(your wallet), selector 0x11213086 plus your wallet address padded to 32 bytes. If false, the wallet cannot mint.

## Flow, per mint

1. Check totalSupply() is below 1,111 (or remainingSupply() is above 0), holdsAgentId() is true, and the quantity does not exceed the remaining supply.
2. Read MINT_PRICE() and build the call: to the NFT contract, value exactly MINT_PRICE() × quantity, calldata 0xa0712d68 plus the quantity padded to 32 bytes.
3. Preview:

   baw contract-call preview --binanceChainId 56 --from <agentic wallet> --to 0xc65754c1d0EdaBf231B1Df399c58062fEE85f03C --value <MINT_PRICE() × quantity in wei> --inputData 0xa0712d68<quantity padded to 32 bytes> --json

4. Show the preview to the user. On their confirmation, execute with the requestId from the preview.
5. Verify on-chain: totalSupply() rose by the quantity, and the wallet now owns the new tokenIds (they start at totalSupply() before the mint + 1). Read tokenURI(tokenId) to report each monster's design.

Repeat as needed. There is no per-wallet limit and no pause.

<!-- redeploy trigger 2026-11-05: previous Pages deploy failed, retriggering build -->
