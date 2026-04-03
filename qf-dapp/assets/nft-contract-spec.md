# League Trophy NFT — Contract Spec

## Architecture
Single contract for all games. Every trophy is a token in the same collection, differentiated by metadata not contract address. One address for wallets and explorers to index.

## Mint Trigger
Automatic — called by the settlement function when a league settles. No manual admin minting. Settlement script already knows final standings, scores, and prize amounts.

Minter: league settlement wallet (server-side, Hetzner). Only authorised minter.

Positions minted: 1st and 2nd place.

## Image Hosting
IPFS via Pinata. One image per game per tier (18 images total). Pinned once, CID referenced on every mint. Images don't change per player — only metadata does.

## Metadata
IPFS-hosted JSON per trophy, standard ERC-721 schema. Settlement script generates JSON, pins to Pinata, gets CID, passes tokenURI to mint function.

```json
{
  "name": "Silver League Champion — Sudoku Duel",
  "description": "1st place finish in Sudoku Duel Silver League, Season 8B0A",
  "image": "ipfs://Qm.../sudoku-duel-silver.png",
  "attributes": [
    { "trait_type": "Game", "value": "Sudoku Duel" },
    { "trait_type": "League Tier", "value": "Silver" },
    { "trait_type": "Position", "value": "1st" },
    { "trait_type": "Total Score", "value": 28420 },
    { "trait_type": "Puzzles Completed", "value": "8/10" },
    { "trait_type": "Total Time", "value": "1:42:17" },
    { "trait_type": "Mistakes", "value": 7 },
    { "trait_type": "Hints", "value": 3 },
    { "trait_type": "Players", "value": 16 },
    { "trait_type": "Prize Won", "display_type": "number", "value": 1800 },
    { "trait_type": "Prize Pool", "display_type": "number", "value": 3600 },
    { "trait_type": "League ID", "value": "6adec25f" },
    { "trait_type": "Date Settled", "value": "2026-04-17" }
  ]
}
```

## Soulbound
Transfer function reverts. Non-transferable. Override `_update` hook in OZ 5.x (or `_transfer` in OZ 4.x) to revert on any transfer attempt.

## Compiler
resolc (Solidity-to-PolkaVM). Confirm:
- ERC-721 full interface support
- Dynamic string storage (tokenURI)
- OZ 5.x `_update` hook
- No block.timestamp issues with 0.1s block time

## Prize Structure Reference

### Silver (250 QF entry, 16 players)
- Pot: 4,000 QF
- Burn 5%: 200 QF
- Team 5%: 200 QF  
- Prize pool: 3,600 QF
- 1st (50%): 1,800 QF
- 2nd (25%): 900 QF
- 3rd (15%): 540 QF
- 4th (10%): 360 QF

### Bronze (100 QF entry, 16 players)
- Pot: 1,600 QF
- Burn 5%: 80 QF
- Team 5%: 80 QF
- Prize pool: 1,440 QF
- 1st (50%): 720 QF
- 2nd (25%): 360 QF
- 3rd (15%): 216 QF
- 4th (10%): 144 QF
