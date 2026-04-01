/**
 * MathsWins dApp — Paid game entry flow.
 * Include on paid game pages after dapp-wallet.js.
 *
 * Shows entry screen with pot, leaderboard, tier selection.
 * Handles on-chain payment and session token retrieval.
 *
 * Usage: call dappEntry.init(gameId) on page load.
 * The game's own start logic should call dappEntry.getSessionToken()
 * to get the JWT before starting.
 */
(function() {
  'use strict';

  var API_BASE = 'https://dapp-api.mathswins.co.uk/api/dapp';
  // Dev fallback
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    API_BASE = 'http://127.0.0.1:3860/api/dapp';
  }

  var GAME_ENTRY_ABI = [
    'function enter(uint256 gameId, uint256 weekId) payable',
    'function singleFee() view returns (uint256)',
    'function tripleFee() view returns (uint256)',
    'function getEntry(address player, uint256 gameId, uint256 weekId) view returns (uint8)'
  ];

  var GAME_ENTRY_ADDRESS = '0x6e1d573A8e40BaCb2ccC0A913a2989e35bE1151d';
  var gameId = '';
  var gameIdUint = 0n;
  var weekId = 0;
  var sessionToken = null;
  var entryTier = 0;

  function gameIdToUint(id) {
    var hash = ethers.keccak256(ethers.toUtf8Bytes(id));
    return BigInt(hash) % (2n ** 128n);
  }

  async function fetchJson(url, opts) {
    var headers = opts && opts.headers ? opts.headers : {};
    if (dappWallet.address) headers['X-Wallet-Address'] = dappWallet.address;
    var res = await fetch(url, Object.assign({}, opts, { headers: headers }));
    return res.json();
  }

  // ── Entry overlay ─────────────────────────────────────────────────────────

  function showEntryScreen() {
    // Create overlay
    var overlay = document.createElement('div');
    overlay.id = 'dappEntryOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:200;background:rgba(5,7,9,.95);display:flex;align-items:center;justify-content:center;padding:1rem;';

    overlay.innerHTML = '<div style="max-width:420px;width:100%;background:var(--surface,#0a0d14);border:1px solid var(--border,#161c28);border-radius:12px;padding:1.5rem;text-align:center">'
      + '<h2 style="font-family:Bebas Neue,sans-serif;font-size:1.8rem;color:var(--text-bright,#e8ecf4);letter-spacing:.03em;margin-bottom:.5rem" id="entryGameName"></h2>'
      + '<div id="entryPotInfo" style="margin:.75rem 0"></div>'
      + '<div id="entryLeaderboard" style="margin:.75rem 0"></div>'
      + '<div id="entryStatus" style="margin:.75rem 0;font-size:.85rem;color:var(--muted,#4a5568)"></div>'
      + '<div id="entryTierSelect" style="display:flex;gap:.5rem;justify-content:center;margin:1rem 0"></div>'
      + '<div id="entryActions" style="display:flex;gap:.5rem;justify-content:center;margin-top:1rem;flex-wrap:wrap"></div>'
      + '</div>';

    document.body.appendChild(overlay);
  }

  async function populateEntryScreen() {
    var nameEl = document.getElementById('entryGameName');
    var potEl = document.getElementById('entryPotInfo');
    var lbEl = document.getElementById('entryLeaderboard');
    var statusEl = document.getElementById('entryStatus');
    var tierEl = document.getElementById('entryTierSelect');
    var actionsEl = document.getElementById('entryActions');

    nameEl.textContent = gameId.replace(/-/g, ' ').toUpperCase();

    // Fetch week info
    var weekData = await fetchJson(API_BASE + '/week');
    weekId = weekData.weekId;

    // Fetch leaderboard
    var lb = await fetchJson(API_BASE + '/leaderboard/' + gameId);
    if (lb.leaderboard && lb.leaderboard.length > 0) {
      var rows = lb.leaderboard.map(function(r, i) {
        return '<div style="display:flex;justify-content:space-between;padding:.2rem 0;font-family:DM Mono,monospace;font-size:.7rem">'
          + '<span style="color:var(--gold,#d4a847)">#' + (i+1) + '</span>'
          + '<span style="color:var(--muted,#4a5568)">' + r.wallet.slice(0,6) + '...' + r.wallet.slice(-4) + '</span>'
          + '<span style="color:var(--text-bright,#e8ecf4)">' + r.score + '</span>'
          + '</div>';
      }).join('');
      lbEl.innerHTML = '<div style="font-size:.6rem;color:var(--muted,#4a5568);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.3rem">Leaderboard</div>' + rows;
    } else {
      lbEl.innerHTML = '<div style="font-size:.75rem;color:var(--muted,#4a5568)">No entries this week yet. Be the first!</div>';
    }

    // Check if already entered
    if (dappWallet.isConnected()) {
      var entry = await fetchJson(API_BASE + '/entry/' + gameId + '?weekId=' + weekId);
      if (entry.entered) {
        entryTier = entry.tier;
        statusEl.innerHTML = '<span style="color:var(--green,#2dd4a0)">You\'re entered this week (Tier ' + entry.tier + ')</span>';
        tierEl.style.display = 'none';
        actionsEl.innerHTML = '<button class="btn btn-gold" onclick="dappEntry.startPlaying()">Play Now</button>'
          + '<button class="btn btn-outline" onclick="dappEntry.close()">Back to Lobby</button>';
        return;
      }
    }

    // Show tier selection
    tierEl.innerHTML = '<button class="btn btn-gold" id="tierSingle" onclick="dappEntry.selectTier(1)" style="flex:1;max-width:180px">'
      + '<div style="font-size:1.1rem;font-weight:700">10 QF</div><div style="font-size:.65rem;opacity:.7">1 Attempt</div></button>'
      + '<button class="btn btn-gold" id="tierTriple" onclick="dappEntry.selectTier(3)" style="flex:1;max-width:180px;opacity:.8">'
      + '<div style="font-size:1.1rem;font-weight:700">25 QF</div><div style="font-size:.65rem;opacity:.7">3 Attempts</div></button>';

    if (!dappWallet.isConnected()) {
      actionsEl.innerHTML = '<button class="btn btn-gold" onclick="dappWallet.connect().then(function(){dappEntry.refresh()})">Connect Wallet to Enter</button>';
    } else {
      actionsEl.innerHTML = '<button class="btn btn-gold" id="payBtn" onclick="dappEntry.pay()" disabled>Select a tier</button>'
        + '<button class="btn btn-outline" onclick="dappEntry.close()">Back</button>';
    }
  }

  var selectedTier = 0;

  function selectTier(tier) {
    selectedTier = tier;
    document.getElementById('tierSingle').style.opacity = tier === 1 ? '1' : '.5';
    document.getElementById('tierTriple').style.opacity = tier === 3 ? '1' : '.5';
    document.getElementById('tierSingle').style.border = tier === 1 ? '2px solid var(--gold,#d4a847)' : 'none';
    document.getElementById('tierTriple').style.border = tier === 3 ? '2px solid var(--gold,#d4a847)' : 'none';
    var payBtn = document.getElementById('payBtn');
    if (payBtn) { payBtn.disabled = false; payBtn.textContent = 'Pay ' + (tier === 1 ? '10' : '25') + ' QF & Enter'; }
  }

  async function pay() {
    if (!dappWallet.isConnected()) { alert('Connect wallet first'); return; }
    if (!selectedTier) { alert('Select a tier'); return; }
    if (!GAME_ENTRY_ADDRESS) { alert('Contract not yet deployed'); return; }

    var statusEl = document.getElementById('entryStatus');
    statusEl.innerHTML = '<span style="color:var(--gold,#d4a847)">Awaiting MetaMask confirmation...</span>';

    try {
      var contract = new ethers.Contract(GAME_ENTRY_ADDRESS, GAME_ENTRY_ABI, dappWallet.signer);
      var fee = selectedTier === 1
        ? await contract.singleFee()
        : await contract.tripleFee();

      var tx = await contract.enter(gameIdUint, weekId, { value: fee });
      statusEl.innerHTML = '<span style="color:var(--gold,#d4a847)">Transaction submitted, confirming...</span>';

      await tx.wait();
      statusEl.innerHTML = '<span style="color:var(--green,#2dd4a0)">Entry confirmed! Loading game...</span>';

      entryTier = selectedTier;

      // Wait briefly for chain listener to pick it up
      await new Promise(function(r) { setTimeout(r, 2000); });

      startPlaying();
    } catch (e) {
      console.error('Payment failed:', e);
      statusEl.innerHTML = '<span style="color:var(--red,#ef5350)">Payment failed: ' + (e.reason || e.message || 'Unknown error') + '</span>';
    }
  }

  async function startPlaying() {
    // Get session token from backend
    try {
      var data = await fetchJson(API_BASE + '/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: gameId })
      });

      if (data.error) throw new Error(data.error);

      sessionToken = data.token;
      close();

      // Dispatch custom event for the game to pick up
      window.dispatchEvent(new CustomEvent('dapp-session-ready', { detail: data }));
    } catch (e) {
      var statusEl = document.getElementById('entryStatus');
      if (statusEl) statusEl.innerHTML = '<span style="color:var(--red,#ef5350)">' + e.message + '</span>';
    }
  }

  function close() {
    var overlay = document.getElementById('dappEntryOverlay');
    if (overlay) overlay.remove();
  }

  function refresh() {
    close();
    showEntryScreen();
    populateEntryScreen();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  window.dappEntry = {
    init: function(gid, contractAddr) {
      gameId = gid;
      gameIdUint = gameIdToUint(gid);
      if (contractAddr) GAME_ENTRY_ADDRESS = contractAddr;
      showEntryScreen();
      populateEntryScreen();
    },
    getSessionToken: function() { return sessionToken; },
    getTier: function() { return entryTier; },
    selectTier: selectTier,
    pay: pay,
    startPlaying: startPlaying,
    close: close,
    refresh: refresh,

    // Submit answer to server during gameplay
    evaluate: async function(answer) {
      if (!sessionToken) throw new Error('No active session');
      var data = await fetchJson(API_BASE + '/session/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken: sessionToken, answer: answer })
      });
      if (data.error) throw new Error(data.error);
      return data;
    }
  };
})();
