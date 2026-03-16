/**
 * MathsWins Access Restoration Worker
 * api.mathswins.co.uk
 *
 * Lets users who have cleared localStorage (or switched device) request
 * a magic-link email.  The link carries a signed, single-use token that
 * the frontend redeems to restore every product the customer has paid for.
 *
 * Endpoints
 *   POST /request   — send magic link to the supplied email
 *   GET  /verify    — redeem a token, return purchased products
 *
 * Environment bindings
 *   STRIPE_SECRET_KEY   — Stripe secret key (restricted to read-only customers/charges)
 *   RESEND_API_KEY      — Resend API key
 *   HMAC_SECRET         — 256-bit hex secret for HMAC-SHA256 token signing
 *   RESTORE_KV          — Cloudflare KV namespace
 */

// ---------------------------------------------------------------------------
// Product mapping — Stripe product name → localStorage shape
// ---------------------------------------------------------------------------

const ALL_COURSE_KEYS = [
  'mw_access_blackjack',
  'mw_access_poker',
  'mw_access_sports-betting',
  'mw_access_trading',
  'mw_access_roulette',
  'mw_access_craps',
  'mw_access_slots',
  'mw_access_lottery',
  'mw_access_baccarat',
  'mw_access_options',
  'mw_access_crypto-trading',
];

/**
 * Maps a Stripe product name to { key, value }.
 * Returns null for products we don't recognise (e.g. Card Counter subscription).
 */
function mapProduct(productName) {
  if (!productName) return null;

  const name = productName.trim();

  // Premium — lifetime or annual
  if (/^MathsWins Premium/i.test(name)) {
    return { key: 'mw_premium', value: 'true', premium: true };
  }

  // All Access Pass
  if (/^All Access Pass$/i.test(name)) {
    return { key: 'mw_access_all', value: 'true', allAccess: true };
  }

  // Tiered courses — product name contains a tier suffix like "Basic", "Advanced", etc.
  const tieredPatterns = [
    { regex: /^Blackjack Academy\s*[–—:-]?\s*(.+)$/i, key: 'mw_access_blackjack' },
    { regex: /^Poker School\s*[–—:-]?\s*(.+)$/i, key: 'mw_access_poker' },
    { regex: /^Sports Betting Maths\s*[–—:-]?\s*(.+)$/i, key: 'mw_access_sports-betting' },
    { regex: /^Trading Maths\s*[–—:-]?\s*(.+)$/i, key: 'mw_access_trading' },
    { regex: /^Options Maths\s*[–—:-]?\s*(.+)$/i, key: 'mw_access_options' },
    { regex: /^Crypto Trading Maths\s*[–—:-]?\s*(.+)$/i, key: 'mw_access_crypto-trading' },
  ];

  for (const { regex, key } of tieredPatterns) {
    const match = name.match(regex);
    if (match) {
      const tierName = match[1].trim().toLowerCase(); // e.g. "basic", "advanced", "master", "pro"
      return { key, value: tierName };
    }
  }

  // Fixed-price (single tier) courses
  const fixedCourses = {
    'Roulette Reality Check': 'mw_access_roulette',
    'Craps Decoded': 'mw_access_craps',
    'Slots: The Ugly Truth': 'mw_access_slots',
    'Lottery Maths': 'mw_access_lottery',
    'Baccarat Breakdown': 'mw_access_baccarat',
  };

  for (const [productKey, lsKey] of Object.entries(fixedCourses)) {
    if (name.toLowerCase() === productKey.toLowerCase()) {
      return { key: lsKey, value: 'true' };
    }
  }

  return null; // Unknown product (Card Counter sub, etc.)
}

// ---------------------------------------------------------------------------
// Crypto helpers (Web Crypto API — available in Workers)
// ---------------------------------------------------------------------------

