/**
 * MathsWins Auth Module
 * Include on any page: <script src="/auth/mw-auth.js"></script>
 *
 * Provides:
 *   - Google Sign-In button (renders into #mw-auth-container or creates floating button)
 *   - Session management (localStorage mw_session token)
 *   - Automatic purchase restoration on login
 *   - mwAuth global object for programmatic access
 *
 * Requires GOOGLE_CLIENT_ID to be set (injected below or via data attribute on the script tag).
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
  // Purchase flags — set localStorage access keys from product list
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
      // Clear individual course keys
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
    if (user) {
      setCachedUser(user);
    }
    notifyListeners();
    updateUI();
  }

  // ---------------------------------------------------------------------------
  // Google Sign-In callback
  // ---------------------------------------------------------------------------

  function handleGoogleCredential(response) {
    apiPost('/auth/google', { credential: response.credential })
      .then(function (data) {
        if (!data.ok) throw new Error(data.error || 'Auth failed');

        // Store session
        setSession(data.session);

        // Apply purchase flags to localStorage
        applyPurchases(data.products, data.premium);

        // Update state
        setUser({
          email: data.user.email,
          name: data.user.name,
          picture: data.user.picture,
          products: data.products,
          premium: data.premium,
        });

        // Reload page to apply access changes
        window.location.reload();
      })
      .catch(function (err) {
        console.error('[mw-auth] Google sign-in failed:', err);
      });
  }

  // Expose globally for Google's callback
  window.mwAuthGoogleCallback = handleGoogleCredential;

  // ---------------------------------------------------------------------------
  // Session restoration on page load
  // ---------------------------------------------------------------------------

  function restoreSession() {
    var token = getSession();
    if (!token) {
      // Try cached user for instant UI (will be validated when they interact)
      var cached = getCachedUser();
      if (cached) {
        currentUser = cached;
        updateUI();
      }
      return;
    }

    // Verify session with server
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
        // Session expired/invalid — clear it but keep purchase flags
        // (they'll be re-validated on next sign-in)
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
  // Refresh purchases (call after a new Stripe purchase)
  // ---------------------------------------------------------------------------

  function refreshPurchases() {
    var token = getSession();
    if (!token) return Promise.reject(new Error('Not signed in'));

    return apiPost('/auth/refresh-purchases', {}, token)
      .then(function (data) {
        if (!data.ok) throw new Error(data.error || 'Refresh failed');

        // Update session token
        setSession(data.session);

        // Apply new purchase flags
        applyPurchases(data.products, data.premium);

        // Update state
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
  // UI — renders sign-in button or user avatar
  // ---------------------------------------------------------------------------

  function createAuthUI() {
    // Look for explicit container
    var container = document.getElementById('mw-auth-container');
    if (!container) {
      // Create a floating auth button in top-right
      container = document.createElement('div');
      container.id = 'mw-auth-container';
      container.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:9999;';
      document.body.appendChild(container);
    }
    return container;
  }

  function updateUI() {
    var container = document.getElementById('mw-auth-container');
    if (!container) return;

    if (currentUser) {
      // Show user info + sign out
      var initial = (currentUser.name || currentUser.email || '?').charAt(0).toUpperCase();
      var pic = currentUser.picture
        ? '<img src="' + currentUser.picture + '" style="width:32px;height:32px;border-radius:50%;border:2px solid #d4a847;" referrerpolicy="no-referrer" alt="">'
        : '<div style="width:32px;height:32px;border-radius:50%;background:#d4a847;color:#050709;display:flex;align-items:center;justify-content:center;font-family:Outfit,sans-serif;font-weight:700;font-size:14px;">' + initial + '</div>';

      container.innerHTML =
        '<div style="display:flex;align-items:center;gap:8px;background:#0a0d14;border:1px solid #1e2638;border-radius:8px;padding:6px 12px 6px 8px;">' +
          pic +
          '<div style="font-family:Outfit,sans-serif;font-size:.8rem;">' +
            '<div style="color:#e8ecf4;font-weight:600;">' + escapeHtml(currentUser.name || currentUser.email) + '</div>' +
            '<button id="mw-signout-btn" style="background:none;border:none;color:#4a5568;font-family:Outfit,sans-serif;font-size:.7rem;cursor:pointer;padding:0;">Sign out</button>' +
          '</div>' +
        '</div>';

      var signOutBtn = document.getElementById('mw-signout-btn');
      if (signOutBtn) {
        signOutBtn.addEventListener('click', signOut);
      }

      // Hide buy sections when logged in with purchases
      hideBuySectionIfOwned();
    } else if (GOOGLE_CLIENT_ID) {
      // Show Google Sign-In button
      container.innerHTML =
        '<div id="mw-g-signin-btn"></div>';

      // Render Google button if GIS is loaded
      if (window.google && window.google.accounts) {
        renderGoogleButton();
      }
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

  function hideBuySectionIfOwned() {
    // Hide buy section if user owns this course
    var buySection = document.getElementById('mw-buy-section');
    if (buySection) {
      var slug = getPageSlug();
      if (slug) {
        var hasAccess = localStorage.getItem('mw_access_' + slug) ||
                        localStorage.getItem('mw_access_all') ||
                        localStorage.getItem('mw_premium');
        if (hasAccess) {
          buySection.style.display = 'none';
        }
      }
    }

    // Unlock locked modules
    var hasAnyAccess = false;
    var slug = getPageSlug();
    if (slug) {
      hasAnyAccess = localStorage.getItem('mw_access_' + slug) ||
                     localStorage.getItem('mw_access_all') ||
                     localStorage.getItem('mw_premium');
    }
    if (hasAnyAccess) {
      document.querySelectorAll('.mc.locked').forEach(function (el) {
        el.classList.remove('locked');
      });
    }
  }

  function getPageSlug() {
    // Extract course slug from URL path: /academy/baccarat/ → baccarat
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
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      renderGoogleButton();
    };
    document.head.appendChild(script);
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------

  function init() {
    // Create UI container
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        createAuthUI();
        updateUI();
        loadGoogleGIS();
      });
    } else {
      createAuthUI();
      updateUI();
      loadGoogleGIS();
    }

    // Restore session
    restoreSession();
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  window.mwAuth = {
    /** Get current user or null */
    getUser: function () { return currentUser; },

    /** Is user signed in? */
    isSignedIn: function () { return !!currentUser; },

    /** Does current user have access to a specific course slug? */
    hasAccess: function (slug) {
      return !!(
        localStorage.getItem('mw_access_' + slug) ||
        localStorage.getItem('mw_access_all') ||
        localStorage.getItem('mw_premium')
      );
    },

    /** Sign out and clear all data */
    signOut: signOut,

    /** Force refresh purchases from Stripe (call after new purchase) */
    refreshPurchases: refreshPurchases,

    /** Register a callback for auth state changes: fn(user|null) */
    onAuthChange: function (fn) {
      listeners.push(fn);
      // Immediately fire with current state
      fn(currentUser);
    },
  };

  init();
})();
