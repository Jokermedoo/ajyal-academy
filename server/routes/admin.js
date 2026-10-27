const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const repo = require('../repo');
const supabase = require('../supabase');
const { requireAuth } = require('../auth');
const { fail } = require('../errors');
const {
  validate,
  subjectSchema, subjectUpdateSchema,
  activitySchema, activityUpdateSchema,
  gallerySchema, galleryUpdateSchema,
  courseSchema, courseUpdateSchema,
  navSchema, navUpdateSchema,
  sectionUpdateSchema,
  pageSchema, pageUpdateSchema,
  mediaSchema,
  enrollmentUpdateSchema,
  orderSchema, orderUpdateSchema,
  userCreateSchema, userUpdateSchema,
  settingsSchema, passwordSchema,
  ENROLLMENT_STATUS, ORDER_STATUS,
} = require('../validation');
const { paymentStatus } = require('../payments');

const router = express.Router();
router.use(requireAuth);

function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.user?.role || 'admin';
    if (!roles.includes(role)) return res.status(403).json({ error: 'ليس لديك صلاحية لهذا الإجراء' });
    next();
  };
}

function audit(req, action, entity, entityId, details) {
  return repo.logAudit(req.user, action, entity, entityId, details);
}

function handleDbError(res, e, fallback = 'تعذر تنفيذ العملية') {
  if (e?.code === '23505') return res.status(409).json({ error: 'هذه القيمة موجودة بالفعل' });
  if (e?.code === '23503') return res.status(409).json({ error: 'لا يمكن الحذف لوجود بيانات مرتبطة' });
  console.error('[admin-api]', e?.message || e);
  return res.status(500).json({ error: process.env.NODE_ENV === 'production' ? fallback : (e?.message || fallback) });
}

router.get('/me', (req, res) => {
  res.json({ id: req.user.id, username: req.user.username, role: req.user.role || 'admin' });
});

// ---- Dashboard ----
router.get('/stats', async (req, res) => {
  try {
    const [stats, payments] = await Promise.all([repo.getAdminStats(), paymentStatus()]);
    res.json({ ...stats, payments });
  } catch (e) { fail(res, e); }
});

// ---- Settings ----
router.get('/settings', async (req, res) => {
  try { res.json(await repo.getSettings()); } catch (e) { fail(res, e); }
});
router.put('/settings', requireRole('admin', 'editor'), validate(settingsSchema), async (req, res) => {
  try {
    const paymentKeys = Object.keys(req.body || {}).filter((k) => k.startsWith('payment_'));
    if (paymentKeys.length && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'تعديل إعدادات الدفع متاح للمدير فقط' });
    }
    await repo.updateSettings(req.body);
    await audit(req, 'update', 'settings', '', { keys: Object.keys(req.body) });
    res.json({ ok: true });
  } catch (e) { fail(res, e); }
});

router.put('/password', validate(passwordSchema), async (req, res) => {
  try {
    const { current, next } = req.body;
    const full = await repo.getUserById(req.user.id);
    if (!full || !bcrypt.compareSync(current, full.password_hash)) {
      return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
    }
    const hash = bcrypt.hashSync(next, 10);
    const { error } = await supabase.from('users').update({ password_hash: hash }).eq('id', req.user.id);
    if (error) throw error;
    await audit(req, 'update', 'password', req.user.id, {});
    res.json({ ok: true });
  } catch (e) { fail(res, e); }
});

// ---- Subjects ----
router.get('/subjects', async (req, res) => {
  try { res.json(await repo.listSubjects(false)); } catch (e) { fail(res, e); }
});
router.post('/subjects', validate(subjectSchema), async (req, res) => {
  try {
    const item = await repo.createSubject(req.body);
    await audit(req, 'create', 'subject', item.id, { title: item.title });
    res.json(item);
  } catch (e) { handleDbError(res, e); }
});
router.put('/subjects/:id', validate(subjectUpdateSchema), async (req, res) => {
  try {
    const item = await repo.updateSubject(Number(req.params.id), req.body);
    await audit(req, 'update', 'subject', item.id, { title: item.title });
    res.json(item);
  } catch (e) { handleDbError(res, e); }
});
router.delete('/subjects/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await repo.getSubject(id);
    await repo.deleteSubject(id);
    if (item?.image && !(await repo.isImageInUse(item.image))) await repo.deleteStorageFile(item.image);
    await audit(req, 'delete', 'subject', id, { title: item?.title });
    res.json({ ok: true });
  } catch (e) { handleDbError(res, e); }
});