async function importHmacKey(secret) {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function signToken(payload, secret) {
  const key = await importHmacKey(secret);
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const sig = await crypto.subtle.sign('HMAC', key, data);
  const sigHex = [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  // Token = base64url(payload).sigHex
  const payloadB64 = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${payloadB64}.${sigHex}`;
}

async function verifyToken(token, secret) {
  const dotIndex = token.lastIndexOf('.');
  if (dotIndex === -1) return null;

  const payloadB64 = token.substring(0, dotIndex);
  const sigHex = token.substring(dotIndex + 1);

  // Decode payload
  const padded = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
  let payloadJson;
  try {
    payloadJson = atob(padded);
  } catch {
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(payloadJson);
  } catch {
    return null;
  }

  // Verify signature
  const key = await importHmacKey(secret);
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const expectedSig = await crypto.subtle.sign('HMAC', key, data);
  const expectedHex = [...new Uint8Array(expectedSig)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time comparison
  if (sigHex.length !== expectedHex.length) return null;
  let mismatch = 0;
  for (let i = 0; i < sigHex.length; i++) {
    mismatch |= sigHex.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  }
  if (mismatch !== 0) return null;

  // Check expiry
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now > payload.exp) return null;

  return payload;
}

// ---------------------------------------------------------------------------
// SHA-256 hash for single-use token tracking
// ---------------------------------------------------------------------------

async function sha256(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const ALLOWED_ORIGINS = [
  'https://mathswins.co.uk',
  'https://www.mathswins.co.uk',
];

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function jsonResponse(body, status, request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(request),
    },
  });
}

// ---------------------------------------------------------------------------
// Stripe helpers
// ---------------------------------------------------------------------------

async function stripeGet(path, params, apiKey) {
  const url = new URL(`https://api.stripe.com/v1/${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const resp = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Stripe ${path} ${resp.status}: ${text}`);
  }
  return resp.json();
}

/**
 * Look up every paid product for a given email address.
 * Returns an array of { key, value } localStorage entries.
 */
async function lookupPurchases(email, stripeKey) {
  // Find customer(s) by email
  const customers = await stripeGet('customers', { email, limit: '100' }, stripeKey);
  if (!customers.data || customers.data.length === 0) {
    return { products: [], isPremium: false, isAllAccess: false };
  }

  const products = new Map(); // key → value (higher tier wins)
  let isPremium = false;
  let isAllAccess = false;

  // Tier hierarchy for upgrade-only merging
  const tierRank = { basic: 1, advanced: 2, master: 3, pro: 4 };

  for (const customer of customers.data) {
    // Get all completed checkout sessions for this customer
    let hasMore = true;
    let startingAfter = undefined;

    while (hasMore) {
      const params = {
        customer: customer.id,
        status: 'complete',
        limit: '100',
      };
      if (startingAfter) params.starting_after = startingAfter;

      const sessions = await stripeGet('checkout/sessions', params, stripeKey);

      for (const session of sessions.data) {
        // Only count paid sessions
        if (session.payment_status !== 'paid') continue;

        // Expand line items for this session
        const lineItems = await stripeGet(
          `checkout/sessions/${session.id}/line_items`,
          { limit: '100' },
          stripeKey,
        );

        for (const item of lineItems.data) {
          const productName = item.description || (item.price && item.price.product && item.price.product.name);
          const mapped = mapProduct(productName);
          if (!mapped) continue;

          if (mapped.premium) {
            isPremium = true;
            continue;
          }
          if (mapped.allAccess) {
            isAllAccess = true;
            continue;
          }

          // Merge: keep higher tier
          const existing = products.get(mapped.key);
          if (!existing) {
            products.set(mapped.key, mapped.value);
          } else {
            const existingRank = tierRank[existing] || 0;
            const newRank = tierRank[mapped.value] || 0;
            if (newRank > existingRank) {
              products.set(mapped.key, mapped.value);
            }
          }
        }
      }

      hasMore = sessions.has_more;
      if (hasMore && sessions.data.length > 0) {
        startingAfter = sessions.data[sessions.data.length - 1].id;
      }
    }
  }

  return { products, isPremium, isAllAccess };
}

/**
 * Build the final product list to embed in the token.
 * Premium and All Access set ALL course keys.
 */
function buildProductList(purchaseResult) {
  const { products, isPremium, isAllAccess } = purchaseResult;
  const result = [];

  if (isPremium) {
    result.push({ key: 'mw_premium', value: 'true' });
  }

  if (isPremium || isAllAccess) {
    // Unlock everything
    if (isAllAccess) {
      result.push({ key: 'mw_access_all', value: 'true' });
    }
    for (const courseKey of ALL_COURSE_KEYS) {
      // For premium/all-access, use the highest tier the user actually bought
      // (if they bought a specific tier), otherwise default to "true"
      const existing = products.get(courseKey);
      result.push({ key: courseKey, value: existing || 'true' });
    }
  } else {
    // Individual purchases only
    for (const [key, value] of products) {
      result.push({ key, value });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Rate limiting (KV-based, 3 requests per email per hour)
// ---------------------------------------------------------------------------

async function checkRateLimit(email, kv) {
  const key = `rl:${email.toLowerCase()}`;
  const raw = await kv.get(key);

  const now = Math.floor(Date.now() / 1000);

  if (!raw) {
    // First request — store count and window start
    await kv.put(key, JSON.stringify({ count: 1, windowStart: now }), {
      expirationTtl: 3600,
    });
    return true; // allowed
  }

  const data = JSON.parse(raw);

  // If the window has expired (shouldn't happen with TTL, but be safe)
  if (now - data.windowStart >= 3600) {
    await kv.put(key, JSON.stringify({ count: 1, windowStart: now }), {
      expirationTtl: 3600,
    });
    return true;
  }

  if (data.count >= 3) {
    return false; // rate limited
  }

  data.count += 1;
  const remainingTtl = 3600 - (now - data.windowStart);
  await kv.put(key, JSON.stringify(data), {
    expirationTtl: Math.max(remainingTtl, 60),
  });
  return true;
}

// ---------------------------------------------------------------------------
// Email via Resend
// ---------------------------------------------------------------------------

async function sendMagicLinkEmail(email, token, resendKey) {
  const magicLink = `https://mathswins.co.uk/restore/?token=${encodeURIComponent(token)}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">MathsWins</h1>
            <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;font-weight:400;">Access Restoration</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;color:#1e293b;font-size:16px;line-height:1.6;">
              You requested to restore your MathsWins purchases. Click the button below to re-activate your access on this device.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
              <tr><td align="center">
                <a href="${magicLink}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:600;letter-spacing:0.2px;">
                  Restore My Access
                </a>
              </td></tr>
            </table>
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;line-height:1.5;">
              This link expires in <strong>1 hour</strong> and can only be used once.
            </p>
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;line-height:1.5;">
              If you didn't request this, you can safely ignore this email.
            </p>
            <!-- Fallback URL -->
            <div style="margin:24px 0 0;padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
              <p style="margin:0 0 6px;color:#64748b;font-size:12px;">If the button doesn't work, copy and paste this link:</p>
              <p style="margin:0;color:#2563eb;font-size:12px;word-break:break-all;">${magicLink}</p>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 28px;border-top:1px solid #f1f5f9;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              &copy; ${new Date().getFullYear()} MathsWins &middot; mathswins.co.uk
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'MathsWins <noreply@mathswins.co.uk>',
      to: [email],
      subject: 'Restore your MathsWins access',
      html,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Resend API ${resp.status}: ${text}`);
  }
}

// ---------------------------------------------------------------------------
// POST /request handler
// ---------------------------------------------------------------------------

async function handleRequest(request, env) {
  // Always return the same shape to prevent email enumeration
  const GENERIC_RESPONSE = {
    ok: true,
    message: 'If that email has purchases, a restore link has been sent. Please check your inbox (and spam folder).',
  };

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400, request);
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!email || !email.includes('@') || email.length > 320) {
    return jsonResponse({ ok: false, error: 'Please provide a valid email address.' }, 400, request);
  }

  // Rate limit check
  const allowed = await checkRateLimit(email, env.RESTORE_KV);
  if (!allowed) {
    // Still return generic message — don't reveal rate limit hit vs. no purchases
    return jsonResponse(GENERIC_RESPONSE, 200, request);
  }

  try {
    // Look up purchases in Stripe
    const purchaseResult = await lookupPurchases(email, env.STRIPE_SECRET_KEY);
    const productList = buildProductList(purchaseResult);

    // If user has no purchases, still return generic message (anti-enumeration)
    if (productList.length === 0) {
      return jsonResponse(GENERIC_RESPONSE, 200, request);
    }

    // Build and sign token
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      email,
      products: productList,
      premium: purchaseResult.isPremium,
      iat: now,
      exp: now + 3600, // 1 hour
    };
    const token = await signToken(payload, env.HMAC_SECRET);

    // Send email
    await sendMagicLinkEmail(email, token, env.RESEND_API_KEY);
  } catch (err) {
    // Log the error but still return generic response to the user
    console.error('Error processing restore request:', err.message, err.stack);
  }

  return jsonResponse(GENERIC_RESPONSE, 200, request);
}

