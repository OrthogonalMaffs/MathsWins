/* qf-nav.js — shared nav bar for all QF dApp pages
   Usage: <div id="qf-nav"></div><script src="/qf-dapp/qf-nav.js"></script>
   Must load AFTER ethers.js and qf-wallet.js */
(function() {
  'use strict';

  // ── Inject nav CSS ──────────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent = [
    '.qfn{position:sticky;top:0;z-index:100;background:rgba(14,16,19,.94);backdrop-filter:blur(12px);border-bottom:1px solid var(--border,#1e2228);padding:.5rem 1rem;display:flex;align-items:center;justify-content:space-between;width:100%}',
    '.qfn-left{display:flex;align-items:center;gap:.6rem}',
    '.qfn-back{font-size:.7rem;color:var(--muted,#4a4e5a);text-decoration:none;padding:.25rem .6rem;border:1px solid var(--border,#1e2228);border-radius:6px;transition:all .15s}',
    '.qfn-back:hover{border-color:var(--silver-border,rgba(184,188,198,0.15));color:var(--text,#8a8f9c)}',
    '.qfn-logo{font-family:"Playfair Display",serif;font-size:1.1rem;color:var(--text-white,#e8eaf0);text-decoration:none;letter-spacing:.02em}',
    '.qfn-logo span{color:var(--silver-bright,#d4d8e2)}',
    '.qfn-badge{font-family:"JetBrains Mono",monospace;font-size:.5rem;padding:2px 8px;border-radius:10px;background:var(--silver-dim,rgba(184,188,198,0.08));color:var(--silver,#b8bcc6);border:1px solid var(--silver-border,rgba(184,188,198,0.15));letter-spacing:.05em}',
    '.qfn-right{display:flex;align-items:center;gap:.5rem}',
    '.qfn-link{font-family:"JetBrains Mono",monospace;font-size:.6rem;color:var(--muted,#4a4e5a);text-decoration:none;padding:.25rem .6rem;border:1px solid var(--border,#1e2228);border-radius:6px;transition:all .15s}',
    '.qfn-link:hover{border-color:var(--silver-border,rgba(184,188,198,0.15));color:var(--text,#8a8f9c)}',
    '.qfn-network{font-family:"JetBrains Mono",monospace;font-size:.55rem;color:var(--silver,#b8bcc6);display:flex;align-items:center;gap:.3rem}',
    '.qfn-network .dot{width:6px;height:6px;border-radius:50%;background:var(--silver,#b8bcc6)}',
    '.qfn-network.wrong .dot{background:var(--red,#b03a3a)}',
    '.qfn-network.wrong{color:var(--red,#b03a3a)}',
    '.qfn-balance{font-family:"JetBrains Mono",monospace;font-size:.72rem;color:var(--silver-bright,#d4d8e2)}',
    '.qfn-name{font-family:"JetBrains Mono",monospace;font-size:.65rem;color:var(--silver-bright,#d4d8e2);background:var(--surface2,#1e2025);border:1px solid var(--silver-border,rgba(184,188,198,0.15));padding:.2rem .5rem;border-radius:5px}',
    '.qfn-addr{font-family:"JetBrains Mono",monospace;font-size:.65rem;color:var(--muted,#4a4e5a);background:var(--surface,#16181c);border:1px solid var(--border,#1e2228);padding:.2rem .5rem;border-radius:5px}',
    '.qfn-connect{font-family:"Inter",sans-serif;font-weight:600;font-size:.7rem;padding:.35rem .8rem;border-radius:6px;border:1px solid var(--silver-border,rgba(184,188,198,0.15));background:var(--silver-dim,rgba(184,188,198,0.08));color:var(--silver-bright,#d4d8e2);cursor:pointer;transition:all .15s}',
    '.qfn-connect:hover{background:var(--silver-bright,#d4d8e2);color:var(--bg,#0e1013)}',
    '@media(max-width:480px){',
      '.qfn{flex-wrap:wrap;padding:.4rem .6rem;gap:.3rem}',
      '.qfn-left{flex:1 1 auto;min-width:0}',
      '.qfn-right{flex:0 0 auto}',
      '.qfn-right.qfn-connected{order:1;flex:1 1 100%;display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--border,#1e2228);padding-top:.35rem;margin-top:.1rem}',
      '.qfn-name{max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.qfn-addr{max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.qfn-link{min-height:44px;display:inline-flex;align-items:center}',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  // ── Detect page context ─────────────────────────────────────────────
  var path = location.pathname;
  var isLobby = /\/qf-dapp\/?$/.test(path) || /\/qf-dapp\/index\.html$/.test(path);
  var isMyAccount = /\/qf-dapp\/my-account\//.test(path);

  // ── Build nav HTML ──────────────────────────────────────────────────
  var leftHTML = '';
  if (isLobby) {
    leftHTML =
      '<a href="/qf-dapp/" class="qfn-logo">QF <span>Games</span></a>' +
      '<span class="qfn-badge">QF NETWORK</span>';
  } else {
    leftHTML =
      '<a href="/qf-dapp/" class="qfn-back">&larr; Lobby</a>' +
      '<a href="/qf-dapp/" class="qfn-logo">QF <span>Games</span></a>';
  }

  var html =
    '<div class="qfn-left">' + leftHTML + '</div>' +
    '<div class="qfn-right">' +
      '<div class="qfn-network" id="qfnNetwork" style="display:none"><span class="dot"></span><span id="qfnNetworkName">QF Network</span></div>' +
      '<span class="qfn-balance" id="qfnBalance" style="display:none"></span>' +
      '<a href="/qf-dapp/my-account/" class="qfn-link" id="qfnAccount" style="display:none">My Account</a>' +
      '<span class="qfn-name" id="qfnName" style="display:none;cursor:pointer"></span>' +
      '<span class="qfn-addr" id="qfnAddr" style="display:none;cursor:pointer"></span>' +
      '<button class="qfn-connect" id="qfnConnect">Connect Wallet</button>' +
    '</div>';

  // ── Inject into placeholder ─────────────────────────────────────────
  var target = document.getElementById('qf-nav');
  if (target) {
    target.innerHTML = html;
    target.className = 'qfn';
  }

  // ── Wire up connect button ──────────────────────────────────────────
  var connectBtn = document.getElementById('qfnConnect');
  if (connectBtn) {
    connectBtn.addEventListener('click', function() {
      if (typeof qfWallet !== 'undefined') qfWallet.connect();
    });
  }

  // ── Wire up wallet menu on address/name click ───────────────────────
  var addrEl = document.getElementById('qfnAddr');
  var nameEl = document.getElementById('qfnName');
  if (addrEl) addrEl.addEventListener('click', function() { if (typeof qfWallet !== 'undefined') qfWallet.showMenu(this); });
  if (nameEl) nameEl.addEventListener('click', function() { if (typeof qfWallet !== 'undefined') qfWallet.showMenu(this); });

  // ── Listen for wallet connection ────────────────────────────────────
  if (typeof qfWallet !== 'undefined') {
    qfWallet.onConnect(function(w) {
      if (!w.address) return;

      // Hide connect, show address — add connected class for mobile layout
      var btn = document.getElementById('qfnConnect');
      if (btn) btn.style.display = 'none';
      var rightEl = btn && btn.parentElement;
      if (rightEl) rightEl.classList.add('qfn-connected');

      var addr = document.getElementById('qfnAddr');
      if (addr) {
        addr.style.display = '';
        addr.textContent = w.address.slice(0, 6) + '...' + w.address.slice(-4);
      }

      // Show My Account link
      var acct = document.getElementById('qfnAccount');
      if (acct) acct.style.display = '';

      // Balance (lobby gets full display)
      if (isLobby && w.balance) {
        var bal = document.getElementById('qfnBalance');
        if (bal) {
          bal.style.display = '';
          bal.textContent = parseFloat(ethers.formatEther(w.balance)).toFixed(2) + ' QF';
        }
      }

      // Network status (lobby only)
      if (isLobby) {
        var net = document.getElementById('qfnNetwork');
        if (net) {
          net.style.display = 'flex';
          var netName = document.getElementById('qfnNetworkName');
          if (w.chainId === 3426) {
            net.className = 'qfn-network';
            if (netName) netName.textContent = 'QF Network';
          } else {
            net.className = 'qfn-network wrong';
            if (netName) netName.textContent = 'Wrong Network';
          }
        }
      }

      // QNS name
      var name = document.getElementById('qfnName');
      if (w.qfName && name) {
        name.textContent = w.qfName;
        name.style.display = '';
        if (addr) addr.style.display = 'none';
      } else if (!w.qfName && name) {
        name.style.display = 'none';
      }
    });

    qfWallet.onDisconnect(function() {
      var btn = document.getElementById('qfnConnect');
      if (btn) btn.style.display = '';
      var rightEl = btn && btn.parentElement;
      if (rightEl) rightEl.classList.remove('qfn-connected');

      var addr = document.getElementById('qfnAddr');
      if (addr) addr.style.display = 'none';

      var name = document.getElementById('qfnName');
      if (name) name.style.display = 'none';

      var bal = document.getElementById('qfnBalance');
      if (bal) bal.style.display = 'none';

      var net = document.getElementById('qfnNetwork');
      if (net) net.style.display = 'none';

      var acct = document.getElementById('qfnAccount');
      if (acct) acct.style.display = 'none';
    });
  }
})();
