/**
 * QF Games — Shared wallet connection module.
 * Supports MetaMask and Talisman (EVM mode).
 * Include after ethers.js CDN on any qf-dapp page.
 *
 * Usage:
 *   qfWallet.connect()          — opens wallet chooser or connects directly
 *   qfWallet.disconnect()       — disconnects, resets UI
 *   qfWallet.address             — connected EVM address (H160)
 *   qfWallet.qfName              — resolved .qf name or null
 *   qfWallet.displayName()       — .qf name or truncated address
 *   qfWallet.isConnected()       — boolean
 *   qfWallet.resolveAny(addr)    — resolve any address to .qf name (async)
 *   qfWallet.formatAddr(addr)    — .qf name from cache or truncated address (sync)
 *   qfWallet.onConnect(callback) — register callback for connection events
 *   qfWallet.onDisconnect(cb)    — register callback for disconnect events
 *   qfWallet.showMenu(el)        — show wallet dropdown menu anchored to element
 */
(function() {
  'use strict';

  var QF_CHAIN_ID = 3426;
  var QF_CHAIN_HEX = '0xd62';
  var QF_RPC = 'https://archive.mainnet.qfnode.net/eth';
  var QNS_RESOLVER_OLD = '0xd5d12431b2956248861dbec5e8a9bc6023114e80';
  var QNS_RESOLVER_NEW = '0x276b7e9343c19bea29d32dd4a8f84e6d1c183111';
  var QNS_ABI = ['function reverseResolve(address _addr) view returns (string)'];

  var state = {
    address: null, balance: null, chainId: null,
    provider: null, signer: null, qfName: null, walletType: null,
    rawProvider: null,  // the injected provider (window.ethereum etc)
    verified: false     // true only after wallet proves it can sign (not just cached)
  };

  var nameCache = {};
  var connectCallbacks = [];
  var disconnectCallbacks = [];
  var rpcProvider = null;

  // EIP-6963: collect wallet providers as they announce themselves
  var _eip6963Providers = [];
  window.addEventListener('eip6963:announceProvider', function(event) {
    if (event.detail && event.detail.provider) {
      _eip6963Providers.push(event.detail);
    }
  });
  window.dispatchEvent(new Event('eip6963:requestProvider'));

  // ── QNS Resolution ────────────────────────────────────────────────
  function getRpcProvider() {
    if (!rpcProvider) rpcProvider = new ethers.JsonRpcProvider(QF_RPC);
    return rpcProvider;
  }

  async function resolveQfName(addr) {
    if (!addr) return null;
    var key = addr.toLowerCase();
    if (nameCache[key] !== undefined) return nameCache[key];
    var prov = getRpcProvider();
    var resolvers = [QNS_RESOLVER_NEW, QNS_RESOLVER_OLD];
    for (var i = 0; i < resolvers.length; i++) {
      try {
        var contract = new ethers.Contract(resolvers[i], QNS_ABI, prov);
        var name = await contract.reverseResolve(addr);
        if (name && name.length > 0) {
          nameCache[key] = name;
          return name;
        }
      } catch (e) { /* try next */ }
    }
    nameCache[key] = null;
    return null;
  }

  function formatAddr(addr) {
    if (!addr) return '???';
    var key = addr.toLowerCase();
    if (nameCache[key]) return nameCache[key];
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  }

  // ── Detect available wallets ──────────────────────────────────────
  function detectWallets() {
    var wallets = [];
    var seen = {};
    function add(id, name, icon, provider) {
      if (seen[id] || !provider) return;
      seen[id] = true;
      wallets.push({ id: id, name: name, icon: icon, provider: provider });
    }
    // EIP-6963: each wallet announces independently — no hijacking
    _eip6963Providers.forEach(function(detail) {
      var rdns = (detail.info && detail.info.rdns) || '';
      if (rdns.indexOf('talisman') !== -1) add('talisman', 'Talisman', '\uD83D\uDD2E', detail.provider);
      else if (rdns.indexOf('metamask') !== -1) add('metamask', 'MetaMask', '\uD83E\uDD8A', detail.provider);
      else if (rdns.indexOf('subwallet') !== -1) add('subwallet', 'SubWallet', '\uD83D\uDFE2', detail.provider);
    });
    // Legacy fallback: providers array
    if (window.ethereum && window.ethereum.providers && window.ethereum.providers.length > 0) {
      window.ethereum.providers.forEach(function(p) {
        if (p.isTalisman) add('talisman', 'Talisman', '\uD83D\uDD2E', p);
        if (p.isMetaMask) add('metamask', 'MetaMask', '\uD83E\uDD8A', p);
        if (p.isSubWallet) add('subwallet', 'SubWallet', '\uD83D\uDFE2', p);
      });
    }
    // Legacy fallback: separate globals
    if (window.talismanEth) add('talisman', 'Talisman', '\uD83D\uDD2E', window.talismanEth);
    if (window.SubWallet) add('subwallet', 'SubWallet', '\uD83D\uDFE2', window.SubWallet);
    // Last resort: window.ethereum directly
    if (window.ethereum && !seen.talisman && !seen.metamask) {
      if (window.ethereum.isTalisman) add('talisman', 'Talisman', '\uD83D\uDD2E', window.ethereum);
      else if (window.ethereum.isMetaMask) add('metamask', 'MetaMask', '\uD83E\uDD8A', window.ethereum);
      else add('browser', 'Browser Wallet', '\uD83D\uDD17', window.ethereum);
    }
    return wallets;
  }

  // ── Wallet Chooser Modal ──────────────────────────────────────────
  function createModal() {
    if (document.getElementById('qf-wallet-modal')) return;
    var overlay = document.createElement('div');
    overlay.id = 'qf-wallet-modal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(14,16,19,0.94);backdrop-filter:blur(8px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;';
    var box = document.createElement('div');
    box.style.cssText = 'background:#16181c;border:1px solid #2a2e36;border-radius:12px;width:100%;max-width:360px;padding:1.8rem;';
    var title = document.createElement('h3');
    title.style.cssText = "font-family:'Playfair Display',serif;font-size:1.3rem;color:#e8eaf0;text-align:center;margin-bottom:.3rem;";
    title.textContent = 'Connect Wallet';
    var sub = document.createElement('p');
    sub.style.cssText = "font-family:'Inter',sans-serif;font-size:.68rem;color:#4a4e5a;text-align:center;margin-bottom:1.2rem;line-height:1.4;";
    sub.textContent = 'Choose your wallet to connect to QF Network.';
    var list = document.createElement('div');
    list.id = 'qf-wallet-list';
    list.style.cssText = 'display:flex;flex-direction:column;gap:.5rem;';
    var cancel = document.createElement('button');
    cancel.style.cssText = "margin-top:1rem;width:100%;padding:.55rem;font-family:'JetBrains Mono',monospace;font-size:.6rem;background:transparent;border:1px solid #2a2e36;color:#4a4e5a;border-radius:6px;cursor:pointer;letter-spacing:.05em;";
    cancel.textContent = 'CANCEL';
    cancel.onclick = function() { closeModal(); };
    box.appendChild(title); box.appendChild(sub); box.appendChild(list); box.appendChild(cancel);
    overlay.appendChild(box);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });
    document.body.appendChild(overlay);
  }

  function closeModal() {
    var m = document.getElementById('qf-wallet-modal');
    if (m) m.remove();
  }

  function walletButton(wallet) {
    var btn = document.createElement('button');
    btn.style.cssText = "width:100%;padding:.8rem 1rem;display:flex;align-items:center;gap:.8rem;background:#1e2025;border:1px solid #2a2e36;border-radius:8px;cursor:pointer;transition:all .15s;";
    btn.onmouseover = function() { btn.style.borderColor = 'rgba(184,188,198,0.15)'; btn.style.background = '#26282e'; };
    btn.onmouseout = function() { btn.style.borderColor = '#2a2e36'; btn.style.background = '#1e2025'; };
    var icon = document.createElement('span');
    icon.style.cssText = 'font-size:1.4rem;';
    icon.textContent = wallet.icon;
    var info = document.createElement('div');
    info.style.cssText = 'text-align:left;flex:1;';
    var name = document.createElement('div');
    name.style.cssText = "font-family:'Inter',sans-serif;font-size:.82rem;font-weight:600;color:#e8eaf0;";
    name.textContent = wallet.name;
    var desc = document.createElement('div');
    desc.style.cssText = "font-family:'JetBrains Mono',monospace;font-size:.52rem;color:#4a4e5a;margin-top:.1rem;";
    desc.textContent = 'EVM wallet';
    info.appendChild(name); info.appendChild(desc);
    btn.appendChild(icon); btn.appendChild(info);
    btn.onclick = function() { closeModal(); connectWithProvider(wallet.provider, wallet.id); };
    return btn;
  }

  function showNoWalletMessage(list) {
    var msg = document.createElement('div');
    msg.style.cssText = "text-align:center;padding:1rem;font-family:'Inter',sans-serif;font-size:.72rem;color:#8a8f9c;line-height:1.6;";
    msg.innerHTML = 'No wallet detected.<br><br>'
      + '<a href="https://metamask.io" target="_blank" style="color:#b8bcc6;text-decoration:none;">MetaMask</a>'
      + ' · '
      + '<a href="https://talisman.xyz" target="_blank" style="color:#b8bcc6;text-decoration:none;">Talisman</a>'
      + ' · '
      + '<a href="https://www.subwallet.app" target="_blank" style="color:#b8bcc6;text-decoration:none;">SubWallet</a>';
    list.appendChild(msg);
  }

  // ── Verification Gate ──────────────────────────────────────────────
  // Silent reconnect populates address/balance for display but the wallet
  // may be locked.  ensureVerified() forces a real wallet interaction before
  // any transaction or signature can proceed.
  async function ensureVerified() {
    if (state.verified) return;
    if (!state.rawProvider) throw new Error('No wallet connected');
    await state.rawProvider.request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }]
    });
    state.verified = true;
  }

  // Wrap a signer so sendTransaction / signMessage hit the verification
  // gate automatically — game code never needs to call ensureVerified itself.
  function wrapSigner(signer) {
    var realSend = signer.sendTransaction.bind(signer);
    var realSign = signer.signMessage.bind(signer);

    signer.sendTransaction = async function(tx) {
      await ensureVerified();
      return realSend(tx);
    };
    signer.signMessage = async function(msg) {
      await ensureVerified();
      return realSign(msg);
    };
    return signer;
  }

  // ── Connect ───────────────────────────────────────────────────────
  async function connect() {
    var wallets = detectWallets();
    if (wallets.length === 0) {
      createModal();
      showNoWalletMessage(document.getElementById('qf-wallet-list'));
      return;
    }
    createModal();
    var list = document.getElementById('qf-wallet-list');
    list.innerHTML = '';
    wallets.forEach(function(w) { list.appendChild(walletButton(w)); });
  }

  async function connectWithProvider(ethProvider, walletId, silent) {
    try {
      var address;
      if (silent) {
        // Silent reconnect — just check if already authorised
        var accounts = await ethProvider.request({ method: 'eth_accounts' });
        if (!accounts || accounts.length === 0) return;
        address = accounts[0];
      } else {
        // Manual connect — revoke and request fresh permissions
        try {
          await ethProvider.request({ method: 'wallet_revokePermissions', params: [{ eth_accounts: {} }] });
        } catch (e) { /* Not supported on this wallet — continue */ }

        try {
          var permissions = await ethProvider.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] });
          var ethAccountsPerm = permissions.find(function(p) { return p.parentCapability === 'eth_accounts'; });
          if (ethAccountsPerm && ethAccountsPerm.caveats) {
            var caveat = ethAccountsPerm.caveats.find(function(c) { return c.type === 'restrictReturnedAccounts'; });
            if (caveat && caveat.value && caveat.value.length > 0) {
              address = caveat.value[0];
            }
          }
          if (!address) {
            var accounts = await ethProvider.request({ method: 'eth_requestAccounts' });
            address = accounts[0];
          }
        } catch (e) {
          var accounts = await ethProvider.request({ method: 'eth_requestAccounts' });
          address = accounts[0];
        }
      }

      var provider = new ethers.BrowserProvider(ethProvider);
      var signer = await provider.getSigner(address);
      var network = await provider.getNetwork();
      var chainId = Number(network.chainId);

      // Auto-add QF Network if wrong chain
      if (chainId !== QF_CHAIN_ID) {
        try {
          await ethProvider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: QF_CHAIN_HEX }] });
        } catch (switchErr) {
          await ethProvider.request({
            method: 'wallet_addEthereumChain',
            params: [{ chainId: QF_CHAIN_HEX, chainName: 'QF Network Mainnet',
              nativeCurrency: { name: 'QF', symbol: 'QF', decimals: 18 },
              rpcUrls: [QF_RPC], blockExplorerUrls: [] }]
          });
        }
        network = await provider.getNetwork();
        chainId = Number(network.chainId);
      }

      // Liveness check — verify wallet is actually responsive, not returning cached data
      try {
        await ethProvider.request({ method: 'eth_chainId' });
      } catch (e) {
        throw new Error('Wallet is locked or unresponsive');
      }

      var balance = await provider.getBalance(address);

      state.address = address;
      state.balance = balance;
      state.chainId = chainId;
      state.provider = provider;
      state.signer = wrapSigner(signer);
      state.walletType = walletId;
      state.rawProvider = ethProvider;
      state.qfName = null;
      state.verified = !silent;

      try { localStorage.setItem('qf_wallet_id', walletId); } catch (e) {}

      fireCallbacks();

      // Resolve .qf name in background, fire callbacks again when resolved
      resolveQfName(address).then(function(name) {
        state.qfName = name;
        fireCallbacks();
      });

      // Listen for account/chain changes — update in place, no reload
      ethProvider.removeAllListeners && ethProvider.removeAllListeners('accountsChanged');
      ethProvider.removeAllListeners && ethProvider.removeAllListeners('chainChanged');
      ethProvider.on('accountsChanged', function(accounts) {
        if (!accounts || accounts.length === 0) {
          // User disconnected from within the wallet
          disconnect();
        } else {
          // User switched account in the wallet — reconnect silently
          connectWithProvider(ethProvider, walletId);
        }
      });
      ethProvider.on('chainChanged', function() {
        // Re-read balance and chain after switch
        connectWithProvider(ethProvider, walletId);
      });

    } catch (e) {
      console.error('Wallet connect failed:', e);
      var errorDiv = document.createElement('div');
      errorDiv.id = 'qf-wallet-error';
      errorDiv.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);background:#1e2025;border:1px solid #b03a3a;border-radius:8px;padding:.8rem 1.2rem;z-index:9999;font-family:"Inter",sans-serif;font-size:.75rem;color:#e8eaf0;max-width:320px;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.5);';
      errorDiv.textContent = 'Connection failed. Please unlock your wallet and try again.';
      document.body.appendChild(errorDiv);
      setTimeout(function() { var el = document.getElementById('qf-wallet-error'); if (el) el.remove(); }, 4000);
    }
  }

  // ── Callbacks ─────────────────────────────────────────────────────
  function fireCallbacks() {
    connectCallbacks.forEach(function(cb) {
      try { cb(state); } catch (e) { console.error('Wallet callback error:', e); }
    });
  }

  function fireDisconnectCallbacks() {
    disconnectCallbacks.forEach(function(cb) {
      try { cb(); } catch (e) { console.error('Disconnect callback error:', e); }
    });
  }

  function onConnect(cb) {
    connectCallbacks.push(cb);
    if (state.address) {
      try { cb(state); } catch (e) { console.error('Wallet callback error:', e); }
    }
  }

  function onDisconnect(cb) {
    disconnectCallbacks.push(cb);
  }

  // ── Disconnect ────────────────────────────────────────────────────
  function disconnect() {
    // Remove listeners
    if (state.rawProvider && state.rawProvider.removeAllListeners) {
      state.rawProvider.removeAllListeners('accountsChanged');
      state.rawProvider.removeAllListeners('chainChanged');
    }
    // Clear dApp state only — revoke happens at the start of the next connect
    state.address = null;
    state.balance = null;
    state.chainId = null;
    state.provider = null;
    state.signer = null;
    state.qfName = null;
    state.walletType = null;
    state.rawProvider = null;
    state.verified = false;
    try { localStorage.removeItem('qf_wallet_id'); } catch (e) {}
    fireDisconnectCallbacks();
  }

  // ── Wallet Menu ───────────────────────────────────────────────────
  function showWalletMenu(anchorEl) {
    var existing = document.getElementById('qf-wallet-menu');
    if (existing) { existing.remove(); return; }

    var rect = anchorEl.getBoundingClientRect();
    var menu = document.createElement('div');
    menu.id = 'qf-wallet-menu';
    menu.style.cssText = 'position:fixed;top:' + (rect.bottom + 4) + 'px;right:' + (window.innerWidth - rect.right) + 'px;'
      + 'background:#1e2025;border:1px solid #2a2e36;border-radius:8px;padding:.3rem 0;z-index:9999;'
      + 'box-shadow:0 8px 24px rgba(0,0,0,.5);min-width:160px;';

    var addrItem = document.createElement('div');
    addrItem.style.cssText = "padding:.5rem .8rem;font-family:'JetBrains Mono',monospace;font-size:.58rem;color:#4a4e5a;border-bottom:1px solid #2a2e36;word-break:break-all;";
    addrItem.textContent = state.address;
    menu.appendChild(addrItem);

    if (state.qfName) {
      var nameItem = document.createElement('div');
      nameItem.style.cssText = "padding:.4rem .8rem;font-family:'JetBrains Mono',monospace;font-size:.65rem;color:#d4d8e2;border-bottom:1px solid #2a2e36;";
      nameItem.textContent = state.qfName;
      menu.appendChild(nameItem);
    }

    var disconnectBtn = document.createElement('div');
    disconnectBtn.style.cssText = "padding:.5rem .8rem;font-family:'Inter',sans-serif;font-size:.7rem;color:#b03a3a;cursor:pointer;transition:background .1s;";
    disconnectBtn.textContent = 'Disconnect';
    disconnectBtn.onmouseover = function() { disconnectBtn.style.background = '#26282e'; };
    disconnectBtn.onmouseout = function() { disconnectBtn.style.background = 'none'; };
    disconnectBtn.onclick = function() { menu.remove(); disconnect(); };
    menu.appendChild(disconnectBtn);

    document.body.appendChild(menu);
    setTimeout(function() {
      document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target) && e.target !== anchorEl) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 10);
  }

  // Auto-reconnect if previously connected
  (function autoReconnect() {
    var savedId;
    try { savedId = localStorage.getItem('qf_wallet_id'); } catch (e) {}
    if (!savedId) return;
    // Wait briefly for wallet extensions to inject their providers
    setTimeout(function() {
      var wallets = detectWallets();
      var match = wallets.find(function(w) { return w.id === savedId; });
      if (match) connectWithProvider(match.provider, match.id, true);
    }, 500);
  })();

  // ── Public API ────────────────────────────────────────────────────
  window.qfWallet = {
    get address()    { return state.address; },
    get balance()    { return state.balance; },
    get signer()     { return state.signer; },
    get provider()   { return state.provider; },
    get chainId()    { return state.chainId; },
    get qfName()     { return state.qfName; },
    get walletType() { return state.walletType; },
    get verified()   { return state.verified; },
    isConnected: function() { return !!state.address; },
    ensureVerified: ensureVerified,
    connect: connect,
    disconnect: disconnect,
    displayName: function() {
      if (state.qfName) return state.qfName;
      if (state.address) return state.address.slice(0, 6) + '...' + state.address.slice(-4);
      return null;
    },
    resolveAny: resolveQfName,
    formatAddr: formatAddr,
    onConnect: onConnect,
    onDisconnect: onDisconnect,
    showMenu: showWalletMenu,
    nameCache: nameCache
  };

  // Legacy alias — older game pages reference dappWallet
  window.dappWallet = window.qfWallet;
})();
