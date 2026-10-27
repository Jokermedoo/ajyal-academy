const crypto = require('crypto');

async function postJson(url, body, headers = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!res.ok) {
    const msg = data?.message || data?.error || data?.statusDescription || data?.detail || `فشل الاتصال بمزود الدفع (${res.status})`;
    const err = new Error(msg);
    err.providerResponse = data;
    err.status = res.status;
    throw err;
  }
  return data;
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a || ''), 'utf8');
  const y = Buffer.from(String(b || ''), 'utf8');
  if (!x.length || x.length !== y.length) return false;
  return crypto.timingSafeEqual(x, y);
}

function hmacHex(secret, data, algo = 'sha256') {
  return crypto.createHmac(algo, secret).update(data).digest('hex');
}

function sha256Hex(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function get(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

module.exports = { postJson, safeEqual, hmacHex, sha256Hex, get };
