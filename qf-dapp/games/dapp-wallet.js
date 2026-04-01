/**
 * MathsWins dApp — Shared wallet connection for game pages.
 * Include after ethers.js CDN.
 *
 * Renders the wallet bar and handles connect/disconnect.
 * Exposes: dappWallet.address, dappWallet.balance, dappWallet.signer, dappWallet.isConnected()
 */
(function() {
  'use strict';

  var QF_CHAIN_ID = 3426;
  var state = { address: null, balance: null, chainId: null, provider: null, signer: null };

  // Render wallet bar at top of page
  var bar = document.createElement('div');
  bar.className = 'dapp-bar';
  bar.innerHTML = '<div class="dapp-bar-left">'
    + '<a href="/dapp/" class="dapp-back">← Lobby</a>'
    + '<a href="/dapp/" class="dapp-logo">MATHS<span>WINS</span></a>'
    + '<span class="dapp-badge">QF NETWORK</span>'
    + '</div>'
    + '<div class="dapp-bar-right">'
    + '<span class="dapp-balance" id="dappBalance" style="display:none"></span>'
    + '<span class="dapp-addr" id="dappAddr" style="display:none"></span>'
    + '<button class="dapp-connect" id="dappConnectBtn">Connect Wallet</button>'
    + '</div>';
  document.body.insertBefore(bar, document.body.firstChild);

  document.getElementById('dappConnectBtn').addEventListener('click', connect);

  async function connect() {
    if (!window.ethereum) {
      alert('MetaMask or a Web3 wallet is required.');
      return;
    }
    try {
      var provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      var signer = await provider.getSigner();
      var address = await signer.getAddress();
      var network = await provider.getNetwork();
      var balance = await provider.getBalance(address);

      state.address = address;
      state.balance = balance;
      state.chainId = Number(network.chainId);
      state.provider = provider;
      state.signer = signer;

      updateUI();

      // Wrong chain? Prompt switch
      if (state.chainId !== QF_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x' + QF_CHAIN_ID.toString(16),
              chainName: 'QF Network',
              nativeCurrency: { name: 'QF', symbol: 'QF', decimals: 18 },
              rpcUrls: ['https://archive.mainnet.qfnode.net/eth']
            }]
          });
        } catch(e) { /* user rejected */ }
      }

      window.ethereum.on('accountsChanged', function() { location.reload(); });
      window.ethereum.on('chainChanged', function() { location.reload(); });
    } catch(e) {
      console.error('Wallet connect failed:', e);
    }
  }

  function updateUI() {
    if (!state.address) return;
    document.getElementById('dappConnectBtn').style.display = 'none';
    var addr = document.getElementById('dappAddr');
    addr.style.display = '';
    addr.textContent = state.address.slice(0,6) + '...' + state.address.slice(-4);
    var bal = document.getElementById('dappBalance');
    bal.style.display = '';
    bal.textContent = parseFloat(ethers.formatEther(state.balance)).toFixed(2) + ' QF';
  }

  // Auto-connect
  if (window.ethereum && window.ethereum.selectedAddress) connect();

  // Public API
  window.dappWallet = {
    get address() { return state.address; },
    get balance() { return state.balance; },
    get signer() { return state.signer; },
    get provider() { return state.provider; },
    get chainId() { return state.chainId; },
    isConnected: function() { return !!state.address; },
    connect: connect
  };
})();
