const repo = require('../repo');
const paymob = require('./paymob');
const fawry = require('./fawry');
const kashier = require('./kashier');

const PROVIDERS = { paymob, fawry, kashier };

function providerEnabled(settings, id) {
  return settings['payment_' + id] === '1';
}

async function paymentStatus() {
  const settings = await repo.getSettings();
  const mode = settings.payment_mode === 'live' ? 'live' : 'sandbox';
  const providers = Object.values(PROVIDERS).map((p) => {
    const configured = p.isConfigured();
    const enabled = providerEnabled(settings, p.id);
    return {
      id: p.id,
      label: p.label,
      configured,
      enabled,
      available: configured && enabled,
    };
  });
  const online_enabled = settings.payment_online === '1' && providers.some((p) => p.available);
  return {
    online_enabled,
    mode,
    providers,
    gateway_ready: providers.some((p) => p.available),
  };
}

async function publicPaymentConfig() {
  const status = await paymentStatus();
  return {
    online_enabled: status.online_enabled,
    mode: status.mode,
    providers: status.providers
      .filter((p) => p.available)
      .map((p) => ({ id: p.id, label: p.label })),
  };
}

async function createCheckout(providerId, order) {
  const provider = PROVIDERS[providerId];
  if (!provider) throw new Error('بوابة دفع غير مدعومة');
  if (!provider.isConfigured()) throw new Error('بوابة الدفع غير مهيأة بعد');
  const settings = await repo.getSettings();
  if (!providerEnabled(settings, providerId)) throw new Error('بوابة الدفع غير مفعّلة');
  if (settings.payment_online !== '1') throw new Error('الدفع الإلكتروني غير مفعّل حالياً');
  return provider.createCheckout(order, settings);
}

function verifyWebhook(providerId, payload, query) {
  const provider = PROVIDERS[providerId];
  if (!provider) return null;
  return provider.verifyWebhook(payload, query);
}

function verifyRedirect(providerId, query) {
  const provider = PROVIDERS[providerId];
  if (!provider || typeof provider.verifyRedirect !== 'function') return null;
  return provider.verifyRedirect(query);
}

module.exports = {
  PROVIDERS,
  paymentStatus,
  publicPaymentConfig,
  createCheckout,
  verifyWebhook,
  verifyRedirect,
};
