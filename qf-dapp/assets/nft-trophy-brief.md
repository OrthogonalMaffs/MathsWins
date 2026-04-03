# League Trophy NFT — Art Brief for Pretty Claude

## What these are
Soulbound (non-transferable) NFT trophies auto-sent to top 4 finishers of every league season. Each game has its own unique artwork. Each game needs a Bronze and Silver variant (matching the league tiers).

## Reference
Sudoku Duel is done — see `qf-dapp/games/sudoku-duel/assets/`:
- `logo-silver.png` — crossed sabres over fading sudoku grid, polished silver, charcoal black
- `logo-bronze.png` — same composition, warm bronze tones, grittier feel

The prompt that generated these is in `qf-dapp/games/sudoku-duel/logoprompt.md`.

## Games needing trophy art (8 games × 2 tiers = 16 images)

| Game | Visual identity to convey |
|------|--------------------------|
| KenKen | Cages/operators, mathematical constraints, grid with thick cage borders |
| Kakuro | Diagonal clue cells, sum-based logic, crossword-meets-sudoku hybrid |
| Nonogram | Pixel art reveal, filled/empty grid, picture emerging from logic |
| Cryptarithmetic Club | Letters becoming digits, equation solving, cipher/code aesthetic |
| Prime or Composite | Number classification, prime spirals, mathematical purity, speed |
| Countdown Numbers | Target number, six source numbers, arithmetic operations, TV game show heritage |
| Sequence Solver | Pattern recognition, escalating series, mathematical sequences |
| Estimation Engine | Mental arithmetic, tolerance/accuracy, rapid calculation |

## Style requirements
- Strictly monochrome per tier: Silver (silver + black) / Bronze (bronze + black)
- No text, no logos, no banners on the image itself (metadata carries the details)
- Photorealistic metallic rendering, dramatic studio lighting
- Square composition (1:1)
- Each game must be visually distinct — instantly recognisable as "that game"
- Premium, heraldic aesthetic (the Sudoku sabres set the bar)

## On-chain metadata (handled by the contract, not the art)
- Game name
- League tier (Bronze / Silver)
- Position (1st, 2nd, 3rd, 4th)
- Total score
- Puzzles completed (e.g. 8/10)
- Number of players in league
- Total mistakes / hints
- Prize won (QF amount)
- Date settled
- Season/league ID
- Soulbound: YES (non-transferable)

## Delivery
- PNG format, high resolution
- Two files per game: `logo-bronze.png` and `logo-silver.png`
- Drop into `qf-dapp/games/{game-slug}/assets/`
- Save the MidJourney/SD prompt alongside as `logoprompt.md`