// ---- Activities ----
router.get('/activities', async (req, res) => {
  try { res.json(await repo.listActivities(false)); } catch (e) { fail(res, e); }
});
router.post('/activities', validate(activitySchema), async (req, res) => {
  try {
    const item = await repo.createActivity(req.body);
    await audit(req, 'create', 'activity', item.id, { title: item.title });
    res.json(item);
  } catch (e) { handleDbError(res, e); }
});
router.put('/activities/:id', validate(activityUpdateSchema), async (req, res) => {
  try {
    const item = await repo.updateActivity(Number(req.params.id), req.body);
    await audit(req, 'update', 'activity', item.id, { title: item.title });
    res.json(item);
  } catch (e) { handleDbError(res, e); }
});
router.delete('/activities/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await repo.getActivity(id);
    await repo.deleteActivity(id);
    if (item?.image && !(await repo.isImageInUse(item.image))) await repo.deleteStorageFile(item.image);
    await audit(req, 'delete', 'activity', id, { title: item?.title });
    res.json({ ok: true });
  } catch (e) { handleDbError(res, e); }
});

// ---- Gallery ----
router.get('/gallery', async (req, res) => {
  try { res.json(await repo.listGallery(false)); } catch (e) { fail(res, e); }
});
router.post('/gallery', validate(gallerySchema), async (req, res) => {
  try {
    const item = await repo.createGallery(req.body);
    await audit(req, 'create', 'gallery', item.id, {});
    res.json(item);
  } catch (e) { handleDbError(res, e); }
});
router.put('/gallery/:id', validate(galleryUpdateSchema), async (req, res) => {
  try {
    const item = await repo.updateGallery(Number(req.params.id), req.body);
    await audit(req, 'update', 'gallery', item.id, {});
    res.json(item);
  } catch (e) { handleDbError(res, e); }
});
router.delete('/gallery/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await repo.getGalleryItem(id);
    await repo.deleteGallery(id);
    if (item?.image && !(await repo.isImageInUse(item.image))) await repo.deleteStorageFile(item.image);
    await audit(req, 'delete', 'gallery', id, {});
    res.json({ ok: true });
  } catch (e) { handleDbError(res, e); }
});

// ---- Courses ----
router.get('/courses', async (req, res) => {
  try { res.json(await repo.listCourses(false)); } catch (e) { fail(res, e); }
});
router.post('/courses', validate(courseSchema), async (req, res) => {
  try {
    const item = await repo.createCourse(req.body);
    await audit(req, 'create', 'course', item.id, { title: item.title });
    res.json(item);
  } catch (e) { handleDbError(res, e); }
});
router.put('/courses/:id', validate(courseUpdateSchema), async (req, res) => {
  try {
    const item = await repo.updateCourse(Number(req.params.id), req.body);
    await audit(req, 'update', 'course', item.id, { title: item.title });
    res.json(item);
  } catch (e) { handleDbError(res, e); }
});
router.delete('/courses/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await repo.getCourse(id);
    await repo.deleteCourse(id);
    if (item?.image && !(await repo.isImageInUse(item.image))) await repo.deleteStorageFile(item.image);
    await audit(req, 'delete', 'course', id, { title: item?.title });
    res.json({ ok: true });
  } catch (e) { handleDbError(res, e); }
});

// ---- Navigation ----
router.get('/navigation', async (req, res) => {
  try { res.json(await repo.listNavigation(req.query.location || null, false)); } catch (e) { fail(res, e); }
});
router.post('/navigation', validate(navSchema), async (req, res) => {
  try {
    const item = await repo.createNavigation(req.body);
    await audit(req, 'create', 'navigation', item.id, { label: item.label });
    res.json(item);
  } catch (e) { handleDbError(res, e); }
});
router.put('/navigation/:id', validate(navUpdateSchema), async (req, res) => {
  try {
    const item = await repo.updateNavigation(Number(req.params.id), req.body);
    await audit(req, 'update', 'navigation', item.id, { label: item.label });
    res.json(item);
  } catch (e) { handleDbError(res, e); }
});
router.delete('/navigation/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await repo.deleteNavigation(id);
    await audit(req, 'delete', 'navigation', id, {});
    res.json({ ok: true });
  } catch (e) { handleDbError(res, e); }
});

// ---- Site sections ----
router.get('/sections', async (req, res) => {
  try { res.json(await repo.listSections(false)); } catch (e) { fail(res, e); }
});
router.put('/sections/:id', validate(sectionUpdateSchema), async (req, res) => {
  try {
    const item = await repo.updateSection(Number(req.params.id), req.body);
    await audit(req, 'update', 'section', item.id, { key: item.key });
    res.json(item);
  } catch (e) { handleDbError(res, e); }
});

