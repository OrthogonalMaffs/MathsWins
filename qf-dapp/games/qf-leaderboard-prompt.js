// qf-leaderboard-prompt.js — shared post-play global-leaderboard submission prompt.
// Exposes window.promptLeaderboardSubmit({ gameId, score, timeMs, sessionId }).
// Fire-and-forget from callers; helper handles auth, eligibility, modal, payment.
(function () {
  'use strict';

  var API = 'https://dapp-api.mathswins.co.uk/api/dapp';
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    API = 'http://127.0.0.1:3860/api/dapp';
  }

  var STYLES_INJECTED = false;
  function injectStyles() {
    if (STYLES_INJECTED) return;
    STYLES_INJECTED = true;
    var css = [
      '.qflb-backdrop{position:fixed;inset:0;background:rgba(5,7,10,.78);z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px;font-family:Inter,system-ui,sans-serif}',
      '.qflb-modal{background:#0e1013;border:1px solid rgba(184,188,198,.15);border-radius:14px;max-width:420px;width:100%;padding:22px 22px 18px;color:#e8eaf0;box-shadow:0 24px 60px rgba(0,0,0,.5);position:relative}',
      '.qflb-close{position:absolute;top:10px;right:12px;background:none;border:none;color:#8a8f9c;font-size:22px;line-height:1;cursor:pointer;padding:4px 8px;border-radius:6px}',
      '.qflb-close:hover{color:#e8eaf0;background:rgba(184,188,198,.08)}',
      '.qflb-title{font-family:"Bebas Neue",sans-serif;font-size:1.4rem;letter-spacing:.08em;color:#e8eaf0;margin:0 0 4px;text-transform:uppercase}',
      '.qflb-game{font-size:.75rem;color:#8a8f9c;letter-spacing:.04em;margin-bottom:14px}',
      '.qflb-stats{display:flex;gap:14px;margin-bottom:14px;flex-wrap:wrap}',
      '.qflb-stat{flex:1;min-width:110px;background:#16181c;border:1px solid rgba(184,188,198,.15);border-radius:8px;padding:10px 12px}',
      '.qflb-stat-lbl{font-size:.55rem;color:#4a4e5a;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px}',
      '.qflb-stat-val{font-family:"DM Mono","JetBrains Mono",monospace;font-size:1.25rem;color:#d4d8e2}',
      '.qflb-ranks{background:#16181c;border:1px solid rgba(184,188,198,.15);border-radius:8px;padding:10px 12px;margin-bottom:14px}',
      '.qflb-ranks-lbl{font-size:.55rem;color:#4a4e5a;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px}',
      '.qflb-rank-row{display:flex;justify-content:space-between;padding:3px 0;font-size:.78rem}',
      '.qflb-rank-period{color:#8a8f9c}',
      '.qflb-rank-pos{font-family:"DM Mono","JetBrains Mono",monospace;color:#c9a84c}',
      '.qflb-cost{text-align:center;font-size:.7rem;color:#8a8f9c;margin-bottom:14px;letter-spacing:.04em}',
      '.qflb-cost strong{font-family:"DM Mono","JetBrains Mono",monospace;color:#d4d8e2;font-weight:400}',
      '.qflb-acts{display:flex;gap:8px}',
      '.qflb-btn{flex:1;padding:11px 14px;border-radius:8px;font-size:.8rem;letter-spacing:.04em;cursor:pointer;transition:all .15s;font-family:inherit}',
      '.qflb-btn-pay{background:#c9a84c;border:1px solid #c9a84c;color:#0e1013;font-weight:600}',
      '.qflb-btn-pay:hover:not(:disabled){background:#d4b358;border-color:#d4b358}',
      '.qflb-btn-pay:disabled{opacity:.5;cursor:not-allowed}',
      '.qflb-btn-cancel{background:transparent;border:1px solid rgba(184,188,198,.15);color:#8a8f9c}',
      '.qflb-btn-cancel:hover{border-color:rgba(184,188,198,.35);color:#d4d8e2}',
      '.qflb-err{background:rgba(239,83,80,.1);border:1px solid rgba(239,83,80,.3);color:#ef8380;border-radius:6px;padding:8px 10px;font-size:.72rem;margin-bottom:12px}',
      '.qflb-ok{text-align:center;padding:12px 0}',
      '.qflb-ok-title{font-family:"Bebas Neue",sans-serif;font-size:1.3rem;letter-spacing:.08em;color:#c9a84c;margin-bottom:6px}',
      '.qflb-ok-sub{font-size:.78rem;color:#8a8f9c}'
    ].join('');
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function formatTime(ms) {
    if (!ms || ms <= 0) return null;
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function ordinal(n) {
    var s = ['th', 'st', 'nd', 'rd'];
    var v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function prettyGame(gameId) {
    return gameId.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  async function fetchEligibility(gameId, score, timeMs, jwt) {
    var periods = ['daily', 'weekly', 'monthly'];
    var calls = periods.map(function (p) {
      var url = API + '/global-leaderboard/' + encodeURIComponent(gameId) +
        '/eligibility?periodType=' + p +
        '&score=' + encodeURIComponent(score) +
        '&timeMs=' + encodeURIComponent(timeMs || 0);
      return fetch(url, { headers: { 'Authorization': 'Bearer ' + jwt } })
        .then(function (r) { return r.json(); })
        .then(function (d) { return { period: p, data: d }; })
        .catch(function () { return { period: p, data: null }; });
    });
    return Promise.all(calls);
  }

  function renderModal({ gameId, score, timeMs, sessionId, qualifying }) {
    injectStyles();
    return new Promise(function (resolve) {
      var backdrop = document.createElement('div');
      backdrop.className = 'qflb-backdrop';

      var modal = document.createElement('div');
      modal.className = 'qflb-modal';

      var close = document.createElement('button');
      close.className = 'qflb-close';
      close.innerHTML = '&times;';
      close.setAttribute('aria-label', 'Close');

      var title = document.createElement('h3');
      title.className = 'qflb-title';
      title.textContent = 'Submit to Leaderboard?';

      var game = document.createElement('div');
      game.className = 'qflb-game';
      game.textContent = prettyGame(gameId);

      var stats = document.createElement('div');
      stats.className = 'qflb-stats';
      var scoreStat = document.createElement('div');
      scoreStat.className = 'qflb-stat';
      scoreStat.innerHTML = '<div class="qflb-stat-lbl">Score</div><div class="qflb-stat-val">' + Number(score).toLocaleString() + '</div>';
      stats.appendChild(scoreStat);
      var timeStr = formatTime(timeMs);
      if (timeStr) {
        var timeStat = document.createElement('div');
        timeStat.className = 'qflb-stat';
        timeStat.innerHTML = '<div class="qflb-stat-lbl">Time</div><div class="qflb-stat-val">' + timeStr + '</div>';
        stats.appendChild(timeStat);
      }

      var ranks = document.createElement('div');
      ranks.className = 'qflb-ranks';
      var ranksHtml = '<div class="qflb-ranks-lbl">Projected rank</div>';
      qualifying.forEach(function (q) {
        var p = q.period.charAt(0).toUpperCase() + q.period.slice(1);
        ranksHtml += '<div class="qflb-rank-row"><span class="qflb-rank-period">' + p + '</span><span class="qflb-rank-pos">' + ordinal(q.rank) + '</span></div>';
      });
      ranks.innerHTML = ranksHtml;

      var cost = document.createElement('div');
      cost.className = 'qflb-cost';
      cost.innerHTML = '<strong>50 QF</strong> to submit';

      var err = document.createElement('div');
      err.className = 'qflb-err';
      err.style.display = 'none';

      var acts = document.createElement('div');
      acts.className = 'qflb-acts';
      var cancelBtn = document.createElement('button');
      cancelBtn.className = 'qflb-btn qflb-btn-cancel';
      cancelBtn.textContent = 'Not now';
      var payBtn = document.createElement('button');
      payBtn.className = 'qflb-btn qflb-btn-pay';
      payBtn.textContent = 'Submit for 50 QF';
      acts.appendChild(cancelBtn);
      acts.appendChild(payBtn);

      modal.appendChild(close);
      modal.appendChild(title);
      modal.appendChild(game);
      modal.appendChild(stats);
      modal.appendChild(ranks);
      modal.appendChild(cost);
      modal.appendChild(err);
      modal.appendChild(acts);
      backdrop.appendChild(modal);
      document.body.appendChild(backdrop);

      function remove() {
        if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      }
      function cancel() {
        try { sessionStorage.setItem('qf_lb_prompted_' + sessionId, '1'); } catch (e) {}
        remove();
        resolve({ outcome: 'cancel' });
      }
      function showError(msg) {
        err.textContent = msg;
        err.style.display = 'block';
        payBtn.disabled = false;
        payBtn.textContent = 'Submit for 50 QF';
      }

      close.addEventListener('click', cancel);
      cancelBtn.addEventListener('click', cancel);
      backdrop.addEventListener('click', function (e) { if (e.target === backdrop) cancel(); });
      modal.addEventListener('click', function (e) { e.stopPropagation(); });

      payBtn.addEventListener('click', async function () {
        err.style.display = 'none';

        var jwt;
        try { jwt = localStorage.getItem('qf_auth_token'); } catch (e) { jwt = null; }
        if (!jwt) { showError('Wallet session expired — reconnect and try again.'); return; }

        // Step 1: user pays 50 QF to escrow via their own wallet
        payBtn.disabled = true;
        payBtn.textContent = 'Waiting for wallet…';

        var txHash;
        try {
          var cfgRes = await fetch(API + '/achievement/mint-config', {
            headers: { 'Authorization': 'Bearer ' + jwt }
          });
          var cfg = await cfgRes.json();
          if (!cfg || !cfg.escrowAddress) { showError('Could not load payment config — try again.'); return; }

          var signer = (window.qfWallet && window.qfWallet.signer) || null;
          if (!signer || !signer.sendTransaction) { showError('Wallet not connected — reconnect and try again.'); return; }
          if (typeof ethers === 'undefined' || !ethers.parseEther) { showError('Wallet library not loaded — reload and try again.'); return; }

          var tx = await signer.sendTransaction({ to: cfg.escrowAddress, value: ethers.parseEther('50') });
          // Spec: do NOT wait for block confirmation client-side
          txHash = tx && tx.hash;
          if (!txHash) { showError('No transaction hash returned — try again.'); return; }
        } catch (e) {
          var code = e && (e.code || (e.info && e.info.error && e.info.error.code));
          var isReject = code === 'ACTION_REJECTED' || code === 4001 ||
            (e && e.message && /user (rejected|denied)/i.test(e.message));
          if (isReject) {
            // Return to idle; dedup NOT set so user can retry
            showError('Transaction rejected');
            return;
          }
          showError('Wallet error — try again.');
          return;
        }

        // Step 2: tx submitted — commit dedup, POST to server
        try { sessionStorage.setItem('qf_lb_prompted_' + sessionId, '1'); } catch (e) {}
        payBtn.textContent = 'Processing…';

        var allPeriods = qualifying.map(function(q) { return q.period; });
        try {
          var res = await fetch(API + '/global-leaderboard/enter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
            body: JSON.stringify({
              gameId: gameId,
              score: score,
              timeMs: timeMs || 0,
              periodTypes: allPeriods,
              sessionId: sessionId,
              txHash: txHash
            })
          });
          var data;
          try { data = await res.json(); } catch (e) { data = {}; }
          if (!res.ok || !data.success) {
            showError(data.error || ('Submit failed (' + res.status + ')'));
            return;
          }
          var enteredNames = (data.entered || []).map(function(e) { return e.periodType.charAt(0).toUpperCase() + e.periodType.slice(1); });
          var confirmMsg = enteredNames.length === 1
            ? 'You\u2019re on the ' + enteredNames[0] + ' leaderboard.'
            : 'Submitted \u2014 you\u2019re on the ' + enteredNames.join(', ') + ' leaderboards.';
          modal.innerHTML = '<div class="qflb-ok"><div class="qflb-ok-title">Submitted</div><div class="qflb-ok-sub">' + confirmMsg + '</div></div>';
          setTimeout(function () { remove(); resolve({ outcome: 'pay', entered: data.entered }); }, 3000);
        } catch (e) {
          showError('Network error — try again.');
        }
      });
    });
  }

  async function promptLeaderboardSubmit(opts) {
    try {
      opts = opts || {};
      var gameId = opts.gameId;
      var score = opts.score;
      var timeMs = opts.timeMs;
      var sessionId = opts.sessionId;

      if (!gameId || score === undefined || score === null) return;
      if (!sessionId) return;

      try {
        if (sessionStorage.getItem('qf_lb_prompted_' + sessionId)) return;
      } catch (e) {}

      var jwt;
      try { jwt = localStorage.getItem('qf_auth_token'); } catch (e) { jwt = null; }
      if (!jwt) return;

      var results = await fetchEligibility(gameId, score, timeMs, jwt);
      var qualifying = [];
      results.forEach(function (r) {
        if (r.data && r.data.shouldPrompt === true && r.data.alreadyEntered === false) {
          qualifying.push({ period: r.period, rank: r.data.rank });
        }
      });
      if (qualifying.length === 0) return;
      qualifying.sort(function (a, b) { return a.rank - b.rank; });

      await renderModal({ gameId: gameId, score: score, timeMs: timeMs, sessionId: sessionId, qualifying: qualifying });
    } catch (e) {
      // never throw — fire-and-forget contract
    }
  }

  window.promptLeaderboardSubmit = promptLeaderboardSubmit;
})();
