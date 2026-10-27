const { postJson, safeEqual, hmacHex, get } = require('./utils');

// Paymob Accept API — sandbox and live share the same base URL.
// Sandbox/live is selected by which API key + integration IDs are provided.
const BASE = process.env.PAYMOB_BASE_URL || 'https://accept.paymob.com/api';

const HMAC_FIELDS = [
  'amount_cents', 'created_at', 'currency', 'error_occured', 'has_parent_transaction',
  'id', 'integration_id', 'is_3d_secure', 'is_auth', 'is_capture', 'is_refunded',
  'is_standalone_payment', 'is_voided', 'order.id', 'owner', 'pending',
  'source_data.pan', 'source_data.sub_type', 'source_data.type', 'success',
];

function setPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

function isConfigured() {
  return !!(process.env.PAYMOB_API_KEY && process.env.PAYMOB_INTEGRATION_ID_CARD
    && process.env.PAYMOB_IFRAME_ID && process.env.PAYMOB_HMAC_SECRET);
}

async function createCheckout(order) {
  const auth = await postJson(`${BASE}/auth/tokens`, { api_key: process.env.PAYMOB_API_KEY });
  const authToken = auth?.token;
  if (!authToken) throw new Error('تعذر الحصول على رمز Paymob');

  const paymobOrder = await postJson(`${BASE}/ecommerce/orders`, {
    auth_token: authToken,
    delivery_needed: false,
    amount_cents: Number(order.amount_cents),
    currency: order.currency || 'EGP',
    merchant_order_id: order.order_number,
    items: [],
  });

  const integrationId = order.payment_method === 'wallet'
    ? (process.env.PAYMOB_INTEGRATION_ID_WALLET || process.env.PAYMOB_INTEGRATION_ID_CARD)
    : process.env.PAYMOB_INTEGRATION_ID_CARD;

  const nameParts = String(order.customer_name || '').trim().split(/\s+/).filter(Boolean);
  const firstName = (nameParts[0] || '').slice(0, 50);
  const lastName = (nameParts.slice(1).join(' ') || firstName).slice(0, 50);

  const paymentKey = await postJson(`${BASE}/acceptance/payment_keys`, {
    auth_token: authToken,
    amount_cents: Number(order.amount_cents),
    expiration: 3600,
    order_id: paymobOrder.id,
    billing_data: {
      first_name: firstName,
      last_name: lastName,
      email: order.email,
      phone_number: order.phone,
      street: 'NA',
      building: 'NA',
      floor: 'NA',
      apartment: 'NA',
      city: 'Ismailia',
      state: 'Ismailia',
      country: 'EG',
      postal_code: 'NA',
      shipping_method: 'NA',
    },
    currency: order.currency || 'EGP',
    integration_id: Number(integrationId),
  });

  if (!paymentKey?.token) throw new Error('تعذر إنشاء جلسة الدفع لدى Paymob');

  return {
    redirect_url: `${BASE}/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey.token}`,
    provider_ref: String(paymobOrder.id),
    instructions: null,
  };
}

// Paymob sends the HMAC in the query string, and the transaction object in the body.
function verifyWebhook(payload, query) {
  const raw = payload?.obj || payload || {};
  const obj = { ...raw };
  // POST callbacks carry order.id; GET response callbacks flatten it to
  // order/order_id. Normalise both shapes before calculating the HMAC.
  if (obj.order == null && obj.order_id != null) obj.order = { id: obj.order_id };
  else if (obj.order != null && typeof obj.order !== 'object') obj.order = { id: obj.order };
  else if (obj.order && typeof obj.order === 'object' && obj.order.id == null && obj.order_id != null) {
    obj.order = { ...obj.order, id: obj.order_id };
  }
  // GET response callbacks use dotted query keys (source_data.pan, ...).
  for (const field of HMAC_FIELDS) {
    if (!field.includes('.')) continue;
    if (get(obj, field) === undefined && raw[field] !== undefined) setPath(obj, field, raw[field]);
  }
  const received = query?.hmac || payload?.hmac || '';
  const secret = process.env.PAYMOB_HMAC_SECRET || '';
  if (!secret || !received) {
    return {
      valid: false,
      orderNumber: obj?.order?.merchant_order_id || obj?.merchant_order_id || '',
      status: 'pending',
      providerRef: obj?.id ? String(obj.id) : '',
      eventType: payload?.type || 'transaction.unknown',
      amountCents: obj?.amount_cents != null ? Number(obj.amount_cents) : null,
    };
  }
  const concatenated = HMAC_FIELDS.map((f) => {
    const v = get(obj, f);
    return v === undefined || v === null ? '' : String(v);
  }).join('');
  const expected = hmacHex(secret, concatenated, 'sha512');
  const valid = safeEqual(expected, received);

  const orderNumber = obj?.order?.merchant_order_id || obj?.merchant_order_id || '';
  const success = obj?.success === true || obj?.success === 'true';
  return {
    valid,
    orderNumber,
    status: success ? 'paid' : 'failed',
    providerRef: obj?.id ? String(obj.id) : '',
    eventType: payload?.type || (success ? 'transaction.success' : 'transaction.failed'),
    amountCents: obj?.amount_cents != null ? Number(obj.amount_cents) : null,
  };
}

// The transaction response callback is a GET redirect with the transaction
// fields flattened into query parameters. Rebuild the same shape used by the
// webhook HMAC so the return URL can be trusted before we expose the order link.
function transactionFromRedirect(query = {}) {
  const obj = {};
  for (const field of HMAC_FIELDS) {
    if (field === 'order.id') continue;
    const raw = query[field];
    if (raw === undefined) continue;
    const parts = field.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = raw;
  }
  const orderId = query['order.id'] !== undefined
    ? query['order.id']
    : (query.order_id !== undefined ? query.order_id : query.order);
  if (orderId !== undefined) obj.order = { ...(obj.order || {}), id: orderId };
  if (query.merchant_order_id) obj.order = { ...(obj.order || {}), merchant_order_id: query.merchant_order_id };
  return obj;
}

function verifyRedirect(query = {}) {
  const obj = transactionFromRedirect(query);
  const result = verifyWebhook({ obj }, query);
  return {
    ...result,
    paymobOrderId: obj?.order?.id != null ? String(obj.order.id) : '',
  };
}

module.exports = {
  id: 'paymob', label: 'Paymob', isConfigured,
  createCheckout, verifyWebhook, verifyRedirect,
};
