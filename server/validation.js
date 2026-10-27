const { z } = require('zod');

const boolLike = z.union([z.boolean(), z.number().int().min(0).max(1), z.literal('0'), z.literal('1')])
  .transform(v => (v === true || v === 1 || v === '1') ? 1 : 0);

const imageLike = z.union([z.string().url('رابط الصورة غير صالح'), z.literal(''), z.null()]);

// ---- subjects ----
const subjectBase = z.object({
  title: z.string().trim().min(1, 'العنوان مطلوب').max(200),
  description: z.string().max(3000).optional(),
  icon: z.string().max(50).optional(),
  image: imageLike.optional(),
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
  visible: boolLike.optional(),
});
const subjectSchema = subjectBase.transform(d => ({
  title: d.title,
  description: d.description ?? '',
  icon: d.icon ?? 'BookOpen',
  image: d.image ?? null,
  sort_order: d.sort_order ?? 0,
  visible: d.visible ?? 1,
}));
const subjectUpdateSchema = subjectBase.partial();

// ---- activities ----
const activityBase = z.object({
  title: z.string().trim().min(1, 'العنوان مطلوب').max(200),
  description: z.string().max(3000).optional(),
  image: imageLike.optional(),
  event_date: z.string().max(100).optional(),
  visible: boolLike.optional(),
});
const activitySchema = activityBase.transform(d => ({
  title: d.title,
  description: d.description ?? '',
  image: d.image ?? null,
  event_date: d.event_date ?? '',
  visible: d.visible ?? 1,
}));
const activityUpdateSchema = activityBase.partial();

// ---- gallery ----
const galleryBase = z.object({
  image: z.string().url('رابط الصورة غير صالح'),
  caption: z.string().max(300).optional(),
  visible: boolLike.optional(),
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
});
const gallerySchema = galleryBase.transform(d => ({
  image: d.image,
  caption: d.caption ?? '',
  visible: d.visible ?? 1,
  sort_order: d.sort_order ?? 0,
}));
const galleryUpdateSchema = galleryBase.partial();

// ---- courses ----
const courseBase = z.object({
  title: z.string().trim().min(1, 'العنوان مطلوب').max(200),
  description: z.string().max(3000).optional(),
  image: imageLike.optional(),
  schedule: z.string().max(300).optional(),
  slug: z.string().trim().max(120).regex(/^[a-z0-9-]*$/i, 'الرابط يجب أن يكون حروفاً إنجليزية وأرقاماً وشرطات فقط').optional(),
  price_cents: z.coerce.number().int().min(0).max(100000000).optional(),
  currency: z.string().max(10).optional(),
  capacity: z.coerce.number().int().min(0).max(10000).optional(),
  is_open: boolLike.optional(),
  age_min: z.coerce.number().int().min(0).max(99).nullable().optional(),
  age_max: z.coerce.number().int().min(0).max(99).nullable().optional(),
  duration: z.string().max(200).optional(),
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
  seo_title: z.string().max(200).optional(),
  seo_description: z.string().max(500).optional(),
  visible: boolLike.optional(),
});
const courseSchema = courseBase.transform(d => ({
  title: d.title,
  description: d.description ?? '',
  image: d.image ?? null,
  schedule: d.schedule ?? '',
  slug: d.slug || null,
  price_cents: d.price_cents ?? 0,
  currency: d.currency || 'EGP',
  capacity: d.capacity ?? 0,
  is_open: d.is_open ?? 1,
  age_min: d.age_min ?? null,
  age_max: d.age_max ?? null,
  duration: d.duration ?? '',
  sort_order: d.sort_order ?? 0,
  seo_title: d.seo_title ?? '',
  seo_description: d.seo_description ?? '',
  visible: d.visible ?? 1,
}));
const courseUpdateSchema = courseBase.partial();

// ---- navigation ----
const navBase = z.object({
  label: z.string().trim().min(1, 'اسم الرابط مطلوب').max(100),
  href: z.string().trim().min(1, 'الرابط مطلوب').max(500),
  location: z.enum(['header', 'footer']).optional(),
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
  visible: boolLike.optional(),
  target: z.enum(['_self', '_blank']).optional(),
});
const navSchema = navBase.transform(d => ({
  label: d.label,
  href: d.href,
  location: d.location || 'header',
  sort_order: d.sort_order ?? 0,
  visible: d.visible ?? 1,
  target: d.target || '_self',
}));
const navUpdateSchema = navBase.partial();

// ---- site sections ----
const sectionUpdateSchema = z.object({
  title: z.string().max(200).optional(),
  subtitle: z.string().max(500).optional(),
  visible: boolLike.optional(),
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
  settings: z.record(z.string(), z.any()).optional(),
});

// ---- pages ----
const pageBase = z.object({
  slug: z.string().trim().min(1, 'الرابط مطلوب').max(120).regex(/^[a-z0-9-]+$/i, 'الرابط يجب أن يكون حروفاً إنجليزية وأرقاماً وشرطات فقط'),
  title: z.string().trim().min(1, 'العنوان مطلوب').max(200),
  content: z.string().max(100000).optional(),
  seo_title: z.string().max(200).optional(),
  seo_description: z.string().max(500).optional(),
  visible: boolLike.optional(),
});
const pageSchema = pageBase.transform(d => ({
  slug: d.slug,
  title: d.title,
  content: d.content ?? '',
  seo_title: d.seo_title ?? '',
  seo_description: d.seo_description ?? '',
  visible: d.visible ?? 1,
}));
const pageUpdateSchema = pageBase.partial();

