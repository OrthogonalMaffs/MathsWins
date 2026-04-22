/**
 * QF Games — Shared wallet connection module.
 *
 * Desktop (EIP-6963): MetaMask, Talisman, SubWallet — unchanged.
 * Mobile (no injected wallet): headless WalletConnect, deep-link to MetaMask.
 *
 * Public API:
 *   qfWallet.connect()              — EIP-6963 chooser, or WC deep-link if no injected
 *   qfWallet.disconnect()           — disconnects, clears canonical state
 *   qfWallet.address                 — connected EVM address (H160)
 *   qfWallet.qfName                  — resolved .qf name or null
 *   qfWallet.displayName()           — .qf name or truncated address
 *   qfWallet.isConnected()           — boolean
 *   qfWallet.resolveAny(addr)        — resolve any address to .qf name (async)
 *   qfWallet.formatAddr(addr)        — .qf name from cache or truncated address (sync)
 *   qfWallet.onConnect(callback)     — register callback for connection events
 *   qfWallet.onDisconnect(cb)        — register callback for disconnect events
 *   qfWallet.showMenu(el)            — show wallet dropdown menu anchored to element
 *   qfWallet.bootWalletNav()         — wire the shared nav (qf-nav.js calls this once)
 *   qfWallet.readStoredWalletState() — canonical localStorage state (read)
 *   qfWallet.setWalletState(patch)   — canonical localStorage state (merge+write)
 *   qfWallet.ensureValidJwt({interactive}) — tri-state JWT: valid | needs_signature | (signs if interactive)
 *   qfWallet.resumeAndReconcile()    — reconcile from live WC session + stored JWT
 */
