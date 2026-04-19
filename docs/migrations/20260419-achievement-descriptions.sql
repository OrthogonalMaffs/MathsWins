-- 20260419 — Achievement description corrections (36 rows)
--
-- Problem: initial 164-row ACHIEVEMENT_DESCRIPTIONS seed contained vague or
-- factually wrong copy on 36 achievements (thresholds, conditions, tone).
-- Audit output reviewed, exact replacements agreed.
--
-- Applied to /home/jon/mathswins-dapp/data/mathswins.db on Box 1.
-- Only the description column is touched — no other columns, no other tables.
-- Each UPDATE is keyed by achievement_id and must affect exactly 1 row.

BEGIN TRANSACTION;

UPDATE achievement_registry SET description = 'Spent 1,000 QF on the platform.' WHERE achievement_id = 'skin-in-the-game';
UPDATE achievement_registry SET description = 'Spent 10,000 QF on the platform.' WHERE achievement_id = 'true-believer';
UPDATE achievement_registry SET description = 'Held The Completionist, The Contrarian, and Shadow Legend simultaneously.' WHERE achievement_id = 'the-grandmaster';
UPDATE achievement_registry SET description = 'Completed a cribbage-solitaire league without scoring zero on any single hand.' WHERE achievement_id = 'crib-master';
UPDATE achievement_registry SET description = 'Cleared the pyramid without drawing a single card from the stock.' WHERE achievement_id = 'the-archaeologist';
UPDATE achievement_registry SET description = 'Cleared the pyramid using only Kings as the final cards played.' WHERE achievement_id = 'kings-ransom';
UPDATE achievement_registry SET description = 'Failed to clear a single pair on the opening attempt.' WHERE achievement_id = 'pharaohs-curse';
UPDATE achievement_registry SET description = 'Failed to complete the pyramid five times in a row.' WHERE achievement_id = 'curse-of-the-mummy';
UPDATE achievement_registry SET description = 'Was dealt the black aces and black eights in a single game.' WHERE achievement_id = 'dead-mans-hand';
UPDATE achievement_registry SET description = 'Completed a game where every scoring hand was exactly one pair — nothing better.' WHERE achievement_id = 'all-pairs';
UPDATE achievement_registry SET description = 'Fired on 50% of the grid in a battleships game without a single hit.' WHERE achievement_id = 'scatter-gun';
UPDATE achievement_registry SET description = 'Fired on 75% of the grid in a battleships game without a single hit.' WHERE achievement_id = 'do-you-even-aim-bro';
UPDATE achievement_registry SET description = 'Sunk 100 submarines across free play games.' WHERE achievement_id = 'sub-hunter';
UPDATE achievement_registry SET description = 'Finished 100 battleships games with the carrier still afloat.' WHERE achievement_id = 'carrier-supremacy';
UPDATE achievement_registry SET description = 'Won 50 battleships games.' WHERE achievement_id = 'the-admiral';
UPDATE achievement_registry SET description = 'Won 10 consecutive battleships games without losing the battleship.' WHERE achievement_id = 'unsinkable';
UPDATE achievement_registry SET description = 'Held The Wolf, Sub Hunter, and Carrier Supremacy simultaneously.' WHERE achievement_id = 'the-wolf-pack';
UPDATE achievement_registry SET description = 'Scored exactly 3,141 in a league or duel game.' WHERE achievement_id = 'pi';
UPDATE achievement_registry SET description = 'Scored exactly 2,718 in a league or duel game.' WHERE achievement_id = 'euler';
UPDATE achievement_registry SET description = 'Scored exactly 1,618 in a league or duel game.' WHERE achievement_id = 'golden-ratio';
UPDATE achievement_registry SET description = 'Scored exactly 1,414 in a league or duel game.' WHERE achievement_id = 'root-two';
UPDATE achievement_registry SET description = 'Scored exactly 1,732 in a league or duel game.' WHERE achievement_id = 'root-three';
UPDATE achievement_registry SET description = 'Held all five mathematical constant achievement NFTs simultaneously.' WHERE achievement_id = 'the-mathematicians-collection';
UPDATE achievement_registry SET description = 'Held all eight purity achievement NFTs simultaneously.' WHERE achievement_id = 'immaculate';
UPDATE achievement_registry SET description = 'Won FreeCell deal number 7,777.' WHERE achievement_id = 'lucky-number';
UPDATE achievement_registry SET description = 'Completed 10 pyramid games.' WHERE achievement_id = 'tutankhamun';
UPDATE achievement_registry SET description = 'Completed 10 sequence-solver puzzles without a single wrong answer.' WHERE achievement_id = 'next-in-line';
UPDATE achievement_registry SET description = 'Won 10 duels.' WHERE achievement_id = 'duelist';
UPDATE achievement_registry SET description = 'Won 50 duels.' WHERE achievement_id = 'gladiator';
UPDATE achievement_registry SET description = 'Won 10 consecutive duels without a loss.' WHERE achievement_id = 'the-wall';
UPDATE achievement_registry SET description = 'Completed 10 leagues.' WHERE achievement_id = 'committed';
UPDATE achievement_registry SET description = 'Completed 50 leagues.' WHERE achievement_id = 'dedicated';
UPDATE achievement_registry SET description = 'Completed 500 leagues.' WHERE achievement_id = 'legend';
UPDATE achievement_registry SET description = 'Won 25 leagues.' WHERE achievement_id = 'dominant';
UPDATE achievement_registry SET description = 'Completed 10 leagues on a single game.' WHERE achievement_id = 'specialist';
UPDATE achievement_registry SET description = 'Won 3 leagues on a single game.' WHERE achievement_id = 'master-of-one';

COMMIT;