// ---- Pages ----
router.get('/pages', async (req, res) => {
  try { res.json(await repo.listPages(false)); } catch (e) { fail(res, e); }
});
router.post('/pages', validate(pageSchema), async (req, res) => {
  try {
    const item = await repo.createPage(req.body);
    await audit(req, 'create', 'page', item.id, { slug: item.slug });
    res.json(item);
  } catch (e) { handleDbError(res, e); }
});
router.put('/pages/:id', validate(pageUpdateSchema), async (req, res) => {
  try {
    const item = await repo.updatePage(Number(req.params.id), req.body);
    await audit(req, 'update', 'page', item.id, { slug: item.slug });
    res.json(item);
  } catch (e) { handleDbError(res, e); }
});
router.delete('/pages/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await repo.deletePage(id);
    await audit(req, 'delete', 'page', id, {});
    res.json({ ok: true });
  } catch (e) { handleDbError(res, e); }
});

// ---- Media ----
router.get('/media', async (req, res) => {
  try { res.json(await repo.listMedia()); } catch (e) { fail(res, e); }
});
router.post('/media', validate(mediaSchema), async (req, res) => {
  try {
    const item = await repo.createMedia(req.body);
    await audit(req, 'create', 'media', item.id, { url: item.url });
    res.json(item);
  } catch (e) { handleDbError(res, e); }
});
router.put('/media/:id', async (req, res) => {
  try {
    const item = await repo.updateMedia(Number(req.params.id), { alt: String(req.body?.alt || '').slice(0, 300) });
    await audit(req, 'update', 'media', item.id, {});
    res.json(item);
  } catch (e) { handleDbError(res, e); }
});
router.delete('/media/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await repo.getMedia(id);
    await repo.deleteMedia(id);
    if (item?.url && !(await repo.isImageInUse(item.url))) await repo.deleteStorageFile(item.url);
    await audit(req, 'delete', 'media', id, { url: item?.url });
    res.json({ ok: true });
  } catch (e) { handleDbError(res, e); }
});

// ---- Enrollments ----
router.get('/enrollments/export.csv', async (req, res) => {
  try {
    const rows = await repo.listEnrollments(req.query.status || null);
    const header = ['الرقم', 'الطالب', 'العمر', 'ولي الأمر', 'الهاتف', 'البريد', 'الكورس', 'الحالة', 'ملاحظات', 'التاريخ'];
    const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const lines = [header.map(esc).join(',')];
    for (const r of rows) {
      lines.push([
        r.id, r.student_name, r.student_age ?? '', r.guardian_name, r.phone, r.email,
        r.courses?.title || '', r.status, r.notes, r.created_at,
      ].map(esc).join(','));
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="enrollments.csv"');
    res.send('\uFEFF' + lines.join('\r\n'));
  } catch (e) { fail(res, e); }
});
router.get('/enrollments', async (req, res) => {
  try { res.json(await repo.listEnrollments(req.query.status || null)); } catch (e) { fail(res, e); }
});
router.get('/enrollments/:id', async (req, res) => {
  try { res.json(await repo.getEnrollment(Number(req.params.id))); } catch (e) { fail(res, e); }
});
router.put('/enrollments/:id', validate(enrollmentUpdateSchema), async (req, res) => {
  try {
    if (req.body.status && !ENROLLMENT_STATUS.includes(req.body.status)) {
      return res.status(400).json({ error: 'حالة غير صالحة' });
    }
    const item = await repo.updateEnrollment(Number(req.params.id), req.body);
    await audit(req, 'update', 'enrollment', item.id, { status: item.status });
    res.json(item);
  } catch (e) { handleDbError(res, e); }
});
router.delete('/enrollments/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await repo.deleteEnrollment(id);
    await audit(req, 'delete', 'enrollment', id, {});
    res.json({ ok: true });
  } catch (e) { handleDbError(res, e); }
});

