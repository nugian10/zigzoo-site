# ZIGZOO — Agent Skill

These instructions are for an AI agent asked to help mint ZIGZOO.
The agent MUST follow the verification steps below — never assume a
wallet can mint just because it is called an Agentic Wallet. In contract
v2, the only on-chain gate is holding a SPACE ID .ai Agent ID.

## Project

- Name: ZIGZOO
- Blockchain: BNB Smart Chain Mainnet, Chain ID 56
- Total supply: 1,111 NFTs
- Mint price: 0.0005 BNB per NFT
- System: AGENT ONLY MINT (not a public mint)
- Contract: fill in the deployed contract address here after manual
  deployment and verification. Before that address exists, DO NOT claim
  a mint succeeded and DO NOT send any transaction.
  Contract address: 0xc65754c1d0EdaBf231B1Df399c58062fEE85f03C

## Agent steps (in order)

1. Make sure the active network is BNB Smart Chain (Chain ID 56).
   If it is not, ask the user to switch networks first.
2. Read the contract: `totalSupply()`, `MAX_SUPPLY()`, `MINT_PRICE()`.
   Calculate total = quantity × 0.0005 BNB. Reject if the quantity
   exceeds the remaining supply.
3. Verify the SPACE ID Agent ID: call `holdsAgentId(wallet_address)`.
   - If `false`: STOP. Report that the wallet does not hold a SPACE ID
     .ai Agent ID and minting cannot continue. Do not force a transaction.
     There is no owner authorization step in contract v2.
   - If `true`: continue to step 4.
4. Ask for the user's explicit confirmation of the quantity and the
   total BNB + gas before sending any transaction.
5. Send `mint(quantity)` with `value = MINT_PRICE × quantity`.
   Any overpayment is refunded automatically by the contract, and the
   exact price is forwarded directly to the revenue wallet in the same
   transaction (it never sits in the contract).
6. Wait for a confirmed receipt (`tx.wait(1)`), then report the
   transaction hash and its BscScan link. Do not report success
   before the receipt has a successful status.

## Prohibited

- Claiming a wallet is verified only from the wallet's type or name.
- Claiming a wallet is authorized by the owner (contract v2 has no owner authorization list).
- Sending a transaction without the user's confirmation.
- Showing a counter, percentage, or mint success that was not read
  from the blockchain.
- Changing the price, supply, or contract address without evidence
  from the contract.
