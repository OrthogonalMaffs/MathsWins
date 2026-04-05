# Games Roster (13 games)
restore/
  index.html                        # Access restoration — Google login + email magic link fallback
cloudflare-worker/
  worker.js                         # Cloudflare Worker — auth + restore endpoints (deployed via dashboard)
  wrangler.toml                     # Worker config (KV namespace, secrets, routes)
games/                              # Free games (single-file HTML each)
  countdown-numbers/index.html      # Classic 6-number target challenge with solver
  52dle/index.html                  # Also on maffsgames.co.uk
  maffsy/index.html                 # Renamed from Equatle. Also on maffsgames.co.uk
  sudoku-duel/index.html
  higher-or-lower/index.html
  prime-or-composite/index.html     # Also on maffsgames.co.uk
  estimation-engine/index.html      # Also on maffsgames.co.uk
  sequence-solver/index.html        # Also on maffsgames.co.uk
  towers-of-hanoi/index.html
  cryptarithmetic-club/index.html
  memory-matrix/index.html
  dont-press-it/index.html
  rps-vs-machine/index.html
academy/                            # Paid courses (single-file HTML each)