// ---- Orders ----
router.post('/orders', requireRole('admin'), validate(orderSchema), async (req, res) => {
  try {
    if (!req.body.customer_name || !req.body.phone || !req.body.email) {
      return res.status(400).json({ error: 'اسم العميل ورقم الهاتف والبريد الإلكتروني مطلوبة' });
    }
    if (!(Number(req.body.amount_cents) > 0)) {
      return res.status(400).json({ error: 'المبلغ يجب أن يكون أكبر من صفر' });
    }
    const item = await repo.createOrder({
      ...req.body,
      status: 'pending',
      access_token: crypto.randomBytes(18).toString('hex'),
    });
    await audit(req, 'create', 'order', item.id, {
      order_type: item.order_type,
      amount_cents: item.amount_cents,
      customer_name: item.customer_name,
    });
    res.status(201).json(item);
  } catch (e) { handleDbError(res, e); }
});
router.get('/orders', async (req, res) => {
  try { res.json(await repo.listOrders(req.query.status || null)); } catch (e) { fail(res, e); }
});
router.get('/orders/:id', async (req, res) => {
  try { res.json(await repo.getOrder(Number(req.params.id))); } catch (e) { fail(res, e); }
});
router.get('/orders/:id/events', async (req, res) => {
  try { res.json(await repo.listPaymentEvents(Number(req.params.id))); } catch (e) { fail(res, e); }
});
router.put('/orders/:id', requireRole('admin'), validate(orderUpdateSchema), async (req, res) => {
  try {
    if (req.body.status && !ORDER_STATUS.includes(req.body.status)) {
      return res.status(400).json({ error: 'حالة غير صالحة' });
    }
    const item = await repo.updateOrder(Number(req.params.id), req.body);
    await audit(req, 'update', 'order', item.id, { status: item.status });
    res.json(item);
  } catch (e) { handleDbError(res, e); }
});
router.post('/orders/:id/mark-paid', requireRole('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const order = await repo.getOrder(id);
    if (!order) return res.status(404).json({ error: 'الطلب غير موجود' });
    const updated = await repo.markOrderPaid(order.order_number, 'manual', 'manual:' + req.user.username);
    await audit(req, 'update', 'order', id, { status: 'paid', method: 'manual' });
    res.json(updated);
  } catch (e) { handleDbError(res, e); }
});
router.delete('/orders/:id', requireRole('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    await repo.deleteOrder(id);
    await audit(req, 'delete', 'order', id, {});
    res.json({ ok: true });
  } catch (e) { handleDbError(res, e); }
});

// ---- Users ----
router.get('/users', requireRole('admin'), async (req, res) => {
  try { res.json(await repo.listUsers()); } catch (e) { fail(res, e); }
});
router.post('/users', requireRole('admin'), validate(userCreateSchema), async (req, res) => {
  try {
    const item = await repo.createUser({
      username: req.body.username,
      password_hash: bcrypt.hashSync(req.body.password, 10),
      role: req.body.role || 'editor',
    });
    await audit(req, 'create', 'user', item.id, { username: item.username, role: item.role });
    res.json(item);
  } catch (e) { handleDbError(res, e); }
});
router.put('/users/:id', requireRole('admin'), validate(userUpdateSchema), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const target = await repo.getUserById(id);
    if (!target) return res.status(404).json({ error: 'المستخدم غير موجود' });
    if (id === req.user.id && req.body.active === 0) {
      return res.status(400).json({ error: 'لا يمكنك تعطيل حسابك الحالي' });
    }
    if (id === req.user.id && req.body.role && req.body.role !== 'admin') {
      return res.status(400).json({ error: 'لا يمكنك إزالة صلاحية المدير عن حسابك' });
    }
    const payload = { ...req.body };
    if (payload.password) payload.password_hash = bcrypt.hashSync(payload.password, 10);
    delete payload.password;
    const item = await repo.updateUser(id, payload);
    await audit(req, 'update', 'user', id, { role: item.role, active: item.active });
    res.json(item);
  } catch (e) { handleDbError(res, e); }
});
router.delete('/users/:id', requireRole('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (id === req.user.id) return res.status(400).json({ error: 'لا يمكنك حذف حسابك الحالي' });
    const users = await repo.listUsers();
    const admins = users.filter(u => (u.role || 'admin') === 'admin' && u.active);
    if (admins.length <= 1 && admins.some(u => u.id === id)) {
      return res.status(400).json({ error: 'لا يمكن حذف آخر مدير نشط' });
    }
    await repo.deleteUser(id);
    await audit(req, 'delete', 'user', id, {});
    res.json({ ok: true });
  } catch (e) { handleDbError(res, e); }
});

// ---- Audit ----
router.get('/audit', requireRole('admin'), async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    res.json(await repo.listAudit(limit));
  } catch (e) { fail(res, e); }
});

// ---- Reorder ----
const REORDER_TABLES = new Map([
  ['subjects', 'subjects'],
  ['gallery', 'gallery'],
  ['navigation', 'navigation'],
  ['sections', 'site_sections'],
  ['courses', 'courses'],
]);
router.post('/reorder', async (req, res) => {
  try {
    const { entity, ids } = req.body || {};
    const table = REORDER_TABLES.get(entity);
    if (!table) return res.status(400).json({ error: 'نوع غير صالح' });
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'قائمة فارغة' });
    for (let i = 0; i < ids.length; i++) {
      const { error } = await supabase.from(table).update({ sort_order: i + 1 }).eq('id', Number(ids[i]));
      if (error) throw error;
    }
    await audit(req, 'reorder', entity, '', { ids });
    res.json({ ok: true });
  } catch (e) { handleDbError(res, e); }
});

// ---- Payment readiness ----
router.get('/payments/status', requireRole('admin'), async (req, res) => {
  try { res.json(await paymentStatus()); } catch (e) { fail(res, e); }
});

module.exports = router;
