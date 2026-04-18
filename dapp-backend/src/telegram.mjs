// Telegram broadcast notifications for @qf_games.
// Singleton queue, 500ms tick, max 1 message per tick, fire-and-forget.
// Gated by TELEGRAM_NOTIFICATIONS_ENABLED=true. Bot token + channel ID from env.

import { getDb } from './db/index.mjs';

const ENABLED = process.env.TELEGRAM_NOTIFICATIONS_ENABLED === 'true';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '';

const TICK_MS = 500;
const queue = [];
const dedupSeen = new Set();

function startSender() {
  if (!ENABLED) return;
  if (!BOT_TOKEN || !CHANNEL_ID) {
    console.warn('[telegram] enabled but BOT_TOKEN or CHANNEL_ID missing — notifications will be dropped');
    return;
  }
  setInterval(async () => {
    if (queue.length === 0) return;
    const text = queue.shift();
    try {
      const res = await fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHANNEL_ID, text: text, disable_web_page_preview: true })
      });
      if (!res.ok) {
        const body = await res.text();
        console.error('[telegram] send failed (' + res.status + '): ' + body);
      }
    } catch (e) {
      console.error('[telegram] send error: ' + e.message);
    }
  }, TICK_MS);
}
startSender();

function truncateAddr(addr) {
  if (!addr || typeof addr !== 'string') return '???';
  if (!addr.startsWith('0x') || addr.length < 10) return addr;
  return addr.slice(0, 6) + '\u2026' + addr.slice(-4);
}

function getCachedQnsName(wallet) {
  if (!wallet) return null;
  try {
    const row = getDb().prepare(
      'SELECT qns_name FROM global_leaderboard_entries WHERE wallet = ? AND qns_name IS NOT NULL AND qns_name != "" ORDER BY paid_at DESC LIMIT 1'
    ).get(wallet.toLowerCase());
    return row ? row.qns_name : null;
  } catch (e) {
    return null;
  }
}

function formatWallet(addr, qnsName) {
  if (qnsName && qnsName.length > 0) return qnsName;
  const cached = getCachedQnsName(addr);
  if (cached) return cached;
  return truncateAddr(addr);
}

