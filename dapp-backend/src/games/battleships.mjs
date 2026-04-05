/**
 * Battleships — duel-only, turn-based async game.
 * Custom duel system with its own tables and endpoints.
 * Does NOT use the scoring engine's session/evaluate flow.
 */

// ── Fleet definition ─────────────────────────────────────────────────────────
export const FLEET = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Destroyer', size: 2 }
];

// ── Seeded PRNG (mulberry32) ─────────────────────────────────────────────────
function mulberry32(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Validate fleet placement ─────────────────────────────────────────────────
/**
 * fleet: [{ ship: 'Carrier', cells: [{x,y}, ...] }, ...]
 * Returns { valid: true } or { valid: false, reason: string }
 */
export function validateFleet(fleet) {
  if (!Array.isArray(fleet) || fleet.length !== 5) {
    return { valid: false, reason: 'Fleet must contain exactly 5 ships' };
  }

  const occupied = new Set();
  const shipNames = new Set();

  for (const placement of fleet) {
    const def = FLEET.find(f => f.name === placement.ship);
    if (!def) return { valid: false, reason: 'Unknown ship: ' + placement.ship };
    if (shipNames.has(placement.ship)) return { valid: false, reason: 'Duplicate ship: ' + placement.ship };
    shipNames.add(placement.ship);

    if (!Array.isArray(placement.cells) || placement.cells.length !== def.size) {
      return { valid: false, reason: placement.ship + ' must have exactly ' + def.size + ' cells' };
    }

    // Check cells are within grid and contiguous in a line
    const xs = placement.cells.map(c => c.x);
    const ys = placement.cells.map(c => c.y);

    for (const cell of placement.cells) {
      if (cell.x < 0 || cell.x > 9 || cell.y < 0 || cell.y > 9) {
        return { valid: false, reason: placement.ship + ' has cells outside 10x10 grid' };
      }
      const key = cell.x + ',' + cell.y;
      if (occupied.has(key)) {
        return { valid: false, reason: 'Overlapping cells at (' + cell.x + ',' + cell.y + ')' };
      }
      occupied.add(key);
    }

    // Must be horizontal or vertical line
    const uniqueXs = [...new Set(xs)];
    const uniqueYs = [...new Set(ys)];
    const isHorizontal = uniqueYs.length === 1 && uniqueXs.length === def.size;
    const isVertical = uniqueXs.length === 1 && uniqueYs.length === def.size;

    if (!isHorizontal && !isVertical) {
      return { valid: false, reason: placement.ship + ' must be placed in a straight line' };
    }

    // Check contiguous (no gaps)
    if (isHorizontal) {
      const sorted = uniqueXs.sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] - sorted[i - 1] !== 1) {
          return { valid: false, reason: placement.ship + ' cells must be contiguous' };
        }
      }
    } else {
      const sorted = uniqueYs.sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] - sorted[i - 1] !== 1) {
          return { valid: false, reason: placement.ship + ' cells must be contiguous' };
        }
      }
    }
  }

  // Check all 5 ship types present
  for (const def of FLEET) {
    if (!shipNames.has(def.name)) {
      return { valid: false, reason: 'Missing ship: ' + def.name };
    }
  }

  return { valid: true };
}

// ── Calculate range (Euclidean from nearest cell of firing ship to target) ───
export function calculateRange(firingShipCells, targetX, targetY) {
  let minDist = Infinity;
  for (const cell of firingShipCells) {
    const dx = cell.x - targetX;
    const dy = cell.y - targetY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) minDist = dist;
  }
  return Math.round(minDist * 10) / 10;
}

// ── Check hit ────────────────────────────────────────────────────────────────
export function checkHit(targetX, targetY, opponentFleet) {
  for (const ship of opponentFleet) {
    for (const cell of ship.cells) {
      if (cell.x === targetX && cell.y === targetY) {
        return { hit: true, shipName: ship.ship };
      }
    }
  }
  return { hit: false, shipName: null };
}

