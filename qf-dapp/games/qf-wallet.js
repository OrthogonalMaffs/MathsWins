/**
 * QF Games — Shared wallet connection module.
 * Supports MetaMask and Talisman (EVM mode).
 * Include after ethers.js CDN on any qf-dapp page.
 *
 * Usage:
 *   qfWallet.connect()          — opens wallet chooser modal
 *   qfWallet.address             — connected EVM address (H160)
 *   qfWallet.qfName              — resolved .qf name or null
 *   qfWallet.displayName()       — .qf name or truncated address
 *   qfWallet.isConnected()       — boolean
 *   qfWallet.resolveAny(addr)    — resolve any address to .qf name (async)
 *   qfWallet.formatAddr(addr)    — .qf name from cache or truncated address (sync)
 *   qfWallet.onConnect(callback) — register callback for connection events
 */
(function() {
  'use strict';

  var QF_CHAIN_ID = 3426;
  var QF_CHAIN_HEX = '0xd62';
  var QF_RPC = 'https://archive.mainnet.qfnode.net/eth';
  var QNS_RESOLVER = '0xd5d12431b2956248861dbec5e8a9bc6023114e80';
  var QNS_ABI = ['function reverseResolve(address _addr) view returns (string)'];

  var state = {
    address: null, balance: null, chainId: null,
    provider: null, signer: null, qfName: null, walletType: null
  };

  var nameCache = {};
  var connectCallbacks = [];
  var qnsResolver = null;

  // ── QNS Resolution ────────────────────────────────────────────────
  function getResolver() {
    if (!qnsResolver) {
      var rpcProvider = new ethers.JsonRpcProvider(QF_RPC);
      qnsResolver = new ethers.Contract(QNS_RESOLVER, QNS_ABI, rpcProvider);
    }
    return qnsResolver;
  }

  async function resolveQfName(addr) {
    if (!addr) return null;
    var key = addr.toLowerCase();
    if (nameCache[key] !== undefined) return nameCache[key];
    try {
      var resolver = getResolver();
      var name = await resolver.reverseResolve(addr);
      var result = (name && name.length > 0) ? name : null;
      nameCache[key] = result;
      return result;
    } catch (e) {
      nameCache[key] = null;
      return null;
    }
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

    // EIP-6963: multiple providers array (MetaMask + Talisman both present)
    if (window.ethereum && window.ethereum.providers && window.ethereum.providers.length > 0) {
      window.ethereum.providers.forEach(function(p) {
        if (p.isTalisman) add('talisman', 'Talisman', '\uD83D\uDD2E', p);
        else if (p.isMetaMask) add('metamask', 'MetaMask', '\uD83E\uDD8A', p);
      });
    }

    // Talisman's dedicated EVM provider
    if (window.talismanEth) {
      add('talisman', 'Talisman', '\uD83D\uDD2E', window.talismanEth);
    }

    // Single provider on window.ethereum
    if (window.ethereum && !seen.talisman && !seen.metamask) {
      if (window.ethereum.isTalisman) {
        add('talisman', 'Talisman', '\uD83D\uDD2E', window.ethereum);
      } else if (window.ethereum.isMetaMask) {
        add('metamask', 'MetaMask', '\uD83E\uDD8A', window.ethereum);
      } else {
        add('browser', 'Browser Wallet', '\uD83D\uDD17', window.ethereum);
      }
    }

    // Talisman on window.ethereum when it's the only extension but sets isMetaMask too
    if (window.ethereum && window.ethereum.isTalisman && !seen.talisman) {
      add('talisman', 'Talisman', '\uD83D\uDD2E', window.ethereum);
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

    box.appendChild(title);
    box.appendChild(sub);
    box.appendChild(list);
    box.appendChild(cancel);
    overlay.appendChild(box);

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeModal();
    });

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

    info.appendChild(name);
    info.appendChild(desc);

    btn.appendChild(icon);
    btn.appendChild(info);

    btn.onclick = function() {
      closeModal();
      connectWithProvider(wallet.provider, wallet.id);
    };

    return btn;
  }

  function showNoWalletMessage(list) {
    var msg = document.createElement('div');
    msg.style.cssText = "text-align:center;padding:1rem;font-family:'Inter',sans-serif;font-size:.72rem;color:#8a8f9c;line-height:1.6;";
    msg.innerHTML = 'No wallet detected.<br><br>'
      + '<a href="https://metamask.io" target="_blank" style="color:#b8bcc6;text-decoration:none;">Install MetaMask</a>'
      + ' or '
      + '<a href="https://talisman.xyz" target="_blank" style="color:#b8bcc6;text-decoration:none;">Install Talisman</a>';
    list.appendChild(msg);
  }

  // ── Connect Flow ──────────────────────────────────────────────────
  async function connect() {
    var wallets = detectWallets();

    if (wallets.length === 0) {
      createModal();
      showNoWalletMessage(document.getElementById('qf-wallet-list'));
      return;
    }

    // Single wallet: connect directly, skip modal
    if (wallets.length === 1) {
      await connectWithProvider(wallets[0].provider, wallets[0].id);
      return;
    }

    // Multiple wallets: show chooser
    createModal();
    var list = document.getElementById('qf-wallet-list');
    list.innerHTML = '';
    wallets.forEach(function(w) {
      list.appendChild(walletButton(w));
    });
  }

  async function connectWithProvider(ethProvider, walletId) {
    try {
      var provider = new ethers.BrowserProvider(ethProvider);
      await provider.send('eth_requestAccounts', []);
      var signer = await provider.getSigner();
      var address = await signer.getAddress();
      var network = await provider.getNetwork();
      var chainId = Number(network.chainId);

      // Auto-add QF Network if wrong chain
      if (chainId !== QF_CHAIN_ID) {
        try {
          await ethProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: QF_CHAIN_HEX }]
          });
        } catch (switchErr) {
          // Chain not found — add it
          await ethProvider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: QF_CHAIN_HEX,
              chainName: 'QF Network Mainnet',
              nativeCurrency: { name: 'QF', symbol: 'QF', decimals: 18 },
              rpcUrls: [QF_RPC],
              blockExplorerUrls: []
            }]
          });
        }
        // Re-read after chain switch
        network = await provider.getNetwork();
        chainId = Number(network.chainId);
      }

      var balance = await provider.getBalance(address);

      state.address = address;
      state.balance = balance;
      state.chainId = chainId;
      state.provider = provider;
      state.signer = signer;
      state.walletType = walletId;

      // Resolve .qf name in background
      resolveQfName(address).then(function(name) {
        state.qfName = name;
        fireCallbacks();
      });

      fireCallbacks();

      // Listen for changes
      ethProvider.on('accountsChanged', function() { location.reload(); });
      ethProvider.on('chainChanged', function() { location.reload(); });

    } catch (e) {
      console.error('Wallet connect failed:', e);
    }
  }

  // ── Callbacks ─────────────────────────────────────────────────────
  function fireCallbacks() {
    connectCallbacks.forEach(function(cb) {
      try { cb(state); } catch (e) { console.error('Wallet callback error:', e); }
    });
  }

  function onConnect(cb) {
    connectCallbacks.push(cb);
    // Fire immediately if already connected
    if (state.address) {
      try { cb(state); } catch (e) { console.error('Wallet callback error:', e); }
    }
  }

  // ── Disconnect ────────────────────────────────────────────────────
  function disconnect() {
    state.address = null;
    state.balance = null;
    state.chainId = null;
    state.provider = null;
    state.signer = null;
    state.qfName = null;
    state.walletType = null;
    // Clear any persisted connection preference
    try { localStorage.removeItem('qf-wallet-connected'); } catch (e) {}
    location.reload();
  }

  // ── Wallet Menu (dropdown on connected wallet click) ──────────────
  function showWalletMenu(anchorEl) {
    // Remove existing menu if any
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

    var switchBtn = document.createElement('div');
    switchBtn.style.cssText = "padding:.5rem .8rem;font-family:'Inter',sans-serif;font-size:.7rem;color:#b8bcc6;cursor:pointer;transition:background .1s;";
    switchBtn.textContent = 'Switch Wallet';
    switchBtn.onmouseover = function() { switchBtn.style.background = '#26282e'; };
    switchBtn.onmouseout = function() { switchBtn.style.background = 'none'; };
    switchBtn.onclick = function() {
      menu.remove();
      // Try to trigger wallet's own account switcher
      if (window.ethereum && window.ethereum.request) {
        window.ethereum.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] })
          .then(function() { location.reload(); })
          .catch(function() { connect(); });
      } else {
        connect();
      }
    };
    menu.appendChild(switchBtn);

    var disconnectBtn = document.createElement('div');
    disconnectBtn.style.cssText = "padding:.5rem .8rem;font-family:'Inter',sans-serif;font-size:.7rem;color:#b03a3a;cursor:pointer;transition:background .1s;";
    disconnectBtn.textContent = 'Disconnect';
    disconnectBtn.onmouseover = function() { disconnectBtn.style.background = '#26282e'; };
    disconnectBtn.onmouseout = function() { disconnectBtn.style.background = 'none'; };
    disconnectBtn.onclick = function() { menu.remove(); disconnect(); };
    menu.appendChild(disconnectBtn);

    document.body.appendChild(menu);

    // Close on click outside
    setTimeout(function() {
      document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target) && e.target !== anchorEl) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 10);
  }

  // ── Auto-connect (if previously connected) ────────────────────────
  function autoConnect() {
    // Check for any injected provider that's already authorised
    if (window.ethereum && window.ethereum.selectedAddress) {
      var wallets = detectWallets();
      if (wallets.length > 0) {
        connectWithProvider(wallets[0].provider, wallets[0].id);
      }
    }
  }

  // Run auto-connect after a brief delay to let extensions inject
  setTimeout(autoConnect, 200);

  // ── Public API ────────────────────────────────────────────────────
  window.qfWallet = {
    get address()    { return state.address; },
    get balance()    { return state.balance; },
    get signer()     { return state.signer; },
    get provider()   { return state.provider; },
    get chainId()    { return state.chainId; },
    get qfName()     { return state.qfName; },
    get walletType() { return state.walletType; },
    isConnected: function() { return !!state.address; },
    connect: connect,
    displayName: function() {
      if (state.qfName) return state.qfName;
      if (state.address) return state.address.slice(0, 6) + '...' + state.address.slice(-4);
      return null;
    },
    resolveAny: resolveQfName,
    formatAddr: formatAddr,
    onConnect: onConnect,
    disconnect: disconnect,
    showMenu: showWalletMenu,
    nameCache: nameCache
  };
})();