function titleCase(s) {
  if (!s) return '';
  return s.split(/[-_\s]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const POS_EMOJI = ['\ud83e\udd47', '\ud83e\udd48', '\ud83e\udd49']; // gold, silver, bronze medal

function buildMessage(type, data) {
  const tier = titleCase(data.tier || '');
  const game = titleCase(data.game || data.gameId || '');
  switch (type) {
    case 'league_open':
      return '\ud83c\udd95 New ' + tier + ' ' + game + ' league open. Entry ' + data.fee + ' QF. Join now.';
    case 'league_closed':
      return '\ud83d\udd12 ' + tier + ' ' + game + ' league closed. ' + data.count + ' players locked in.';
    case 'league_minimum_reached':
      return '\u2705 ' + tier + ' ' + game + ' league hit minimum. Guaranteed to run.';
    case 'league_settled': {
      const lines = ['\ud83c\udfc6 ' + tier + ' ' + game + ' league settled.'];
      const positions = data.positions || [];
      for (let i = 0; i < positions.length; i++) {
        const p = positions[i];
        const prefix = i < 3 ? POS_EMOJI[i] : '#' + (i + 1);
        const who = formatWallet(p.wallet, null);
        lines.push(prefix + ' ' + who + ' \u2014 ' + p.amount + ' QF');
      }
      return lines.join('\n');
    }
    case 'achievement_minted': {
      const who = formatWallet(data.wallet, data.qnsName);
      return '\ud83d\udc8e ' + who + ' minted ' + data.achievementName + '.';
    }
    case 'achievement_pioneer': {
      const who = formatWallet(data.wallet, data.qnsName);
      return '\u2b50 PIONEER MINT: ' + who + ' is the first ever to claim ' + data.achievementName + '.';
    }
    case 'daily_digest':
      return '\ud83d\udcca Daily Digest\nGames played: ' + (data.games || 0)
           + '\nAchievements minted: ' + (data.achievements || 0)
           + '\nQF burned: ' + (Math.round((data.burn || 0) * 10) / 10);
    default:
      return null;
  }
}

// Fire a notification. Returns true if queued, false if skipped (gate off / dedup / build fail).
export function queueNotification(type, data) {
  if (!ENABLED) return false;

  // Fire-once dedup for events that the lifecycle ticker re-observes
  if (data && data.dedupKey) {
    if (dedupSeen.has(data.dedupKey)) return false;
    dedupSeen.add(data.dedupKey);
  }

  const text = buildMessage(type, data || {});
  if (!text) {
    console.warn('[telegram] unknown notification type: ' + type);
    return false;
  }
  queue.push(text);
  return true;
}

// Daily digest — fires once at 08:00 UTC per day.
// Uses active_game_state.completed_at for free games (post-feature only),
// league_scores.submitted_at, battleships_games.completed_at. Duels excluded
// (no completed_at column — added when that lands).
let _lastDigestDate = null;

function sendDailyDigest() {
  try {
    const now = new Date();
    const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const yesterdayUtc = todayUtc - 24 * 60 * 60 * 1000;
    const db = getDb();

    const free = db.prepare(
      "SELECT COUNT(*) AS n FROM active_game_state WHERE context_type='free' AND status='completed' AND completed_at >= ? AND completed_at < ?"
    ).get(yesterdayUtc, todayUtc);
    const league = db.prepare(
      "SELECT COUNT(*) AS n FROM league_scores WHERE submitted_at >= ? AND submitted_at < ?"
    ).get(yesterdayUtc, todayUtc);
    const bs = db.prepare(
      "SELECT COUNT(*) AS n FROM battleships_games WHERE status='complete' AND completed_at >= ? AND completed_at < ?"
    ).get(yesterdayUtc, todayUtc);
    const ach = db.prepare(
      "SELECT COUNT(*) AS n FROM achievement_eligibility WHERE minted_at >= ? AND minted_at < ?"
    ).get(yesterdayUtc, todayUtc);
    const burn = db.prepare(
      "SELECT COALESCE(SUM(amount_qf), 0) AS qf FROM escrow_ledger WHERE direction='out' AND type='burn' AND created_at >= ? AND created_at < ?"
    ).get(yesterdayUtc, todayUtc);

    queueNotification('daily_digest', {
      games: (free.n || 0) + (league.n || 0) + (bs.n || 0),
      achievements: ach.n || 0,
      burn: burn.qf || 0
    });
  } catch (e) {
    console.error('[telegram] daily digest error: ' + e.message);
  }
}

function startDigestScheduler() {
  if (!ENABLED) return;
  setInterval(() => {
    const now = new Date();
    if (now.getUTCHours() !== 8) return;
    const dateKey = now.getUTCFullYear() + '-' + (now.getUTCMonth() + 1) + '-' + now.getUTCDate();
    if (_lastDigestDate === dateKey) return;
    _lastDigestDate = dateKey;
    sendDailyDigest();
  }, 60 * 1000);
}
startDigestScheduler();

// ─── Duel broadcast (user-initiated, synchronous, message_id tracked) ───
// These are distinct from the queued notifications above — they need a
// returned message_id so the server can later edit the post on accept,
// expire, or settle.

const GAME_DISPLAY_NAMES = {
  'sudoku-duel': 'Sudoku Duel',
  'kenken': 'KenKen',
  'kakuro': 'Kakuro',
  'nonogram': 'Nonogram',
  'countdown-numbers': 'Countdown Numbers',
  'cryptarithmetic-club': 'Cryptarithmetic Club',
  'poker-patience': 'Poker Patience',
  'cribbage-solitaire': 'Cribbage Solitaire',
  'freecell': 'FreeCell',
  'minesweeper': 'Minesweeper'
};

function gameDisplay(gameId) {
  return GAME_DISPLAY_NAMES[gameId] || titleCase(gameId || '');
}

export function duelAcceptUrl(gameId, code) {
  return 'https://mathswins.co.uk/qf-dapp/games/' + gameId + '/?duel=' + code;
}

function buildDuelOpen(duel) {
  const who = formatWallet(duel.creator_wallet, duel.creator_qns);
  const url = duelAcceptUrl(duel.game_id, duel.share_code);
  return '\u2694\ufe0f New Duel from ' + who
    + '\nGame: ' + gameDisplay(duel.game_id) + '  \u00b7  Stake: ' + duel.stake + ' QF'
    + '\nCode: ' + duel.share_code
    + '\nAccept \u2192 ' + url;
}

function buildDuelAccepted(duel) {
  return '\u2705 Accepted \u00b7 duel in play'
    + '\nGame: ' + gameDisplay(duel.game_id) + '  \u00b7  Stake: ' + duel.stake + ' QF'
    + '\nCode: ' + duel.share_code;
}

function buildDuelExpired(duel) {
  return '\u274c Expired \u00b7 no opponent'
    + '\nGame: ' + gameDisplay(duel.game_id) + '  \u00b7  Stake: ' + duel.stake + ' QF'
    + '\nCode: ' + duel.share_code;
}

function buildDuelSettled(duel, winnerWallet, isDraw) {
  if (isDraw) {
    return '\ud83e\udd1d Draw \u00b7 duel closed'
      + '\nGame: ' + gameDisplay(duel.game_id) + '  \u00b7  Stake: ' + duel.stake + ' QF';
  }
  const who = formatWallet(winnerWallet, null);
  return '\ud83c\udfc6 Winner: ' + who
    + '\nGame: ' + gameDisplay(duel.game_id) + '  \u00b7  Stake: ' + duel.stake + ' QF';
}

// Post a new duel broadcast. Returns { ok: true, message_id } or { ok: false, error }.
// Synchronous — awaits Telegram API response so caller can persist message_id.
export async function postDuelBroadcast(duel) {
  if (!ENABLED) return { ok: false, error: 'notifications_disabled' };
  if (!BOT_TOKEN || !CHANNEL_ID) return { ok: false, error: 'bot_not_configured' };
  const text = buildDuelOpen(duel);
  try {
    const res = await fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHANNEL_ID, text: text, disable_web_page_preview: false })
    });
    const body = await res.json();
    if (!res.ok || !body.ok) {
      console.error('[telegram] postDuelBroadcast failed: ' + JSON.stringify(body));
      return { ok: false, error: body.description || ('http_' + res.status) };
    }
    return { ok: true, message_id: body.result.message_id };
  } catch (e) {
    console.error('[telegram] postDuelBroadcast error: ' + e.message);
    return { ok: false, error: e.message };
  }
}

