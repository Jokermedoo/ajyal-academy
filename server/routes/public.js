const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const repo = require('../repo');
const { fail } = require('../errors');
const { validate, enrollmentSchema } = require('../validation');
const { publicPaymentConfig, createCheckout, verifyWebhook, verifyRedirect, PROVIDERS } = require('../payments');

const router = express.Router();

const enrollLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'محاولات كثيرة، يرجى المحاولة لاحقاً' },
});
const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'محاولات كثيرة، يرجى المحاولة لاحقاً' },
});
const lookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 240,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'محاولات كثيرة، يرجى المحاولة لاحقاً' },
});

function sanitizeSettings(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (k.startsWith('internal_') || k.includes('secret') || k.includes('_key')) continue;
    out[k] = v;
  }
  return out;
}

function publicOrder(order) {
  if (!order) return null;
  return {
    order_number: order.order_number,
    order_type: order.order_type,
    description: order.description,
    customer_name: order.customer_name,
    amount_cents: order.amount_cents,
    currency: order.currency,
    status: order.status,
    provider: order.provider,
    paid_at: order.paid_at,
    created_at: order.created_at,
  };
}

// ---- Bootstrap (single request for the public site) ----
// Every block is loaded independently so that a missing optional table
// (before migrations are applied) never takes the whole site down.
async function safe(promise, fallback) {
  try { return await promise; } catch { return fallback; }
}

router.get('/bootstrap', async (req, res) => {
  try {
    const [settings, navigation, sections, pages, subjects, activities, gallery, courses, payments] = await Promise.all([
      repo.getSettings(),
      safe(repo.listNavigation(null, true), []),
      safe(repo.listSections(true), []),
      safe(repo.listPages(true), []),
      safe(repo.listSubjects(true), []),
      safe(repo.listActivities(true), []),
      safe(repo.listGallery(true), []),
      safe(repo.listCourses(true), []),
      safe(publicPaymentConfig(), { online_enabled: false, mode: 'sandbox', providers: [] }),
    ]);
    res.json({
      settings: sanitizeSettings(settings),
      navigation,
      sections,
      pages: pages.map(({ id, slug, title }) => ({ id, slug, title })),
      subjects,
      activities,
      gallery,
      courses,
      payments,
    });
  } catch (e) { fail(res, e); }
});

router.get('/settings', async (req, res) => {
  try { res.json(sanitizeSettings(await repo.getSettings())); } catch (e) { fail(res, e); }
});
router.get('/subjects', async (req, res) => { try { res.json(await repo.listSubjects(true)); } catch (e) { fail(res, e); } });
router.get('/activities', async (req, res) => { try { res.json(await repo.listActivities(true)); } catch (e) { fail(res, e); } });
router.get('/gallery', async (req, res) => { try { res.json(await repo.listGallery(true)); } catch (e) { fail(res, e); } });
router.get('/courses', async (req, res) => { try { res.json(await repo.listCourses(true)); } catch (e) { fail(res, e); } });

router.get('/courses/:slug', async (req, res) => {
  try {
    const key = req.params.slug;
    let course = await repo.getCourseBySlug(key);
    if (!course && /^\d+$/.test(key)) course = await repo.getCourse(Number(key));
    if (!course || course.visible === 0) return res.status(404).json({ error: 'الكورس غير موجود' });
    const enrolled = await repo.countEnrollmentsForCourse(course.id);
    res.json({
      ...course,
      enrolled,
      seats_left: course.capacity > 0 ? Math.max(0, course.capacity - enrolled) : null,
    });
  } catch (e) { fail(res, e); }
});

