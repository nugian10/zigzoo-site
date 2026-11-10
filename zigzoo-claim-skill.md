# ZIGZOO: $ZGZ claim skill

For Binance Agentic Wallet agents. Claim $ZGZ tokens for your user's
Zigzoo NFT on BNB Chain. One claim per NFT, ever. Site: https://zigzoo.xyz/

## Status — read this first

LIVE — the $ZGZ token contract (0x7Be2CD7AE923DE746B876c810aAa6137aDD6e1F1)
and the ZigzooClaim contract (0x935B095dAC0D68a9a019ea451D6140fA20a7f051)
are deployed and source-verified on BscScan. Claims are open — follow
the flow below.

## Contracts (BNB Chain, chain id 56)

- $ZGZ token (ERC-20): 0x7Be2CD7AE923DE746B876c810aAa6137aDD6e1F1
- ZigzooClaim: 0x935B095dAC0D68a9a019ea451D6140fA20a7f051
- Zigzoo NFT (ZIGZOO): 0x09ADA5A12293C30D75b97c56E34967E8a4326a3C — deployed 6 Nov 2026, mint is LIVE.
- SPACE ID Agent ID registry: 0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F
- Revenue wallet: 0x89c37649Ba3BAA9E1ce028612b7DE4e9c3a947B7 — the 0.0003 BNB claim fee is forwarded
  here in the same transaction.
- Owner: 0x0262e8e5E4584D8AB840fD950a6E2E0A414d4097

## Facts

- $ZGZ total supply: 100,000,000. Claim pool: 77,500,000 $ZGZ.
  Liquidity: 15,000,000 $ZGZ. Treasury: 7,500,000 $ZGZ.
- One claim per NFT, ever. Claim amount by rarity: Common 10,000 $ZGZ,
  Rare 25,000 $ZGZ, Epic 50,000 $ZGZ, Legendary 100,000 $ZGZ. Rarity
  comes from the NFT metadata at https://zigzoo.xyz/metadata/<tokenId>.json
  (attribute "Rarity").
- Claim fee: exactly 0.0003 BNB per claim (300000000000000 wei), sent
  as value with the claim call. The fee is forwarded to the revenue
  wallet in the same transaction.
- claim(tokenId) takes one argument (the tokenId) and claims exactly
  once for that NFT; calldata is the claim(uint256) selector 0x379607f5
  plus the tokenId padded to 32 bytes.
- claimed(tokenId), selector 0xdbe7e3bd plus the tokenId padded to 32
  bytes, returns true if that NFT has already claimed.
- Eligibility is enforced on-chain: the calling wallet must own the NFT
  and hold a Binance Agent ID (SPACE ID). The call must come from the
  wallet directly; contract calls are rejected.

## Read first

- claimed(tokenId), selector 0xdbe7e3bd plus the tokenId padded to 32
  bytes. If true, the NFT has already claimed — do not claim again.
- holdsAgentId(your wallet), selector 0x11213086 plus your wallet
  address padded to 32 bytes. If false, the wallet cannot claim.
- ownerOf(tokenId) on the NFT contract. If the caller is not the owner,
  the claim reverts.
- Read the claim contract's token address and claim fee from the
  contract before each claim — never assume them.

## Flow, per claim

1. Check the claim contract is live: read claimed(tokenId). A
   successful read confirms the claim contract is deployed.
2. Check claimed(tokenId) is false, holdsAgentId() is true, and the
   calling wallet owns the NFT.
3. Read the rarity from the metadata and show the exact claim amount
   and the 0.0003 BNB fee in the preview.
4. Preview:

   baw contract-call preview --binanceChainId 56 --from <agentic wallet> --to <claim contract> --value 300000000000000 --inputData 0x379607f5<tokenId padded to 32 bytes> --json

5. Show the preview to the user, including the exact claim amount and
   the 0.0003 BNB fee. On their confirmation, execute with the
   requestId from the preview.
6. Verify on-chain: claimed(tokenId) is now true and the wallet's $ZGZ
   balance rose by the claim amount.

## Failure reasons

- Already claimed: claimed(tokenId) is true — one claim per NFT, ever.
- Not owner: the calling wallet does not own the NFT.
- No Agent ID: the wallet does not hold a SPACE ID Agent ID.
- Wrong fee: the value sent is not exactly 0.0003 BNB.
- Pool empty: the claim pool (77,500,000 $ZGZ) is exhausted.
- Contract caller rejected: the call came from a contract, not the
  wallet directly.
