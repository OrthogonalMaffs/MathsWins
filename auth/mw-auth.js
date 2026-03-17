/**
 * MathsWins Auth Module
 * Include on any page: <script src="/auth/mw-auth.js"></script>
 *
 * Renders a fixed top bar with Google Sign-In / user info.
 * Gates purchases behind login — buy buttons become "Sign in to purchase".
 * Manages session JWT + localStorage access flags.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  var API_BASE = 'https://mathswins-restore.jonfox78.workers.dev';
  var GOOGLE_CLIENT_ID = '1089996130721-h164od8sb2hag3l5dp6ef73vclsb24v7.apps.googleusercontent.com';
  var SESSION_KEY = 'mw_session';
  var USER_KEY = 'mw_user';

  // Allow override via script tag data attribute
  var scriptTag = document.currentScript;
  if (scriptTag) {
    if (scriptTag.dataset.api) API_BASE = scriptTag.dataset.api;
    if (scriptTag.dataset.googleClientId) GOOGLE_CLIENT_ID = scriptTag.dataset.googleClientId;
  }

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  var currentUser = null;
  var listeners = [];
  var gisLoaded = false;

  // ---------------------------------------------------------------------------
  // localStorage helpers
  // ---------------------------------------------------------------------------

  function getSession() {
    try { return localStorage.getItem(SESSION_KEY) || null; } catch (e) { return null; }
  }

  function setSession(token) {
    try { localStorage.setItem(SESSION_KEY, token); } catch (e) { /* ignore */ }
  }

  function clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) { /* ignore */ }
  }

  function getCachedUser() {
    try {
      var raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function setCachedUser(user) {
    try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch (e) { /* ignore */ }
  }

  // ---------------------------------------------------------------------------
  // Purchase flags
  // ---------------------------------------------------------------------------

  function applyPurchases(products, premium) {
    if (!products || !Array.isArray(products)) return;
    if (premium) {
      try { localStorage.setItem('mw_premium', 'true'); } catch (e) { /* ignore */ }
    }
    products.forEach(function (p) {
      try {
        if (typeof p === 'object' && p.key) {
          localStorage.setItem(p.key, p.value || 'true');
        }
      } catch (e) { /* ignore */ }
    });
  }

  function clearPurchaseFlags() {
    try {
      localStorage.removeItem('mw_premium');
      localStorage.removeItem('mw_access_all');
      var keys = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('mw_access_') === 0) keys.push(k);
      }
      keys.forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) { /* ignore */ }
  }

  // ---------------------------------------------------------------------------
  // API calls
  // ---------------------------------------------------------------------------

  function apiPost(path, body, token) {
    var headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return fetch(API_BASE + path, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    }).then(function (r) {
      if (!r.ok) throw new Error('API error ' + r.status);
      return r.json();
    });
  }

  function apiGet(path, token) {
    var headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return fetch(API_BASE + path, {
      method: 'GET',
      headers: headers,
    }).then(function (r) {
      if (!r.ok) throw new Error('API error ' + r.status);
      return r.json();
    });
  }

  // ---------------------------------------------------------------------------
  // Auth state management
  // ---------------------------------------------------------------------------

  function notifyListeners() {
    listeners.forEach(function (fn) {
      try { fn(currentUser); } catch (e) { console.error('[mw-auth] listener error:', e); }
    });
  }

  function setUser(user) {
    currentUser = user;
    if (user) setCachedUser(user);
    notifyListeners();
    updateUI();
  }

  // ---------------------------------------------------------------------------
  // Google Sign-In callback
  // ---------------------------------------------------------------------------

  function handleGoogleCredential(response) {
    // Show loading state in the bar
    var bar = document.getElementById('mw-auth-bar');
    if (bar) {
      var inner = bar.querySelector('.mw-auth-inner');
      if (inner) inner.innerHTML = '<span style="color:#d4a847;font-size:.8rem;">Signing in...</span>';
    }

    apiPost('/auth/google', { credential: response.credential })
      .then(function (data) {
        if (!data.ok) throw new Error(data.error || 'Auth failed');
        setSession(data.session);
        applyPurchases(data.products, data.premium);
        setUser({
          email: data.user.email,
          name: data.user.name,
          picture: data.user.picture,
          products: data.products,
          premium: data.premium,
        });
        window.location.reload();
      })
      .catch(function (err) {
        console.error('[mw-auth] Google sign-in failed:', err);
        updateUI();
      });
  }

  window.mwAuthGoogleCallback = handleGoogleCredential;

  // ---------------------------------------------------------------------------
  // Session restoration
  // ---------------------------------------------------------------------------

  function restoreSession() {
    var token = getSession();
    var cached = getCachedUser();

    if (cached) {
      currentUser = cached;
      updateUI();
    }

    if (!token) return;

    apiGet('/auth/session', token)
      .then(function (data) {
        if (!data.ok) throw new Error('Session invalid');
        applyPurchases(data.products, data.premium);
        setUser({
          email: data.user.email,
          name: data.user.name,
          picture: data.user.picture,
          products: data.products,
          premium: data.premium,
        });
      })
      .catch(function () {
        clearSession();
        currentUser = null;
        updateUI();
      });
  }

  // ---------------------------------------------------------------------------
  // Sign out
  // ---------------------------------------------------------------------------

  function signOut() {
    clearSession();
    clearPurchaseFlags();
    currentUser = null;
    notifyListeners();
    window.location.reload();
  }

  // ---------------------------------------------------------------------------
  // Refresh purchases
  // ---------------------------------------------------------------------------

  function refreshPurchases() {
    var token = getSession();
    if (!token) return Promise.reject(new Error('Not signed in'));

    return apiPost('/auth/refresh-purchases', {}, token)
      .then(function (data) {
        if (!data.ok) throw new Error(data.error || 'Refresh failed');
        setSession(data.session);
        applyPurchases(data.products, data.premium);
        if (currentUser) {
          currentUser.products = data.products;
          currentUser.premium = data.premium;
          setCachedUser(currentUser);
        }
        notifyListeners();
        return data;
      });
  }

  // ---------------------------------------------------------------------------
  // UI — fixed top bar
  // ---------------------------------------------------------------------------

  function injectStyles() {
    if (document.getElementById('mw-auth-styles')) return;
    var style = document.createElement('style');
    style.id = 'mw-auth-styles';
    style.textContent =
      '#mw-auth-bar{position:fixed;top:0;left:0;right:0;z-index:99999;background:#0a0d14;border-bottom:1px solid #1e2638;height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 1rem;font-family:Outfit,sans-serif;}' +
      '#mw-auth-bar .mw-auth-brand{color:#d4a847;font-family:"Bebas Neue",sans-serif;font-size:1.1rem;letter-spacing:.04em;text-decoration:none;}' +
      '#mw-auth-bar .mw-auth-inner{display:flex;align-items:center;gap:8px;}' +
      '#mw-auth-bar .mw-auth-name{color:#e8ecf4;font-weight:600;font-size:.8rem;}' +
      '#mw-auth-bar .mw-auth-signout{background:none;border:none;color:#4a5568;font-family:Outfit,sans-serif;font-size:.7rem;cursor:pointer;padding:0;}' +
      '#mw-auth-bar .mw-auth-signout:hover{color:#d4a847;}' +
      '#mw-auth-bar .mw-auth-signin-prompt{color:#4a5568;font-size:.8rem;display:flex;align-items:center;gap:8px;}' +
      '#mw-auth-bar .mw-auth-account-link{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;background:transparent;border:1px solid #d4a847;border-radius:6px;color:#d4a847;font-family:Outfit,sans-serif;font-weight:600;font-size:.8rem;text-decoration:none;transition:background .2s,color .2s;cursor:pointer;white-space:nowrap;}' +
      '#mw-auth-bar .mw-auth-account-link:hover{background:#d4a847;color:#050709;}' +
      '#mw-auth-bar .mw-auth-account-link svg{width:16px;height:16px;fill:currentColor;}' +
      'body{padding-top:44px !important;}' +
      '.mw-buy-signin-gate{text-align:center;padding:1rem;background:rgba(212,168,71,.06);border:1px solid rgba(212,168,71,.2);border-radius:8px;margin:.5rem 0;}' +
      '.mw-buy-signin-gate p{font-size:.85rem;color:#c8cdd8;margin-bottom:.75rem;}' +
      '.mw-buy-signin-gate .mw-gate-btn{display:inline-block;padding:.5rem 1.5rem;background:#d4a847;color:#050709;font-family:Outfit,sans-serif;font-weight:700;font-size:.85rem;border:none;border-radius:6px;cursor:pointer;letter-spacing:.02em;}' +
      '.mw-buy-signin-gate .mw-gate-btn:hover{opacity:.9;}';
    document.head.appendChild(style);
  }

  function createAuthBar() {
    if (document.getElementById('mw-auth-bar')) return;
    injectStyles();

    var bar = document.createElement('div');
    bar.id = 'mw-auth-bar';
    bar.innerHTML =
      '<a href="/" class="mw-auth-brand">MATHSWINS</a>' +
      '<div class="mw-auth-inner"></div>';
    document.body.insertBefore(bar, document.body.firstChild);
  }

  function updateUI() {
    var bar = document.getElementById('mw-auth-bar');
    if (!bar) return;
    var inner = bar.querySelector('.mw-auth-inner');
    if (!inner) return;

    if (currentUser) {
      // Signed in — show user info
      var initial = (currentUser.name || currentUser.email || '?').charAt(0).toUpperCase();
      var pic = currentUser.picture
        ? '<img src="' + currentUser.picture + '" style="width:28px;height:28px;border-radius:50%;border:2px solid #d4a847;" referrerpolicy="no-referrer" alt="">'
        : '<div style="width:28px;height:28px;border-radius:50%;background:#d4a847;color:#050709;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;">' + initial + '</div>';

      inner.innerHTML =
        '<a href="/account/" style="display:flex;align-items:center;gap:8px;text-decoration:none;">' +
          pic +
          '<div>' +
            '<div class="mw-auth-name">' + escapeHtml(currentUser.name || currentUser.email) + '</div>' +
            '<span style="font-size:.65rem;color:#4a5568;">My Account</span>' +
          '</div>' +
        '</a>' +
        '<button class="mw-auth-signout" id="mw-signout-btn" style="margin-left:4px;">Sign out</button>';

      document.getElementById('mw-signout-btn').addEventListener('click', signOut);

      // Show buy buttons (user is signed in)
      showBuyButtons();
      hideBuySectionIfOwned();
    } else {
      // Not signed in — show Google button only (My Account appears after sign-in)
      inner.innerHTML =
        '<div class="mw-auth-signin-prompt">' +
          '<div id="mw-g-signin-btn"></div>' +
        '</div>';

      if (gisLoaded) renderGoogleButton();

      // Gate buy buttons behind login
      gateBuyButtons();
    }
  }

  function renderGoogleButton() {
    var btnContainer = document.getElementById('mw-g-signin-btn');
    if (!btnContainer || !window.google || !window.google.accounts) return;

    google.accounts.id.renderButton(btnContainer, {
      type: 'standard',
      shape: 'pill',
      theme: 'filled_black',
      size: 'medium',
      text: 'signin',
    });
  }

  // ---------------------------------------------------------------------------
  // Purchase gating — hide buy buttons if not signed in
  // ---------------------------------------------------------------------------

  function gateSection(sectionId, gateBtnId) {
    var section = document.getElementById(sectionId);
    if (!section) return;

    // Store original content so we can restore it on sign-in
    if (!section.dataset.originalHtml) {
      section.dataset.originalHtml = section.innerHTML;
    }

    section.innerHTML =
      '<div class="mw-buy-signin-gate">' +
        '<p>Sign in with Google to unlock purchases</p>' +
        '<div id="' + gateBtnId + '"></div>' +
      '</div>';

    // Render a Google button inside the gate too
    if (gisLoaded && window.google && window.google.accounts) {
      var gateBtn = document.getElementById(gateBtnId);
      if (gateBtn) {
        google.accounts.id.renderButton(gateBtn, {
          type: 'standard',
          shape: 'pill',
          theme: 'filled_black',
          size: 'large',
          text: 'signin_with',
          width: 280,
        });
      }
    }
  }

  function gateBuyButtons() {
    gateSection('mw-buy-section', 'mw-gate-g-btn');
    gateSection('mw-premium-section', 'mw-gate-g-btn-premium');
  }

  function showBuyButtons() {
    var sections = ['mw-buy-section', 'mw-premium-section'];
    sections.forEach(function (id) {
      var section = document.getElementById(id);
      if (!section || !section.dataset.originalHtml) return;
      section.innerHTML = section.dataset.originalHtml;
    });

    // Inject promo codes into Premium payment links
    injectUpgradeCredit();
  }

  function hideBuySectionIfOwned() {
    var buySection = document.getElementById('mw-buy-section');
    if (!buySection) return;

    var slug = getPageSlug();
    if (slug) {
      var hasAccess = localStorage.getItem('mw_access_' + slug) ||
                      localStorage.getItem('mw_access_all') ||
                      localStorage.getItem('mw_premium');
      if (hasAccess) {
        buySection.style.display = 'none';
      }
    }

    // Also unlock locked modules
    if (slug) {
      var hasAnyAccess = localStorage.getItem('mw_access_' + slug) ||
                         localStorage.getItem('mw_access_all') ||
                         localStorage.getItem('mw_premium');
      if (hasAnyAccess) {
        document.querySelectorAll('.mc.locked').forEach(function (el) {
          el.classList.remove('locked');
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Inject upgrade credit promo codes into Premium payment links
  // ---------------------------------------------------------------------------

  var PREMIUM_LINK_LIFETIME = 'buy.stripe.com/28E6oA8bb8xNaN5bv3cwg0m';
  var PREMIUM_LINK_ANNUAL = 'buy.stripe.com/4gMcMY4YZdS7bR9gPncwg0n';

  function injectUpgradeCredit() {
    var token = getSession();
    if (!token) return;

    // Only fetch if there are Premium links on this page
    var allLinks = document.querySelectorAll('a[href*="buy.stripe.com"]');
    var premiumLinks = [];
    allLinks.forEach(function (a) {
      if (a.href.indexOf(PREMIUM_LINK_LIFETIME) !== -1 || a.href.indexOf(PREMIUM_LINK_ANNUAL) !== -1) {
        premiumLinks.push(a);
      }
    });
    if (premiumLinks.length === 0) return;

    apiGet('/auth/upgrade-credit', token)
      .then(function (data) {
        if (!data.ok || !data.promoCode) return;
        premiumLinks.forEach(function (a) {
          // Strip any existing promo code param
          var url = a.href.split('?')[0];
          a.href = url + '?prefilled_promo_code=' + encodeURIComponent(data.promoCode);

          // Update button text to show effective price if visible
          if (a.href.indexOf(PREMIUM_LINK_LIFETIME) !== -1 && data.lifetimeEffective < data.lifetimePrice) {
            var text = a.textContent || a.innerText;
            if (text.indexOf('149.99') !== -1) {
              a.textContent = text.replace('£149.99', '£' + data.lifetimeEffective.toFixed(2));
            }
          }
          if (a.href.indexOf(PREMIUM_LINK_ANNUAL) !== -1 && data.annualEffective < data.annualPrice) {
            var text2 = a.textContent || a.innerText;
            if (text2.indexOf('99.99') !== -1) {
              a.textContent = text2.replace('£99.99', '£' + data.annualEffective.toFixed(2));
            }
          }
        });
      })
      .catch(function () { /* silently fail — links work without promo */ });
  }

  function getPageSlug() {
    var match = window.location.pathname.match(/\/academy\/([^/]+)/);
    return match ? match[1] : null;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------------------------------------------------------------------------
  // Load Google Identity Services
  // ---------------------------------------------------------------------------

  function loadGoogleGIS() {
    if (!GOOGLE_CLIENT_ID) return;
    if (document.getElementById('mw-gis-script')) return;

    var script = document.createElement('script');
    script.id = 'mw-gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = function () {
      gisLoaded = true;
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      // Re-render UI now that GIS is ready
      updateUI();
    };
    document.head.appendChild(script);
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        createAuthBar();
        loadGoogleGIS();
        restoreSession();
      });
    } else {
      createAuthBar();
      loadGoogleGIS();
      restoreSession();
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  window.mwAuth = {
    getUser: function () { return currentUser; },
    isSignedIn: function () { return !!currentUser; },
    hasAccess: function (slug) {
      return !!(
        localStorage.getItem('mw_access_' + slug) ||
        localStorage.getItem('mw_access_all') ||
        localStorage.getItem('mw_premium')
      );
    },
    signOut: signOut,
    refreshPurchases: refreshPurchases,
    onAuthChange: function (fn) {
      listeners.push(fn);
      fn(currentUser);
    },
  };

  init();
})();