router.get('/navigation', async (req, res) => {
  try { res.json(await repo.listNavigation(req.query.location || null, true)); } catch (e) { fail(res, e); }
});
router.get('/sections', async (req, res) => { try { res.json(await repo.listSections(true)); } catch (e) { fail(res, e); } });
router.get('/pages', async (req, res) => {
  try {
    const pages = await repo.listPages(true);
    res.json(pages.map(({ id, slug, title }) => ({ id, slug, title })));
  } catch (e) { fail(res, e); }
});
router.get('/pages/:slug', async (req, res) => {
  try {
    const page = await repo.getPageBySlug(req.params.slug);
    if (!page || page.visible === 0) return res.status(404).json({ error: 'الصفحة غير موجودة' });
    res.json(page);
  } catch (e) { fail(res, e); }
});

router.get('/payment-config', async (req, res) => {
  try { res.json(await publicPaymentConfig()); } catch (e) { fail(res, e); }
});

// ---- Enrollment ----
router.post('/enrollments', enrollLimiter, validate(enrollmentSchema), async (req, res) => {
  try {
    const course = await repo.getCourse(Number(req.body.course_id));
    if (!course || course.visible === 0) return res.status(404).json({ error: 'الكورس غير موجود' });
    if (course.is_open === 0) return res.status(400).json({ error: 'التسجيل في هذا الكورس مغلق حالياً' });

    if (course.capacity > 0) {
      const count = await repo.countEnrollmentsForCourse(course.id);
      if (count >= course.capacity) return res.status(409).json({ error: 'اكتمل العدد المسموح لهذا الكورس' });
    }

    const enrollment = await repo.createEnrollment({ ...req.body, course_id: course.id });

    let order = null;
    if (Number(course.price_cents) > 0) {
      order = await repo.createOrder({
        order_type: 'course',
        enrollment_id: enrollment.id,
        course_id: course.id,
        description: course.title,
        customer_name: enrollment.student_name,
        phone: enrollment.phone,
        email: enrollment.email,
        amount_cents: course.price_cents,
        currency: course.currency || 'EGP',
        status: 'pending',
        access_token: crypto.randomBytes(18).toString('hex'),
      });
      await repo.logAudit(null, 'create', 'enrollment_public', enrollment.id, { course_id: course.id });
    }

    res.status(201).json({
      enrollment: {
        id: enrollment.id,
        student_name: enrollment.student_name,
        status: enrollment.status,
        course_title: course.title,
      },
      order: order ? {
        order_number: order.order_number,
        access_token: order.access_token,
        amount_cents: order.amount_cents,
        currency: order.currency,
        status: order.status,
      } : null,
      payments: await publicPaymentConfig(),
    });
  } catch (e) { fail(res, e); }
});

// ---- Order status ----
router.get('/orders/:orderNumber', lookupLimiter, async (req, res) => {
  try {
    const order = await repo.getOrderByNumber(req.params.orderNumber);
    if (!order || !order.access_token || req.query.token !== order.access_token) {
      return res.status(404).json({ error: 'الطلب غير موجود' });
    }
    const course = order.course_id ? await repo.getCourse(order.course_id).catch(() => null) : null;
    res.json({ ...publicOrder(order), course_title: course?.title || order.description });
  } catch (e) { fail(res, e); }
});

// ---- Start checkout ----
router.post('/orders/:orderNumber/checkout', checkoutLimiter, async (req, res) => {
  try {
    const provider = String(req.body?.provider || '');
    if (!PROVIDERS[provider]) return res.status(400).json({ error: 'بوابة دفع غير مدعومة' });

    const order = await repo.getOrderByNumber(req.params.orderNumber);
    if (!order || !order.access_token || req.body?.token !== order.access_token) {
      return res.status(404).json({ error: 'الطلب غير موجود' });
    }
    if (order.status === 'paid') return res.status(400).json({ error: 'هذا الطلب مدفوع بالفعل' });
    if (!['pending', 'failed', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ error: 'لا يمكن دفع هذا الطلب في حالته الحالية' });
    }
    if (!order.customer_name || !order.phone || !order.email) {
      return res.status(400).json({ error: 'أضف اسم الطالب ورقم الهاتف والبريد الإلكتروني لإتمام الدفع الإلكتروني' });
    }

    const result = await createCheckout(provider, order);
    await repo.updateOrder(order.id, { status: 'pending', provider, provider_ref: result.provider_ref || null });
    await repo.logPaymentEvent(order.id, provider, 'checkout.created', {
      provider_ref: result.provider_ref || null,
      redirect_url: result.redirect_url || null,
    }, true);

    res.json({
      ok: true,
      provider,
      redirect_url: result.redirect_url || null,
      reference_number: result.reference_number || null,
      instructions: result.instructions || null,
    });
  } catch (e) {
    const status = e?.status && e.status >= 400 && e.status < 500 ? 400 : 500;
    fail(res, e, status);
  }
});