// ── Check sunk ───────────────────────────────────────────────────────────────
/**
 * Returns true if all cells of the named ship have been hit in the rounds.
 * allRounds: all rounds for this game, opponentWallet is implicit (we check
 * hits against the opponent's fleet).
 */
export function checkSunk(shipName, opponentFleet, allRounds) {
  const ship = opponentFleet.find(s => s.ship === shipName);
  if (!ship) return false;

  const hitCoords = new Set();
  for (const round of allRounds) {
    if (round.result === 'hit' || round.result === 'sunk') {
      hitCoords.add(round.target_x + ',' + round.target_y);
    }
  }

  return ship.cells.every(cell => hitCoords.has(cell.x + ',' + cell.y));
}

// ── Check win ────────────────────────────────────────────────────────────────
export function checkWin(opponentFleet, allRounds, opponentWallet) {
  // Filter rounds that targeted the opponent (shots by the attacking player)
  const attackRounds = allRounds.filter(r => r.wallet !== opponentWallet);

  for (const ship of opponentFleet) {
    if (!checkSunk(ship.ship, opponentFleet, attackRounds)) return false;
  }
  return true;
}

// ── Get sanitised game state ─────────────────────────────────────────────────
export function getGameState(game, wallet, rounds, placements) {
  const myPlacement = placements.find(p => p.wallet === wallet);
  const opponentWallet = game.creator_wallet === wallet ? game.opponent_wallet : game.creator_wallet;
  const opponentPlacement = placements.find(p => p.wallet === opponentWallet);

  // My grid: my fleet + where opponent has shot at me
  const myFleet = myPlacement ? JSON.parse(myPlacement.fleet) : null;
  const opponentShots = rounds.filter(r => r.wallet === opponentWallet);

  // Tracking grid: where I have shot at opponent
  const myShots = rounds.filter(r => r.wallet === wallet);

  // Determine which of opponent's ships I've sunk
  const sunkShips = [];
  let sunkShipCells = {};
  if (opponentPlacement) {
    const oppFleet = JSON.parse(opponentPlacement.fleet);
    for (const ship of oppFleet) {
      if (checkSunk(ship.ship, oppFleet, myShots)) {
        sunkShips.push(ship.ship);
        sunkShipCells[ship.ship] = ship.cells;
      }
    }
  }

  const state = {
    game_id: game.id,
    share_code: game.share_code,
    status: game.status,
    stake_qf: game.stake_qf,
    creator_wallet: game.creator_wallet,
    opponent_wallet: game.opponent_wallet,
    current_turn: game.current_turn,
    winner_wallet: game.winner_wallet,
    created_at: game.created_at,
    started_at: game.started_at,
    completed_at: game.completed_at,
    my_fleet: myFleet,
    my_fleet_placed: !!myPlacement,
    opponent_joined: !!game.opponent_wallet,
    opponent_placed: !!opponentPlacement,
    opponent_shots_on_me: opponentShots.map(r => ({
      x: r.target_x, y: r.target_y, result: r.result, round: r.round_number
    })),
    my_shots: myShots.map(r => ({
      x: r.target_x, y: r.target_y, result: r.result, ship_hit: r.ship_hit,
      range: r.range_distance, firing_ship: r.firing_ship, round: r.round_number
    })),
    sunk_ships: sunkShips,
    sunk_ship_cells: sunkShipCells
  };

  // Reveal opponent fleet only when game is complete
  if (game.status === 'completed' && opponentPlacement) {
    state.opponent_fleet = JSON.parse(opponentPlacement.fleet);
  }

  return state;
}

// ── CPU fleet placement (seeded) ─────────────────────────────────────────────
export function cpuPlaceFleet(seed) {
  const rng = mulberry32(seed);
  const occupied = new Set();
  const fleet = [];

  for (const def of FLEET) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 200) {
      attempts++;
      const horizontal = rng() < 0.5;
      const x = Math.floor(rng() * (horizontal ? 10 - def.size + 1 : 10));
      const y = Math.floor(rng() * (horizontal ? 10 : 10 - def.size + 1));

      const cells = [];
      let overlap = false;
      for (let i = 0; i < def.size; i++) {
        const cx = horizontal ? x + i : x;
        const cy = horizontal ? y : y + i;
        const key = cx + ',' + cy;
        if (occupied.has(key)) { overlap = true; break; }
        cells.push({ x: cx, y: cy });
      }

      if (!overlap) {
        for (const cell of cells) occupied.add(cell.x + ',' + cell.y);
        fleet.push({ ship: def.name, cells });
        placed = true;
      }
    }
  }

  return fleet;
}

