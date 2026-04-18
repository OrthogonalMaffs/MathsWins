/**
 * Shared helper for posting duels to the @qf_games Telegram channel.
 *
 * Usage — in each duel game's share modal:
 *   <button id="post-channel-btn" onclick="QFDuelBroadcast.post({
 *     code: duelCode,
 *     stake: duelStake,
 *     button: this
 *   })">Post to @qf_games</button>
 *
 * Call QFDuelBroadcast.updateButton(btnEl, stake) on stake change to
 * keep the disabled/tooltip state in sync with the current stake value.
 *
 * Server enforces: creator-only, status=created, not already broadcast,
 * stake >= 100 QF, rate limit 5 per wallet per 24h. Frontend mirrors
 * the stake check and handles UX — server is authoritative.
 */
(function () {
  var API_BASE = 'https://dapp-api.mathswins.co.uk/api/dapp';
  if (location.hostname === '127.0.0.1' || location.hostname === 'localhost') {
    API_BASE = 'http://127.0.0.1:3860/api/dapp';
  }

  var MIN_STAKE = 100;

  function canBroadcast(stake) {
    var n = Number(stake);
    return !isNaN(n) && n >= MIN_STAKE;
  }

  function updateButton(btn, stake) {
    if (!btn) return;
    if (canBroadcast(stake)) {
      btn.disabled = false;
      btn.removeAttribute('title');
      btn.style.opacity = '';
    } else {
      btn.disabled = true;
      btn.title = 'Channel posts require a stake of at least ' + MIN_STAKE + ' QF';
      btn.style.opacity = '0.5';
    }
  }

  async function post(opts) {
    opts = opts || {};
    var code = String(opts.code || '').toUpperCase();
    var stake = Number(opts.stake);
    var btn = opts.button || null;

    if (!code) return;

    if (!canBroadcast(stake)) {
      alert('Channel posts require a stake of at least ' + MIN_STAKE + ' QF.');
      return;
    }

    if (!window.qfWallet || !window.qfWallet.isConnected || !window.qfWallet.isConnected()) {
      alert('Connect your wallet first.');
      return;
    }

    var confirmed = window.confirm(
      'Post this duel to @qf_games?\n\n' +
      'Anyone can accept. Your stake and duel code will be visible publicly.'
    );
    if (!confirmed) return;

    var originalLabel = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Posting\u2026'; }

    try {
      if (window.qfWallet.ensureVerified) { await window.qfWallet.ensureVerified(); }

      var headers = window.qfWallet.authHeaders
        ? window.qfWallet.authHeaders()
        : { 'Content-Type': 'application/json' };

      var res = await fetch(API_BASE + '/duel/' + code + '/broadcast', {
        method: 'POST',
        headers: headers
      });
      var data = null;
      try { data = await res.json(); } catch (e) { /* non-JSON response */ }

      if (!res.ok) {
        if (btn) { btn.disabled = false; btn.textContent = originalLabel || 'Post to @qf_games'; }
        alert((data && data.error) || 'Broadcast failed — try again shortly.');
        if (opts.onError) opts.onError((data && data.error) || ('http_' + res.status));
        return;
      }

      if (btn) { btn.textContent = 'Posted \u2713'; btn.disabled = true; }
      if (opts.onSuccess) opts.onSuccess(data);
    } catch (e) {
      if (btn) { btn.disabled = false; btn.textContent = originalLabel || 'Post to @qf_games'; }
      alert('Network error — try again.');
      if (opts.onError) opts.onError(e.message || 'network_error');
    }
  }

  window.QFDuelBroadcast = {
    MIN_STAKE: MIN_STAKE,
    canBroadcast: canBroadcast,
    updateButton: updateButton,
    post: post
  };
})();