// ---- media ----
const mediaSchema = z.object({
  url: z.string().url('رابط الصورة غير صالح'),
  path: z.string().max(500).optional(),
  alt: z.string().max(300).optional(),
  mime: z.string().max(100).optional(),
  size: z.coerce.number().int().min(0).optional(),
});

// ---- enrollments ----
const ENROLLMENT_STATUS = ['new', 'contacted', 'confirmed', 'cancelled', 'completed'];
const enrollmentBase = z.object({
  course_id: z.coerce.number().int().positive('الكورس مطلوب'),
  student_name: z.string().trim().min(2, 'اسم الطالب مطلوب').max(150),
  student_age: z.coerce.number().int().min(2, 'العمر غير صالح').max(99).optional(),
  guardian_name: z.string().max(150).optional(),
  phone: z.string().trim().min(7, 'رقم الهاتف مطلوب').max(30),
  email: z.union([z.string().email('البريد الإلكتروني غير صالح'), z.literal('')]).optional(),
  notes: z.string().max(2000).optional(),
});
const enrollmentSchema = enrollmentBase.transform(d => ({
  course_id: d.course_id,
  student_name: d.student_name,
  student_age: d.student_age ?? null,
  guardian_name: d.guardian_name ?? '',
  phone: d.phone,
  email: d.email ?? '',
  notes: d.notes ?? '',
}));
const enrollmentUpdateSchema = enrollmentBase.partial().extend({
  status: z.enum(ENROLLMENT_STATUS).optional(),
});

// ---- orders ----
const ORDER_TYPES = ['course', 'monthly', 'deposit', 'activity', 'other'];
const ORDER_STATUS = ['pending', 'paid', 'failed', 'cancelled', 'refunded'];
const orderBase = z.object({
  order_type: z.enum(ORDER_TYPES).optional(),
  enrollment_id: z.coerce.number().int().positive().nullable().optional(),
  course_id: z.coerce.number().int().positive().nullable().optional(),
  description: z.string().max(500).optional(),
  customer_name: z.string().max(150).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().max(200).optional(),
  amount_cents: z.coerce.number().int().min(0).max(100000000).optional(),
  currency: z.string().max(10).optional(),
  status: z.enum(ORDER_STATUS).optional(),
});
const orderSchema = orderBase.transform(d => ({
  order_type: d.order_type || 'course',
  enrollment_id: d.enrollment_id ?? null,
  course_id: d.course_id ?? null,
  description: d.description ?? '',
  customer_name: d.customer_name ?? '',
  phone: d.phone ?? '',
  email: d.email ?? '',
  amount_cents: d.amount_cents ?? 0,
  currency: d.currency || 'EGP',
  status: d.status || 'pending',
}));
const orderUpdateSchema = orderBase.partial().extend({
  provider: z.string().max(50).nullable().optional(),
  provider_ref: z.string().max(200).nullable().optional(),
});

// ---- users ----
const userCreateSchema = z.object({
  username: z.string().trim().min(3, 'اسم المستخدم قصير').max(80).regex(/^[a-zA-Z0-9._-]+$/, 'اسم المستخدم غير صالح'),
  password: z.string().min(8, 'كلمة المرور 8 أحرف على الأقل').max(200),
  role: z.enum(['admin', 'editor']).optional(),
});
const userUpdateSchema = z.object({
  password: z.string().min(8, 'كلمة المرور 8 أحرف على الأقل').max(200).optional(),
  role: z.enum(['admin', 'editor']).optional(),
  active: boolLike.optional(),
});

// ---- settings / auth ----
const settingsSchema = z.record(z.string().min(1).max(80), z.union([z.string().max(5000), z.number(), z.boolean()]));

const loginSchema = z.object({
  username: z.string().min(1).max(80),
  password: z.string().min(1).max(200),
});

const passwordSchema = z.object({
  current: z.string().min(1).max(200),
  next: z.string().min(8, 'كلمة المرور الجديدة قصيرة (8 أحرف على الأقل)').max(200),
});

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body || {});
    if (!result.success) {
      const raw = result.error.issues?.[0]?.message;
      const msg = raw && /[\u0600-\u06FF]/.test(raw) ? raw : 'بيانات غير صالحة';
      return res.status(400).json({ error: msg });
    }
    req.body = result.data;
    next();
  };
}

module.exports = {
  validate,
  subjectSchema, subjectUpdateSchema,
  activitySchema, activityUpdateSchema,
  gallerySchema, galleryUpdateSchema,
  courseSchema, courseUpdateSchema,
  navSchema, navUpdateSchema,
  sectionUpdateSchema,
  pageSchema, pageUpdateSchema,
  mediaSchema,
  enrollmentSchema, enrollmentUpdateSchema,
  orderSchema, orderUpdateSchema,
  userCreateSchema, userUpdateSchema,
  settingsSchema, loginSchema, passwordSchema,
  ENROLLMENT_STATUS, ORDER_TYPES, ORDER_STATUS,
};