// ── CPU shooting: Recruit (random) ───────────────────────────────────────────
/**
 * myGrid: set of "x,y" strings already shot at
 */
export function cpuShootRecruit(myGrid) {
  const candidates = [];
  for (let x = 0; x < 10; x++) {
    for (let y = 0; y < 10; y++) {
      if (!myGrid.has(x + ',' + y)) candidates.push({ x, y });
    }
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ── CPU shooting: Officer (hunt and target) ──────────────────────────────────
export function cpuShootOfficer(myGrid, opponentHits, opponentMisses) {
  // If we have unsunk hits, target adjacent cells
  const hitSet = new Set(opponentHits.map(h => h.x + ',' + h.y));
  const allShot = new Set([...myGrid]);

  // Find hits that could have unsunk neighbours
  for (const hit of opponentHits) {
    const adj = [
      { x: hit.x - 1, y: hit.y },
      { x: hit.x + 1, y: hit.y },
      { x: hit.x, y: hit.y - 1 },
      { x: hit.x, y: hit.y + 1 }
    ];
    const viable = adj.filter(c =>
      c.x >= 0 && c.x <= 9 && c.y >= 0 && c.y <= 9 && !allShot.has(c.x + ',' + c.y)
    );
    if (viable.length > 0) {
      return viable[Math.floor(Math.random() * viable.length)];
    }
  }

  // No hot targets — random shot
  return cpuShootRecruit(myGrid);
}

// ── CPU shooting: Admiral (probability density map) ──────────────────────────
export function cpuShootAdmiral(myGrid, opponentHits, opponentMisses, remainingFleet) {
  const allShot = new Set([...myGrid]);

  // Build density map
  const density = Array.from({ length: 10 }, () => new Array(10).fill(0));

  for (const ship of remainingFleet) {
    // Try every possible placement of this ship
    for (let horizontal = 0; horizontal <= 1; horizontal++) {
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          const cells = [];
          let valid = true;
          for (let i = 0; i < ship.size; i++) {
            const cx = horizontal ? x + i : x;
            const cy = horizontal ? y : y + i;
            if (cx > 9 || cy > 9) { valid = false; break; }
            const key = cx + ',' + cy;
            // Cannot place over a miss
            if (opponentMisses.has(key)) { valid = false; break; }
            cells.push({ x: cx, y: cy });
          }
          if (valid) {
            for (const cell of cells) {
              if (!allShot.has(cell.x + ',' + cell.y)) {
                density[cell.y][cell.x]++;
              }
            }
          }
        }
      }
    }
  }

  // Pick the highest-density unshot cell
  let best = null;
  let bestVal = 0;
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      if (!allShot.has(x + ',' + y) && density[y][x] > bestVal) {
        bestVal = density[y][x];
        best = { x, y };
      }
    }
  }

  return best || cpuShootRecruit(myGrid);
}

// ── Pick a random surviving ship for auto-shot ───────────────────────────────
export function pickSurvivingShip(fleet, rounds, wallet) {
  const myAttackRounds = rounds.filter(r => r.wallet === wallet);
  const surviving = [];

  for (const ship of fleet) {
    // A ship survives if NOT all its cells are hit
    const hitCells = new Set();
    for (const round of myAttackRounds) {
      if (round.result === 'hit' || round.result === 'sunk') {
        hitCells.add(round.target_x + ',' + round.target_y);
      }
    }
    const allHit = ship.cells.every(c => hitCells.has(c.x + ',' + c.y));
    if (!allHit) surviving.push(ship);
  }

  if (surviving.length === 0) return null;
  return surviving[Math.floor(Math.random() * surviving.length)];
}
