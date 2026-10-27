const { postJson, safeEqual, hmacHex } = require('./utils');

// Kashier — optional third gateway, disabled by default.
// It uses the same checkout abstraction as Paymob/Fawry.
function isConfigured() {
  return !!(process.env.KASHIER_MERCHANT_ID && process.env.KASHIER_API_KEY && process.env.KASHIER_SECRET_KEY);
}

function baseUrl() {
  return process.env.KASHIER_MODE === 'live'
    ? 'https://api.kashier.io'
    : 'https://api.kashier.io'; // Kashier uses test/live keys against the same API host
}

async function createCheckout(order, settings) {
  const base = (process.env.PUBLIC_BASE_URL || settings?.site_url || 'http://localhost:4000').replace(/\/$/, '');
  const data = await postJson(`${baseUrl()}/v3/payment/sessions`, {
    merchantId: process.env.KASHIER_MERCHANT_ID,
    amount: (Number(order.amount_cents) / 100).toFixed(2),
    currency: order.currency || 'EGP',
    orderId: order.order_number,
    mode: process.env.KASHIER_MODE === 'live' ? 'live' : 'test',
    merchantRedirect: `${base}/payment/${encodeURIComponent(order.order_number)}?token=${encodeURIComponent(order.access_token || '')}`,
    serverWebhook: `${base}/api/payments/webhook/kashier`,
    allowedMethods: ['card'],
    description: order.description || 'Ajyal Academy payment',
  }, {
    Authorization: process.env.KASHIER_SECRET_KEY,
    'api-key': process.env.KASHIER_API_KEY,
  });

  const url = data?.sessionUrl || data?.data?.sessionUrl || data?.redirectUrl;
  if (!url) throw new Error('تعذر إنشاء جلسة الدفع لدى Kashier');
  return { redirect_url: url, provider_ref: data?.sessionId || data?.data?.sessionId || '', instructions: null };
}

// Kashier webhook signature = HMAC SHA256 over the values of `signatureKeys`
// (or the documented default keys) using the secret key.
function verifyWebhook(payload, query) {
  const data = payload?.data || payload || {};
  const keys = Array.isArray(data.signatureKeys) && data.signatureKeys.length
    ? data.signatureKeys
    : ['amount', 'currency', 'orderId', 'status', 'paymentMethod'];
  const secret = process.env.KASHIER_SECRET_KEY || '';
  const concatenated = keys.map((k) => String(data[k] ?? '')).join('');
  const expected = hmacHex(secret, concatenated, 'sha256');
  const received = query?.signature || payload?.signature || data.signature || '';
  const status = String(data.status || data.paymentStatus || '').toUpperCase();
  let mapped = 'pending';
  if (status === 'SUCCESS' || status === 'PAID' || status === 'CAPTURED') mapped = 'paid';
  else if (status === 'CANCELLED' || status === 'CANCELED') mapped = 'cancelled';
  else if (status === 'FAILED' || status === 'DECLINED' || status === 'EXPIRED') mapped = 'failed';

  return {
    valid: !!secret && !!received && safeEqual(expected, received),
    orderNumber: data.orderId || data.merchantOrderId || '',
    status: mapped,
    providerRef: data.transactionId || data.paymentId || '',
    eventType: 'kashier.' + (status || 'callback'),
    amountCents: data.amount != null ? Math.round(Number(data.amount) * 100) : null,
  };
}

module.exports = { id: 'kashier', label: 'Kashier', isConfigured, createCheckout, verifyWebhook };
