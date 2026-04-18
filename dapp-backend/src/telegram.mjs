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