// ---- Webhooks (mounted at /api/payments) ----
const webhooks = express.Router();

function webhookHandler(providerId) {
  return async (req, res) => {
    try {
      const hasBody = req.body && Object.keys(req.body).length > 0;
      const payload = hasBody
        ? req.body
        : (providerId === 'paymob' ? { obj: req.query } : req.query);
      const result = verifyWebhook(providerId, payload, req.query);
      if (!result) return res.status(404).json({ error: 'مزود غير معروف' });

      const order = result.orderNumber ? await repo.getOrderByNumber(result.orderNumber) : null;
      if (order) {
        await repo.logPaymentEvent(order.id, providerId, result.eventType, {
          signature_valid: result.valid,
          amount_cents: result.amountCents,
          provider_ref: result.providerRef,
        }, result.valid);
      }

      if (!result.valid) return res.status(400).json({ error: 'توقيع غير صالح' });
      if (!order) return res.json({ ok: true, ignored: 'order-not-found' });

      if (result.amountCents != null && Number(result.amountCents) !== Number(order.amount_cents)) {
        await repo.logPaymentEvent(order.id, providerId, 'amount.mismatch', {
          expected: order.amount_cents, received: result.amountCents,
        }, true);
        return res.status(400).json({ error: 'المبلغ غير مطابق' });
      }

      if (result.status === 'paid') {
        await repo.markOrderPaid(order.order_number, providerId, result.providerRef);
      } else if (result.status !== 'pending') {
        await repo.markOrderStatus(order.order_number, result.status, providerId, result.providerRef);
      }

      res.json({ ok: true });
    } catch (e) {
      console.error('[webhook]', providerId, e?.message || e);
      res.status(500).json({ error: 'تعذر معالجة الإشعار' });
    }
  };
}

webhooks.post('/webhook/paymob', webhookHandler('paymob'));
webhooks.get('/webhook/paymob', webhookHandler('paymob'));
webhooks.post('/webhook/fawry', webhookHandler('fawry'));
webhooks.post('/webhook/kashier', webhookHandler('kashier'));

// Paymob's legacy iframe redirects the customer to the Response Callback URL
// configured on the Integration ID. Verify its HMAC, then send the customer to
// the order page with the order's private access token. The webhook remains the
// only source of truth for updating the payment status.
webhooks.get('/return/paymob', async (req, res) => {
  const fallback = '/payment-result?provider=paymob';
  try {
    const result = verifyRedirect('paymob', req.query);
    if (!result?.valid) return res.redirect(302, fallback);

    let order = result.orderNumber ? await repo.getOrderByNumber(result.orderNumber) : null;
    if (!order && result.paymobOrderId) {
      order = await repo.getOrderByProviderRef(result.paymobOrderId, 'paymob');
    }
    if (!order?.access_token) return res.redirect(302, fallback);

    const target = `/payment/${encodeURIComponent(order.order_number)}?token=${encodeURIComponent(order.access_token)}`;
    return res.redirect(302, target);
  } catch (e) {
    console.error('[payment-return]', e?.message || e);
    return res.redirect(302, fallback);
  }
});

module.exports = router;
module.exports.webhooks = webhooks;