(function() {
  'use strict';

  var QF_CHAIN_ID = 3426;
  var QF_CHAIN_HEX = '0xd62';
  var QF_RPC = 'https://archive.mainnet.qfnode.net/eth';
  var QNS_RESOLVER_OLD = '0xd5d12431b2956248861dbec5e8a9bc6023114e80';
  var QNS_RESOLVER_NEW = '0x276b7e9343c19bea29d32dd4a8f84e6d1c183111';
  var QNS_ABI = ['function reverseResolve(address _addr) view returns (string)'];

  // WalletConnect project ID (public, safe to ship in client bundle).
  var WC_PROJECT_ID = 'eeddb553d4f9d0d41252eb77bbaf124d';
  var WALLET_RETURN_PATH = '/qf-dapp/wallet-return/';
  var POST_RETURN_COOLDOWN_MS = 8000;

  var STATE_KEY = 'qf_wallet_state';
  var FLOW_KEY = 'qf_wallet_flow';
  var RETURN_PATH_KEY = 'qf_wallet_return_path';
  var RETURNED_AT_KEY = 'qf_wallet_returned_at';
  var LEGACY_JWT_KEY = 'qf_auth_token';
  var WC_CONNECT_REQUESTED_AT_KEY = 'wc_connect_requested_at';
  var WC_CONNECT_REQUEST_VALID_MS = 5 * 60 * 1000;

  var state = {
    address: null, balance: null, chainId: null,
    provider: null, signer: null, qfName: null, walletType: null,
    rawProvider: null,
    verified: false
  };

  var nameCache = {};
  var connectCallbacks = [];
  var disconnectCallbacks = [];
  var rpcProvider = null;
  var authToken = null;
  var wcProvider = null;       // singleton WC provider instance
  var wcInitPromise = null;    // dedupe concurrent init
  var wcSessionProcessed = false;  // idempotency flag for handleWcSessionEstablished

  // Belt-and-braces: hide any stray WalletConnect/Reown modal elements.
  // We never want the built-in modal to render — we have our own deep-link flow.
  (function installModalGuard() {
    try {
      var s = document.createElement('style');
      s.setAttribute('data-qf-wc-guard', '1');
      s.textContent = 'w3m-modal,wcm-modal,w3m-router,wcm-router,[class*="w3m-"][class*="modal"]{display:none!important;visibility:hidden!important;pointer-events:none!important}';
      (document.head || document.documentElement).appendChild(s);
    } catch (e) {}
  })();

  var API_BASE = 'https://dapp-api.mathswins.co.uk/api/dapp';
  if (typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    API_BASE = 'http://127.0.0.1:3860/api/dapp';
  }

  // ── Canonical wallet state (localStorage) ─────────────────────────
  // Single source of truth for nav rendering across pages/tabs.
  function defaultState() {
    return {
      status: 'disconnected',   // disconnected | connected
      walletType: null,         // metamask | talisman | subwallet | walletconnect | sub-<key>
      address: null,
      chainId: null,
      jwt: null,
      authStatus: 'none',       // none | needs_signature | authenticated
      updatedAt: 0
    };
  }

  function readStoredWalletState() {
    var base = defaultState();
    try {
      var raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        for (var k in parsed) if (Object.prototype.hasOwnProperty.call(parsed, k)) base[k] = parsed[k];
      }
    } catch (e) {}
    // Backward compat: seed jwt from legacy key if canonical is empty
    if (!base.jwt) {
      try {
        var legacy = localStorage.getItem(LEGACY_JWT_KEY);
        if (legacy && !isJwtExpired(legacy)) {
          base.jwt = legacy;
          if (base.status === 'connected') base.authStatus = 'authenticated';
        }
      } catch (e) {}
    }
    return base;
  }

  function setWalletState(patch) {
    var current = readStoredWalletState();
    for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) current[k] = patch[k];
    current.updatedAt = Date.now();
    try { localStorage.setItem(STATE_KEY, JSON.stringify(current)); } catch (e) {}
    // Keep legacy key in sync so freecell/minesweeper/my-account/qf-leaderboard-prompt.js keep working
    if (patch && Object.prototype.hasOwnProperty.call(patch, 'jwt')) {
      try {
        if (current.jwt) localStorage.setItem(LEGACY_JWT_KEY, current.jwt);
        else localStorage.removeItem(LEGACY_JWT_KEY);
      } catch (e) {}
    }
    try { window.dispatchEvent(new CustomEvent('qfwallet:state', { detail: current })); } catch (e) {}
    return current;
  }

  function isJwtExpired(token) {
    try {
      var parts = token.split('.');
      if (parts.length !== 3) return true;
      var payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) return false;
      return payload.exp * 1000 <= Date.now();
    } catch (e) { return true; }
  }

  // ── Auth token persistence ────────────────────────────────────────
  function saveAuthToken(token) {
    authToken = token;
    try { localStorage.setItem(LEGACY_JWT_KEY, token); } catch (e) {}
  }

  function clearAuthToken() {
    authToken = null;
    try { localStorage.removeItem(LEGACY_JWT_KEY); } catch (e) {}
  }

  function loadStoredToken(address) {
    try {
      var stored = localStorage.getItem(LEGACY_JWT_KEY);
      if (!stored) return null;
      var parts = stored.split('.');
      if (parts.length !== 3) return null;
      var payload = JSON.parse(atob(parts[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) { localStorage.removeItem(LEGACY_JWT_KEY); return null; }
      if (payload.wallet && address && payload.wallet.toLowerCase() !== address.toLowerCase()) { localStorage.removeItem(LEGACY_JWT_KEY); return null; }
      return stored;
    } catch (e) { return null; }
  }

  // ── Auth: challenge-sign-verify flow ──────────────────────────────
  async function authenticate(address, signer) {
    var stored = loadStoredToken(address);
    if (stored) return stored;

    try {
      var challengeRes = await fetch(API_BASE + '/auth/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      var challengeData = await challengeRes.json();
      if (!challengeData.challenge || !challengeData.nonce) return null;

      var signature = await signer.signMessage(challengeData.challenge);

      var verifyRes = await fetch(API_BASE + '/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature: signature, wallet: address, nonce: challengeData.nonce })
      });
      var verifyData = await verifyRes.json();
      if (verifyData.token) { saveAuthToken(verifyData.token); return verifyData.token; }
      return null;
    } catch (e) {
      console.error('Auth failed:', e);
      return null;
    }
  }

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
    if (!addr.startsWith('0x')) return null;
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
    var key = addr.startsWith('0x') ? addr.toLowerCase() : addr;
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
    _eip6963Providers.forEach(function(detail) {
      var rdns = (detail.info && detail.info.rdns) || '';
      if (rdns.indexOf('talisman') !== -1) add('talisman', 'Talisman', '🔮', detail.provider);
      else if (rdns.indexOf('metamask') !== -1) add('metamask', 'MetaMask', '🦊', detail.provider);
      else if (rdns.indexOf('subwallet') !== -1) add('subwallet', 'SubWallet', '🟢', detail.provider);
    });
    if (window.ethereum && window.ethereum.providers && window.ethereum.providers.length > 0) {
      window.ethereum.providers.forEach(function(p) {
        if (p.isTalisman) add('talisman', 'Talisman', '🔮', p);
        if (p.isMetaMask) add('metamask', 'MetaMask', '🦊', p);
        if (p.isSubWallet) add('subwallet', 'SubWallet', '🟢', p);
      });
    }
    if (window.talismanEth) add('talisman', 'Talisman', '🔮', window.talismanEth);
    if (window.SubWallet) add('subwallet', 'SubWallet', '🟢', window.SubWallet);
    if (window.ethereum && !seen.talisman && !seen.metamask) {
      if (window.ethereum.isTalisman) add('talisman', 'Talisman', '🔮', window.ethereum);
      else if (window.ethereum.isMetaMask) add('metamask', 'MetaMask', '🦊', window.ethereum);
      else add('browser', 'Browser Wallet', '🔗', window.ethereum);
    }
    if (window.injectedWeb3) {
      Object.keys(window.injectedWeb3).forEach(function(key) {
        var subId = 'sub-' + key;
        var name = key.charAt(0).toUpperCase() + key.slice(1) + ' (Substrate)';
        var icon = '🔗';
        if (key === 'talisman') { name = 'Talisman (Substrate)'; icon = '🔮'; }
        else if (key.indexOf('polkadot') !== -1) { name = 'Polkadot.js'; icon = '🟠'; }
        else if (key.indexOf('subwallet') !== -1) { name = 'SubWallet (Substrate)'; icon = '🟢'; }
        add(subId, name, icon, { _substrate: true, _key: key });
      });
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
    var hint = document.createElement('p');
    hint.style.cssText = "font-family:'Inter',sans-serif;font-size:.58rem;color:#6a6e7a;text-align:center;margin-top:.8rem;line-height:1.5;";
    hint.textContent = "Can’t see your account? Make sure you’ve selected an Ethereum account in Talisman, not a Substrate one.";
    box.appendChild(title); box.appendChild(sub); box.appendChild(list); box.appendChild(hint); box.appendChild(cancel);
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
    desc.textContent = wallet.provider && wallet.provider._substrate ? 'Substrate wallet' : 'EVM wallet';
    info.appendChild(name); info.appendChild(desc);
    btn.appendChild(icon); btn.appendChild(info);
    if (wallet.provider && wallet.provider._substrate) {
      btn.onclick = function() { closeModal(); connectSubstrate(wallet.provider._key); };
    } else {
      btn.onclick = function() { closeModal(); connectWithProvider(wallet.provider, wallet.id); };
    }
    return btn;
  }

  // ── Verification Gate ──────────────────────────────────────────────
  async function ensureVerified() {
    if (state.verified) return;
    // WalletConnect: the active session IS the permission grant.
    // wallet_requestPermissions is not declared on the WC provider and
    // MetaMask mobile does not respond to it over WC — it would hang.
    if (state.walletType === 'walletconnect') { state.verified = true; return; }
    if (!state.rawProvider) throw new Error('No wallet connected');
    await state.rawProvider.request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }]
    });
    state.verified = true;
  }

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

  // ── Connect (public entry) ────────────────────────────────────────
  async function connect() {
    var wallets = detectWallets();
    if (wallets.length === 0) {
      // No injected wallet — headless WalletConnect.
      connectViaWalletConnect();
      return;
    }
    var evmWallets = wallets.filter(function(w) { return !w.provider._substrate; });
    if (evmWallets.length === 1 && wallets.length === 1) {
      connectWithProvider(evmWallets[0].provider, evmWallets[0].id);
      return;
    }
    createModal();
    var list = document.getElementById('qf-wallet-list');
    list.innerHTML = '';
    wallets.forEach(function(w) { list.appendChild(walletButton(w)); });
  }

  // ── Desktop EIP-6963 flow (UNCHANGED) ─────────────────────────────
  async function connectWithProvider(ethProvider, walletId, silent) {
    try {
      var address;
      if (silent) {
        var accounts = await ethProvider.request({ method: 'eth_accounts' });
        if (!accounts || accounts.length === 0) return;
        address = accounts[0];
      } else {
        var accounts = await ethProvider.request({ method: 'eth_requestAccounts' });
        address = accounts[0];

        try {
          var permissions = await ethProvider.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] });
          var ethAccountsPerm = permissions.find(function(p) { return p.parentCapability === 'eth_accounts'; });
          if (ethAccountsPerm && ethAccountsPerm.caveats) {
            var caveat = ethAccountsPerm.caveats.find(function(c) { return c.type === 'restrictReturnedAccounts'; });
            if (caveat && caveat.value && caveat.value.length > 0) {
              address = caveat.value[0];
            }
          }
        } catch (e) { /* not supported */ }
      }

      var provider = new ethers.BrowserProvider(ethProvider);
      var signer = await provider.getSigner(address);
      var network = await provider.getNetwork();
      var chainId = Number(network.chainId);

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

      authToken = await authenticate(address, { signMessage: function(msg) { return signer.signMessage(msg); } });
      if (authToken) state.verified = true;

      setWalletState({
        status: 'connected',
        walletType: walletId,
        address: address,
        chainId: chainId,
        jwt: authToken,
        authStatus: authToken ? 'authenticated' : 'needs_signature'
      });

      fireCallbacks();

      resolveQfName(address).then(function(name) {
        state.qfName = name;
        fireCallbacks();
      });

      ethProvider.removeAllListeners && ethProvider.removeAllListeners('accountsChanged');
      ethProvider.removeAllListeners && ethProvider.removeAllListeners('chainChanged');
      ethProvider.on('accountsChanged', function(accounts) {
        if (!accounts || accounts.length === 0) {
          disconnect();
        } else {
          connectWithProvider(ethProvider, walletId);
        }
      });
      ethProvider.on('chainChanged', function() {
        connectWithProvider(ethProvider, walletId);
      });

    } catch (e) {
      console.error('Wallet connect failed:', e);
      showWalletError('Connection failed. Please unlock your wallet and try again.');
    }
  }

  function showWalletError(msg) {
    var existing = document.getElementById('qf-wallet-error');
    if (existing) existing.remove();
    var errorDiv = document.createElement('div');
    errorDiv.id = 'qf-wallet-error';
    errorDiv.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);background:#1e2025;border:1px solid #b03a3a;border-radius:8px;padding:.8rem 1.2rem;z-index:9999;font-family:"Inter",sans-serif;font-size:.75rem;color:#e8eaf0;max-width:320px;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.5);';
    errorDiv.textContent = msg;
    document.body.appendChild(errorDiv);
    setTimeout(function() { var el = document.getElementById('qf-wallet-error'); if (el) el.remove(); }, 4000);
  }

  // ── WalletConnect (headless) ──────────────────────────────────────
  // Eager init: called from bootWalletNav() on every page load so that
  // the provider exists and all listeners (display_uri, connect, etc.)
  // are attached BEFORE the user taps Connect. Attaching listeners inside
  // the tap handler creates a race — the module import + init can take
  // hundreds of ms, and the user-gesture token that authorises the
  // subsequent metamask:// navigation expires.
  async function initWalletConnectRuntime() {
    if (wcProvider) return wcProvider;
    if (wcInitPromise) return wcInitPromise;
    wcInitPromise = (async function() {
      var mod = await import('https://esm.sh/@walletconnect/ethereum-provider@2.17.0');
      var EthereumProvider = mod.EthereumProvider || mod.default;
      var prov = await EthereumProvider.init({
        projectId: WC_PROJECT_ID,
        chains: [QF_CHAIN_ID],
        optionalChains: [QF_CHAIN_ID],
        rpcMap: { 3426: QF_RPC },
        showQrModal: false,
        methods: ['eth_sendTransaction', 'personal_sign', 'eth_sign', 'eth_chainId', 'eth_accounts', 'wallet_switchEthereumChain', 'wallet_addEthereumChain'],
        events: ['accountsChanged', 'chainChanged', 'connect', 'disconnect'],
        metadata: {
          name: 'QF Games',
          description: 'Maths puzzle games on QF Network',
          url: window.location.origin,
          icons: [window.location.origin + '/qf-dapp/assets/icon-512.png']
        }
      });
      wireWcEvents(prov);
      wcProvider = prov;
      return prov;
    })();
    return wcInitPromise;
  }

  // Back-compat alias for anything internal still calling the old name.
  var initWcProvider = initWalletConnectRuntime;

  function wireWcEvents(prov) {
    prov.on('display_uri', function(uri) {
      // Deep-link only. All flow-marker writes happen in
      // connectViaWalletConnect() before prov.connect() is called.
      var target = 'metamask://wc?uri=' + encodeURIComponent(uri);
      window.location.href = target;
    });
    prov.on('connect', function() {
      // Best-effort — may not fire on rehydration paths. Session-first
      // reconciliation in resumeAndReconcile() does not depend on this.
      handleWcSessionEstablished(prov);
    });
    prov.on('accountsChanged', function(accounts) {
      if (!accounts || accounts.length === 0) { disconnect(); return; }
      var s = readStoredWalletState();
      if (s.walletType === 'walletconnect' && accounts[0].toLowerCase() !== (s.address || '').toLowerCase()) {
        setWalletState({ address: accounts[0].toLowerCase(), jwt: null, authStatus: 'needs_signature' });
      }
    });
    prov.on('chainChanged', function(chainIdHex) {
      var cid = typeof chainIdHex === 'string' ? parseInt(chainIdHex, 16) : Number(chainIdHex);
      var s = readStoredWalletState();
      if (s.walletType === 'walletconnect') setWalletState({ chainId: cid });
    });
    prov.on('disconnect', function() {
      var s = readStoredWalletState();
      if (s.walletType === 'walletconnect') disconnect();
    });
  }

  function wcHasLiveSession(prov) {
    // Truth source: the WC session object. Accounts is derived from it
    // but the session object itself is more definitive.
    if (!prov) return false;
    if (prov.session) return true;
    if (prov.accounts && prov.accounts.length > 0) return true;
    return false;
  }

  function hydrateWcMemoryState(prov, liveAddress) {
    try {
      state.address = (liveAddress || '').toLowerCase();
      state.chainId = prov.chainId ? Number(prov.chainId) : QF_CHAIN_ID;
      state.walletType = 'walletconnect';
      state.rawProvider = prov;
      state.provider = new ethers.BrowserProvider(prov);
      state.signer = wrapSigner(signerProxy(prov));
      state.verified = false;
    } catch (e) { console.error('WC state hydrate failed:', e); }
  }

  async function ensureQfChain(prov) {
    try {
      await prov.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: QF_CHAIN_HEX }] });
    } catch (switchErr) {
      try {
        await prov.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: QF_CHAIN_HEX,
            chainName: 'QF Network Mainnet',
            nativeCurrency: { name: 'QF', symbol: 'QF', decimals: 18 },
            rpcUrls: [QF_RPC],
            blockExplorerUrls: []
          }]
        });
      } catch (addErr) {
        console.error('QF chain add/switch failed over WC:', addErr && addErr.message);
      }
    }
  }

  function handleWcSessionEstablished(prov) {
    var live = (prov.accounts && prov.accounts[0]) ? prov.accounts[0] : null;  // preserve case
    if (!live) return;
    var liveLower = live.toLowerCase();

    // Idempotent: if we've already processed this session in this page
    // lifecycle, just make sure in-memory state is hydrated and return.
    if (wcSessionProcessed) {
      hydrateWcMemoryState(prov, live);
      return;
    }
    wcSessionProcessed = true;

    // Preserve an existing valid JWT if address matches — rehydration on
    // page load must not wipe authentication state.
    var prior = readStoredWalletState();
    var preservedJwt = null;
    if (prior.walletType === 'walletconnect' &&
        prior.address && prior.address.toLowerCase() === liveLower &&
        prior.jwt && !isJwtExpired(prior.jwt)) {
      preservedJwt = prior.jwt;
    }

    var cid = prov.chainId ? Number(prov.chainId) : QF_CHAIN_ID;
    setWalletState({
      status: 'connected',
      walletType: 'walletconnect',
      address: liveLower,
      chainId: cid,
      jwt: preservedJwt,
      authStatus: preservedJwt ? 'authenticated' : 'none'
    });

    hydrateWcMemoryState(prov, live);

    resolveQfName(liveLower).then(function(name) {
      if (name) nameCache[liveLower] = name;
    });

    // Make sure the wallet ends up on QF Network (chain 3426).
    if (cid !== QF_CHAIN_ID) {
      ensureQfChain(prov);
    }

    try { localStorage.removeItem(FLOW_KEY); } catch (e) {}
    if (location.pathname.indexOf(WALLET_RETURN_PATH) !== 0) {
      window.location.href = WALLET_RETURN_PATH;
    }
  }

  function signerProxy(prov) {
    // Minimal ethers-like signer that proxies through the WC provider.
    // Uses the already-connected WC session — no re-pairing. Reads the
    // live account on each call so address case always matches what
    // MetaMask currently considers the connected account (avoids a
    // mid-flow "switch account" prompt).
    function currentAccount() {
      return (prov.accounts && prov.accounts[0]) || null;
    }
    return {
      signMessage: async function(message) {
        var acct = currentAccount();
        if (!acct) throw new Error('No WalletConnect account available');
        var msgHex = '0x' + Array.from(new TextEncoder().encode(message)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
        // Do NOT deep-link away here — navigating to metamask:// mid-request
        // can kill the JS context and drop the pending response, which
        // produces a second signing request on return. The WC relay will
        // route the request to MetaMask, which surfaces a system
        // notification. The /wallet-return/ UI tells the user to open MM.
        return prov.request({ method: 'personal_sign', params: [msgHex, acct] });
      },
      sendTransaction: async function(tx) {
        var hash = await prov.request({ method: 'eth_sendTransaction', params: [tx] });
        return { hash: hash, wait: async function() { return state.provider.waitForTransaction(hash); } };
      }
    };
  }

  async function connectViaWalletConnect() {
    try {
      // Eager init should already have run from bootWalletNav(); await
      // here resolves immediately from the cached singleton.
      var prov = await initWalletConnectRuntime();

      // Warm resume — session already live, no need to re-pair.
      if (wcHasLiveSession(prov)) {
        handleWcSessionEstablished(prov);
        return;
      }

      // Mark this as a fresh connect attempt so /wallet-return/ can tell
      // it apart from a stale session, and so we have the return path
      // queued BEFORE prov.connect() runs (display_uri fires synchronously
      // inside connect()).
      try {
        localStorage.setItem(WC_CONNECT_REQUESTED_AT_KEY, String(Date.now()));
        localStorage.setItem(FLOW_KEY, 'wc');
        sessionStorage.setItem(RETURN_PATH_KEY, location.pathname + location.search);
      } catch (e) {}

      // Tap-time work is minimal: just connect. Listeners are already
      // attached from eager init, so display_uri fires into the handler
      // that deep-links to metamask://.
      await prov.connect({ chains: [QF_CHAIN_ID] });
    } catch (e) {
      console.error('WC connect failed:', e);
      showWalletError('Could not connect via WalletConnect. Please try again.');
    }
  }

  // ── Substrate connection (UNCHANGED) ───────────────────────────────
  async function connectSubstrate(subKey) {
    try {
      if (!window.polkadotExtensionDapp) {
        await new Promise(function(resolve, reject) {
          var s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/@polkadot/extension-dapp@0.52.3/bundle-polkadot-extension-dapp.min.js';
          s.onload = resolve;
          s.onerror = function() { reject(new Error('Failed to load Substrate extension library')); };
          document.head.appendChild(s);
        });
      }
      var ext = window.polkadotExtensionDapp;
      if (!ext) { showWalletError('Substrate wallet extension not loaded.'); return; }

      var extensions = await ext.web3Enable('MathsWins');
      if (!extensions || extensions.length === 0) { showWalletError('No Substrate wallet authorised. Please approve the connection in your wallet extension.'); return; }

      var accounts = await ext.web3Accounts();
      if (!accounts || accounts.length === 0) { showWalletError('No Substrate accounts found.'); return; }

      var filtered = accounts.filter(function(a) { return a.meta && a.meta.source === subKey; });
      var accs = filtered.length > 0 ? filtered : accounts;

      var selected;
      if (accs.length === 1) {
        selected = accs[0];
      } else {
        selected = await showSubstrateAccountPicker(accs);
        if (!selected) return;
      }

      var injector = await ext.web3FromAddress(selected.address);
      var signer = injector.signer;

      state.address = selected.address;
      state.balance = null;
      state.chainId = null;
      state.provider = null;
      state.signer = { signMessage: function(msg) { return signer.signRaw({ address: selected.address, data: stringToHex(msg), type: 'bytes' }).then(function(r) { return r.signature; }); } };
      state.walletType = 'sub-' + subKey;
      state.rawProvider = null;
      state.qfName = null;
      state.verified = true;

      try { localStorage.setItem('qf_wallet_id', 'sub-' + subKey); } catch (e) {}
      try { localStorage.setItem('qf_substrate_addr', selected.address); } catch (e) {}

      authToken = await authenticate(selected.address, state.signer);

      setWalletState({
        status: 'connected',
        walletType: 'sub-' + subKey,
        address: selected.address,
        chainId: null,
        jwt: authToken,
        authStatus: authToken ? 'authenticated' : 'needs_signature'
      });

      fireCallbacks();
    } catch (e) {
      console.error('Substrate connect failed:', e);
      showWalletError('Substrate connection failed. Please try again.');
    }
  }

  function stringToHex(str) {
    var hex = '0x';
    for (var i = 0; i < str.length; i++) hex += str.charCodeAt(i).toString(16).padStart(2, '0');
    return hex;
  }

  function showSubstrateAccountPicker(accounts) {
    return new Promise(function(resolve) {
      createModal();
      var list = document.getElementById('qf-wallet-list');
      list.innerHTML = '';
      var title = document.querySelector('#qf-wallet-modal h3');
      if (title) title.textContent = 'Select Account';
      accounts.forEach(function(acc) {
        var btn = document.createElement('button');
        btn.style.cssText = "width:100%;padding:.8rem 1rem;display:flex;align-items:center;gap:.8rem;background:#1e2025;border:1px solid #2a2e36;border-radius:8px;cursor:pointer;transition:all .15s;";
        btn.onmouseover = function() { btn.style.borderColor = 'rgba(184,188,198,0.15)'; };
        btn.onmouseout = function() { btn.style.borderColor = '#2a2e36'; };
        var info = document.createElement('div');
        info.style.cssText = 'text-align:left;flex:1;';
        var name = document.createElement('div');
        name.style.cssText = "font-family:'Inter',sans-serif;font-size:.82rem;font-weight:600;color:#e8eaf0;";
        name.textContent = (acc.meta && acc.meta.name) || 'Account';
        var addr = document.createElement('div');
        addr.style.cssText = "font-family:'JetBrains Mono',monospace;font-size:.52rem;color:#4a4e5a;margin-top:.1rem;";
        addr.textContent = acc.address.slice(0, 8) + '...' + acc.address.slice(-6);
        info.appendChild(name); info.appendChild(addr);
        btn.appendChild(info);
        btn.onclick = function() { closeModal(); resolve(acc); };
        list.appendChild(btn);
      });
    });
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
    if (state.rawProvider && state.rawProvider.removeAllListeners) {
      state.rawProvider.removeAllListeners('accountsChanged');
      state.rawProvider.removeAllListeners('chainChanged');
    }
    if (wcProvider && state.walletType === 'walletconnect') {
      try { wcProvider.disconnect(); } catch (e) {}
    }
    state.address = null;
    state.balance = null;
    state.chainId = null;
    state.provider = null;
    state.signer = null;
    state.qfName = null;
    state.walletType = null;
    state.rawProvider = null;
    state.verified = false;
    clearAuthToken();
    try { localStorage.removeItem('qf_wallet_id'); } catch (e) {}
    try { localStorage.removeItem('qf_substrate_addr'); } catch (e) {}
    setWalletState(defaultState());
    fireDisconnectCallbacks();
  }

  // ── Wallet Menu ───────────────────────────────────────────────────
  function showWalletMenu(anchorEl) {
    var existing = document.getElementById('qf-wallet-menu');
    if (existing) { existing.remove(); return; }

    var s = readStoredWalletState();
    var displayAddr = state.address || s.address;
    var displayName = state.qfName || (displayAddr ? nameCache[displayAddr.toLowerCase()] : null);

    var rect = anchorEl.getBoundingClientRect();
    var menu = document.createElement('div');
    menu.id = 'qf-wallet-menu';
    menu.style.cssText = 'position:fixed;top:' + (rect.bottom + 4) + 'px;right:' + (window.innerWidth - rect.right) + 'px;'
      + 'background:#1e2025;border:1px solid #2a2e36;border-radius:8px;padding:.3rem 0;z-index:9999;'
      + 'box-shadow:0 8px 24px rgba(0,0,0,.5);min-width:160px;';

    var addrItem = document.createElement('div');
    addrItem.style.cssText = "padding:.5rem .8rem;font-family:'JetBrains Mono',monospace;font-size:.58rem;color:#4a4e5a;border-bottom:1px solid #2a2e36;word-break:break-all;";
    addrItem.textContent = displayAddr || '';
    menu.appendChild(addrItem);

    if (displayName) {
      var nameItem = document.createElement('div');
      nameItem.style.cssText = "padding:.4rem .8rem;font-family:'JetBrains Mono',monospace;font-size:.65rem;color:#d4d8e2;border-bottom:1px solid #2a2e36;";
      nameItem.textContent = displayName;
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

  // ── Resume & Reconcile ────────────────────────────────────────────
  // Called on every page boot. Reconciles stored state with live WC
  // session (if any) and never triggers signing automatically.
  async function resumeAndReconcile() {
    var s = readStoredWalletState();

    // Desktop EIP-6963 auto-reconnect (unchanged semantics — silent).
    var savedId;
    try { savedId = localStorage.getItem('qf_wallet_id'); } catch (e) {}
    if (savedId && !state.address) {
      if (savedId.startsWith('sub-')) {
        connectSubstrate(savedId.slice(4));
      } else {
        setTimeout(function() {
          var wallets = detectWallets();
          var match = wallets.find(function(w) { return w.id === savedId; });
          if (match) connectWithProvider(match.provider, match.id, true);
        }, 500);
      }
    }

    // WalletConnect: session-first reconciliation. We do NOT wait for a
    // connect event — on rehydration after a deep-link return, that
    // event may never fire. Truth source is provider.session.
    if (s.walletType === 'walletconnect' && s.status === 'connected') {
      try {
        var prov = await initWalletConnectRuntime();
        if (wcHasLiveSession(prov)) {
          // Idempotent — preserves existing valid JWT, ensures chain, hydrates memory.
          handleWcSessionEstablished(prov);
          var liveLower = (prov.accounts && prov.accounts[0] || '').toLowerCase();
          if (liveLower) {
            resolveQfName(liveLower).then(function(name) {
              if (name) { nameCache[liveLower] = name; state.qfName = name; fireCallbacks(); renderNav(); }
            });
          }
          fireCallbacks();
        } else {
          // Stored says connected but live session is gone.
          setWalletState(defaultState());
        }
      } catch (e) {
        console.error('WC resume failed:', e);
      }
    }

    // Never triggers signing.
    await ensureValidJwt({ interactive: false });
    renderNav();
  }

  // ── Tri-state JWT ─────────────────────────────────────────────────
  // Returns one of:
  //   { status: 'valid' }
  //   { status: 'needs_signature' }
  //   { status: 'no_wallet' }
  // Only signs when interactive === true AND we're outside the post-return cooldown.
  async function ensureValidJwt(opts) {
    var interactive = !!(opts && opts.interactive);
    var s = readStoredWalletState();
    if (!s.address || s.status !== 'connected') return { status: 'no_wallet' };

    if (s.jwt && !isJwtExpired(s.jwt)) {
      if (s.authStatus !== 'authenticated') setWalletState({ authStatus: 'authenticated' });
      authToken = s.jwt;
      return { status: 'valid' };
    }

    if (!interactive) {
      if (s.authStatus !== 'needs_signature') setWalletState({ authStatus: 'needs_signature' });
      // Cooldown guards the auto path: within 8s of a deep-link return we
      // never promote authStatus silently. Interactive calls (user click)
      // bypass this — the cooldown's purpose is "no auto-signing", not
      // "no user-initiated signing".
      var returnedAt = 0;
      try { returnedAt = parseInt(sessionStorage.getItem(RETURNED_AT_KEY) || '0', 10); } catch (e) {}
      if (returnedAt && (Date.now() - returnedAt) < POST_RETURN_COOLDOWN_MS) {
        return { status: 'needs_signature' };
      }
      return { status: 'needs_signature' };
    }

    var signer = await getSignerForCurrentState();
    if (!signer) {
      setWalletState({ authStatus: 'needs_signature' });
      return { status: 'needs_signature' };
    }

    try {
      var token = await authenticate(s.address, signer);
      if (token) {
        setWalletState({ jwt: token, authStatus: 'authenticated' });
        authToken = token;
        return { status: 'valid' };
      }
    } catch (e) {
      console.error('JWT sign failed:', e);
    }
    setWalletState({ authStatus: 'needs_signature' });
    return { status: 'needs_signature' };
  }

  async function getSignerForCurrentState() {
    var s = readStoredWalletState();
    if (state.signer) return { signMessage: function(m) { return state.signer.signMessage(m); } };
    if (s.walletType === 'walletconnect') {
      try {
        var prov = await initWcProvider();
        if (prov.accounts && prov.accounts.length > 0) {
          return signerProxy(prov);
        }
      } catch (e) { console.error('WC signer init failed:', e); }
    }
    return null;
  }

  // ── Nav rendering (pure function of stored state) ─────────────────
  function renderNav() {
    var s = readStoredWalletState();
    var connectBtn = document.getElementById('qfnConnect');
    var addrEl = document.getElementById('qfnAddr');
    var nameEl = document.getElementById('qfnName');
    var balEl = document.getElementById('qfnBalance');
    var netEl = document.getElementById('qfnNetwork');
    var netNameEl = document.getElementById('qfnNetworkName');
    var acctEl = document.getElementById('qfnAccount');
    var finishEl = document.getElementById('qfnFinishSignin');
    if (!connectBtn) return; // nav not rendered on this page

    var rightEl = connectBtn.parentElement;

    if (s.status === 'connected' && s.authStatus === 'needs_signature') {
      connectBtn.style.display = 'none';
      if (addrEl) addrEl.style.display = 'none';
      if (nameEl) nameEl.style.display = 'none';
      if (balEl) balEl.style.display = 'none';
      if (netEl) netEl.style.display = 'none';
      if (acctEl) acctEl.style.display = 'none';
      if (rightEl) rightEl.classList.add('qfn-connected');
      if (!finishEl && rightEl) {
        finishEl = document.createElement('button');
        finishEl.id = 'qfnFinishSignin';
        finishEl.className = 'qfn-connect';
        finishEl.textContent = 'Finish sign-in';
        finishEl.addEventListener('click', function() { ensureValidJwt({ interactive: true }); });
        rightEl.appendChild(finishEl);
      }
      if (finishEl) finishEl.style.display = '';
      return;
    }

    if (finishEl) finishEl.style.display = 'none';

    if (s.status === 'connected' && s.address) {
      connectBtn.style.display = 'none';
      if (rightEl) rightEl.classList.add('qfn-connected');
      if (acctEl) acctEl.style.display = '';
      var cachedName = nameCache[s.address.toLowerCase()] || state.qfName;
      if (cachedName && nameEl) {
        nameEl.textContent = cachedName;
        nameEl.style.display = '';
        if (addrEl) addrEl.style.display = 'none';
      } else if (addrEl) {
        addrEl.textContent = s.address.slice(0, 6) + '...' + s.address.slice(-4);
        addrEl.style.display = '';
        if (nameEl) nameEl.style.display = 'none';
      }
      var path = location.pathname;
      var isLobby = /\/qf-dapp\/?$/.test(path) || /\/qf-dapp\/index\.html$/.test(path);
      if (isLobby && netEl) {
        netEl.style.display = 'flex';
        if (s.chainId === QF_CHAIN_ID) {
          netEl.className = 'qfn-network';
          if (netNameEl) netNameEl.textContent = 'QF Network';
        } else {
          netEl.className = 'qfn-network wrong';
          if (netNameEl) netNameEl.textContent = 'Wrong Network';
        }
      }
      if (isLobby && balEl && state.balance) {
        balEl.style.display = '';
        balEl.textContent = parseFloat(ethers.formatEther(state.balance)).toFixed(2) + ' QF';
      }
      return;
    }

    // Disconnected
    connectBtn.style.display = '';
    if (rightEl) rightEl.classList.remove('qfn-connected');
    if (addrEl) addrEl.style.display = 'none';
    if (nameEl) nameEl.style.display = 'none';
    if (balEl) balEl.style.display = 'none';
    if (netEl) netEl.style.display = 'none';
    if (acctEl) acctEl.style.display = 'none';
  }

  // ── Boot ───────────────────────────────────────────────────────────
  var navBooted = false;
  function bootWalletNav() {
    if (navBooted) { renderNav(); return; }
    navBooted = true;

    // Eager WalletConnect runtime init — fires in the background so the
    // provider + all listeners exist before the user can tap Connect.
    // Fire-and-forget: nav rendering must not wait on this.
    initWalletConnectRuntime().catch(function(e) {
      console.error('WC runtime init failed:', e && e.message);
    });

    // Wire connect button
    var connectBtn = document.getElementById('qfnConnect');
    if (connectBtn) {
      connectBtn.addEventListener('click', function() { connect(); });
    }

    // Wire addr/name click → menu
    var addrEl = document.getElementById('qfnAddr');
    var nameEl = document.getElementById('qfnName');
    if (addrEl) addrEl.addEventListener('click', function() { showWalletMenu(this); });
    if (nameEl) nameEl.addEventListener('click', function() { showWalletMenu(this); });

    // Render immediately from stored state
    renderNav();

    // Re-render when canonical state changes (same tab)
    window.addEventListener('qfwallet:state', renderNav);
    // Cross-tab storage sync
    window.addEventListener('storage', function(e) {
      if (e.key === STATE_KEY || e.key === LEGACY_JWT_KEY) renderNav();
    });
    // Returning from backgrounded tab (deep-link return)
    window.addEventListener('pageshow', function() {
      try { sessionStorage.setItem(RETURNED_AT_KEY, String(Date.now())); } catch (e) {}
      resumeAndReconcile();
    });
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible') {
        try { sessionStorage.setItem(RETURNED_AT_KEY, String(Date.now())); } catch (e) {}
        resumeAndReconcile();
      }
    });

    // Keep nav in sync when existing flows fire connect/disconnect callbacks
    onConnect(function() { renderNav(); });
    onDisconnect(function() { renderNav(); });

    // Kick off reconcile in background
    resumeAndReconcile();
  }

  // ── Public API ────────────────────────────────────────────────────
  window.qfWallet = {
    get address()    { return state.address || readStoredWalletState().address; },
    get balance()    { return state.balance; },
    get signer()     { return state.signer; },
    get provider()   { return state.provider; },
    get chainId()    { return state.chainId || readStoredWalletState().chainId; },
    get qfName()     { return state.qfName; },
    get walletType() { return state.walletType || readStoredWalletState().walletType; },
    get verified()   { return state.verified; },
    isConnected: function() {
      if (state.address) return true;
      var s = readStoredWalletState();
      return s.status === 'connected' && !!s.address;
    },
    get authToken() { return authToken || readStoredWalletState().jwt; },
    authHeaders: function() {
      var h = { 'Content-Type': 'application/json' };
      var s = readStoredWalletState();
      var token = authToken || s.jwt || loadStoredToken(state.address || s.address);
      if (token) { authToken = token; h['Authorization'] = 'Bearer ' + token; }
      else if (state.address || s.address) h['X-Wallet-Address'] = state.address || s.address;
      return h;
    },
    ensureVerified: ensureVerified,
    connect: connect,
    disconnect: disconnect,
    displayName: function() {
      var addr = state.address || readStoredWalletState().address;
      if (state.qfName) return state.qfName;
      if (addr) return addr.slice(0, 6) + '...' + addr.slice(-4);
      return null;
    },
    resolveAny: resolveQfName,
    formatAddr: formatAddr,
    onConnect: onConnect,
    onDisconnect: onDisconnect,
    showMenu: showWalletMenu,
    nameCache: nameCache,
    // New exports
    bootWalletNav: bootWalletNav,
    initWalletConnectRuntime: initWalletConnectRuntime,
    wcHasLiveSession: function() { return wcHasLiveSession(wcProvider); },
    readStoredWalletState: readStoredWalletState,
    setWalletState: setWalletState,
    ensureValidJwt: ensureValidJwt,
    resumeAndReconcile: resumeAndReconcile,
    renderNav: renderNav
  };

  window.dappWallet = window.qfWallet;
})();