// Edit an existing broadcast message. Fire-and-forget — logs on failure but
// never throws; a failed edit must not block the duel state transition.
async function editDuelBroadcast(messageId, text) {
  if (!ENABLED || !BOT_TOKEN || !CHANNEL_ID || !messageId) return;
  try {
    const res = await fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/editMessageText', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHANNEL_ID, message_id: messageId, text: text, disable_web_page_preview: false })
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('[telegram] editDuelBroadcast failed (' + res.status + '): ' + body);
    }
  } catch (e) {
    console.error('[telegram] editDuelBroadcast error: ' + e.message);
  }
}

export function editDuelBroadcastAccepted(messageId, duel) {
  editDuelBroadcast(messageId, buildDuelAccepted(duel)).catch(() => {});
}

export function editDuelBroadcastExpired(messageId, duel) {
  editDuelBroadcast(messageId, buildDuelExpired(duel)).catch(() => {});
}

export function editDuelBroadcastSettled(messageId, duel, winnerWallet, isDraw) {
  editDuelBroadcast(messageId, buildDuelSettled(duel, winnerWallet, !!isDraw)).catch(() => {});
}

// Build a sample payload for the admin test endpoint, then queue it.
// Returns { queued: bool, text: string|null, enabled: bool }.
export function sendTestNotification(type) {
  const samples = {
    league_open:            { tier: 'bronze', game: 'kenken', fee: 100 },
    league_closed:          { tier: 'bronze', game: 'kenken', count: 8 },
    league_minimum_reached: { tier: 'silver', game: 'sudoku-duel' },
    league_settled:         { tier: 'bronze', game: 'kenken', positions: [
                                { position: 1, wallet: '0xAbCdEf0123456789012345678901234567890123', amount: 1800 },
                                { position: 2, wallet: '0x1111111111111111111111111111111111111111', amount: 1200 },
                                { position: 3, wallet: '0x2222222222222222222222222222222222222222', amount: 600 }
                              ] },
    achievement_minted:     { wallet: '0xAbCdEf0123456789012345678901234567890123', qnsName: null, achievementName: 'The Wolf' },
    achievement_pioneer:    { wallet: '0xAbCdEf0123456789012345678901234567890123', qnsName: null, achievementName: 'The Wolf' }
  };
  const data = samples[type];
  const text = data ? buildMessage(type, data) : null;
  if (!data) return { queued: false, text: null, enabled: ENABLED, error: 'unknown type' };
  const queued = queueNotification(type, data);
  return { queued, text, enabled: ENABLED };
}
