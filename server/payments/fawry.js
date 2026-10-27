const { postJson, safeEqual, sha256Hex } = require('./utils');

// FawryPay (Fawry) — PAYATFAWRY reference flow.
// Sandbox: https://atfawry.fawrystaging.com
// Live:    https://www.atfawry.com
function baseUrl() {
  return process.env.FAWRY_MODE === 'live'
    ? 'https://www.atfawry.com'
    : 'https://atfawry.fawrystaging.com';
}

function isConfigured() {
  return !!(process.env.FAWRY_MERCHANT_CODE && process.env.FAWRY_SECURITY_KEY);
}

function chargeSignature({ merchantCode, merchantRefNum, customerProfileId, paymentMethod, amount, currencyCode }) {
  return sha256Hex(
    String(merchantCode) + String(merchantRefNum) + String(customerProfileId)
    + String(paymentMethod) + String(amount) + String(currencyCode)
    + String(process.env.FAWRY_SECURITY_KEY)
  );
}

async function createCheckout(order) {
  const merchantCode = process.env.FAWRY_MERCHANT_CODE;
  const amount = (Number(order.amount_cents) / 100).toFixed(2);
  const customerProfileId = order.phone || order.order_number;
  const paymentMethod = 'PAYATFAWRY';

  const signature = chargeSignature({
    merchantCode,
    merchantRefNum: order.order_number,
    customerProfileId,
    paymentMethod,
    amount,
    currencyCode: order.currency || 'EGP',
  });

  const data = await postJson(`${baseUrl()}/ECommerceWeb/Fawry/payments/charge`, {
    merchantCode,
    merchantRefNum: order.order_number,
    customerProfileId,
    customerName: order.customer_name,
    customerMobile: order.phone || '',
    customerEmail: order.email || '',
    amount,
    currencyCode: order.currency || 'EGP',
    description: (order.description || 'Ajyal Academy payment').slice(0, 200),
    paymentMethod,
    signature,
  });

  if (!data?.referenceNumber) {
    throw new Error(data?.statusDescription || 'تعذر إنشاء رقم دفع فوري');
  }

  return {
    redirect_url: data.paymentUrl || null,
    provider_ref: String(data.referenceNumber),
    instructions: 'استخدم رقم المرجع التالي للدفع في أي منفذ فوري أو عبر تطبيق myFawry: ' + data.referenceNumber,
    reference_number: String(data.referenceNumber),
  };
}

// Fawry callback signature:
// sha256(fawryRefNumber + merchantRefNum + paymentAmount + orderAmount + orderStatus + paymentMethod + securityKey)
function verifyWebhook(payload) {
  const {
    fawryRefNumber, merchantRefNum, paymentAmount, orderAmount,
    orderStatus, paymentMethod, messageSignature,
  } = payload || {};

  const secret = process.env.FAWRY_SECURITY_KEY || '';
  const expected = sha256Hex(
    String(fawryRefNumber || '') + String(merchantRefNum || '') + String(paymentAmount || '')
    + String(orderAmount || '') + String(orderStatus || '') + String(paymentMethod || '')
    + secret
  );

  const status = String(orderStatus || '').toUpperCase();
  let mapped = 'pending';
  if (status === 'PAID') mapped = 'paid';
  else if (status === 'CANCELED' || status === 'CANCELLED') mapped = 'cancelled';
  else if (status === 'EXPIRED' || status === 'FAILED' || status === 'UNPAID') mapped = 'failed';

  return {
    valid: !!secret && !!messageSignature && safeEqual(expected, messageSignature),
    orderNumber: merchantRefNum || '',
    status: mapped,
    providerRef: fawryRefNumber ? String(fawryRefNumber) : '',
    eventType: 'fawry.' + (status || 'callback'),
    amountCents: paymentAmount != null && paymentAmount !== '' ? Math.round(Number(paymentAmount) * 100) : null,
  };
}

module.exports = { id: 'fawry', label: 'Fawry', isConfigured, createCheckout, verifyWebhook };