// ---------------------------------------------------------------------------
// GET /verify handler
// ---------------------------------------------------------------------------

async function handleVerify(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return jsonResponse({ ok: false, error: 'Missing token.' }, 400, request);
  }

  // Verify signature and expiry
  const payload = await verifyToken(token, env.HMAC_SECRET);
  if (!payload) {
    return jsonResponse({ ok: false, error: 'Invalid or expired token.' }, 401, request);
  }

  // Single-use check: hash the token and check KV
  const tokenHash = await sha256(token);
  const consumed = await env.RESTORE_KV.get(`used:${tokenHash}`);
  if (consumed) {
    return jsonResponse({ ok: false, error: 'This link has already been used.' }, 410, request);
  }

  // Mark as consumed (TTL = remaining expiry time, at least 60s)
  const now = Math.floor(Date.now() / 1000);
  const remainingTtl = Math.max(payload.exp - now, 60);
  await env.RESTORE_KV.put(`used:${tokenHash}`, '1', {
    expirationTtl: remainingTtl,
  });

  return jsonResponse(
    {
      ok: true,
      email: payload.email,
      products: payload.products,
      premium: payload.premium,
    },
    200,
    request,
  );
}

// ---------------------------------------------------------------------------
// Worker entrypoint
// ---------------------------------------------------------------------------

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request),
      });
    }

    // Routing
    if (url.pathname === '/request' && request.method === 'POST') {
      return handleRequest(request, env);
    }

    if (url.pathname === '/verify' && request.method === 'GET') {
      return handleVerify(request, env);
    }

    // Health check
    if (url.pathname === '/' && request.method === 'GET') {
      return jsonResponse({ status: 'ok', service: 'MathsWins Access Restoration' }, 200, request);
    }

    return jsonResponse({ ok: false, error: 'Not found.' }, 404, request);
  },
};
