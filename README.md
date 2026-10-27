# أكاديمية أجيال النموذجية — الموقع ولوحة التحكم

موقع عربي (RTL) متجاوب + لوحة إدارة متقدمة + نظام تسجيل وطلبات دفع + تكامل بوابات دفع مصرية.

- **الواجهة:** React 18 + Vite + Tailwind CSS
- **الخادم:** Express (Node.js) + JWT في httpOnly cookie
- **قاعدة البيانات والصور:** Supabase (Postgres + Storage)
- **الاستضافة:** Vercel (مجاني) + Supabase (مجاني)

> **الوضع الحالي للدفع:** الكود جاهز لـ **Paymob** و**Fawry** (و**Kashier** اختيارياً)، لكن الدفع الإلكتروني **معطّل افتراضياً** حتى تضيف مفاتيح مزود حقيقية. لا توجد صفحات دفع وهمية: عند تعطيله يُحفظ التسجيل كطلب معلّق ويؤكده المدير يدوياً.

---

## 1) هيكل المشروع

```
client/                  واجهة React (Vite)
  src/
    pages/               الصفحات العامة (الرئيسية، كورسات، تفاصيل كورس، دفع، صفحات مخصصة)
    admin/               لوحة الإدارة (lazy loaded)
      pages/             صفحات اللوحة (نظرة عامة، محتوى، تسجيلات، طلبات، تخصيص...)
      ui.jsx             مكوّنات مشتركة (جداول، نماذج، مودال، Toast)
    components/          Header / Footer / WhatsAppFloat / ErrorBoundary...
    lib/                 API client / fallback / theme / usePageMeta
server/                  Express API
  routes/                auth / public / admin / upload
  payments/              طبقة الدفع المجردة + Paymob + Fawry + Kashier
  repo.js                طبقة الوصول إلى Supabase
  validation.js          تحقق المدخلات (zod)
supabase/
  apply_all.sql          نسخة مجمّعة من كل الملفات التالية (الأسرع)
  schema.sql             الجداول الأساسية
  migrations/002_admin_payments.sql   لوحة التحكم + التسجيل + الطلبات + التخصيص
  migrations/003_access_token.sql     رمز متابعة الطلب + إعدادات جديدة
  rls.sql                تفعيل RLS (يمنع anon)
api/index.js             نقطة دخول Vercel (serverless)
```

---

## 2) إعداد Supabase (بالترتيب)

1. أنشئ مشروعاً على <https://supabase.com>.
2. في **SQL Editor** نفّذ الطريقة الأسرع — ملف واحد:
   - `supabase/apply_all.sql`

   أو نفّذ الملفات بالترتيب يدوياً:
   1. `supabase/schema.sql`
   2. `supabase/migrations/002_admin_payments.sql`
   3. `supabase/migrations/003_access_token.sql`
   4. `supabase/rls.sql`

   كل الملفات **آمنة للتشغيل أكثر من مرة** (idempotent).
3. في **Storage** أنشئ bucket باسم `uploads` واجعله **Public**.
4. من **Project Settings → API** انسخ `Project URL` و`service_role key`.

> إن لم تُنفّذ 002/003 ستظهر في لوحة التحكم رسالة حمراء «قاعدة البيانات تحتاج تحديثاً» مع أسماء الجداول الناقصة.

---

## 3) متغيرات البيئة

انسخ `.env.example` إلى `.env` واملأ القيم. **الأسرار لا تُخزَّن في قاعدة البيانات** — فقط في متغيرات بيئة الخادم.

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=سلسلة-عشوائية-طويلة
NODE_ENV=production
PUBLIC_BASE_URL=https://your-domain.com

# أول مدير — يُستخدم مرة واحدة عند تنفيذ seed
ADMIN_USERNAME=admin
ADMIN_PASSWORD=كلمة-مرور-قوية-8-أحرف-على-الأقل

PAYMOB_API_KEY=
PAYMOB_INTEGRATION_ID_CARD=
PAYMOB_INTEGRATION_ID_WALLET=
PAYMOB_IFRAME_ID=
PAYMOB_HMAC_SECRET=

FAWRY_MERCHANT_CODE=
FAWRY_SECURITY_KEY=
FAWRY_MODE=sandbox

KASHIER_MERCHANT_ID=
KASHIER_API_KEY=
KASHIER_SECRET_KEY=
KASHIER_MODE=test
```

توليد `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## 4) التشغيل للتطوير

```bash
npm install
npm --prefix client install
npm run dev
```

- الخادم: <http://localhost:4000>
- الواجهة: <http://localhost:5173> (بروكسي `/api` إلى 4000)

نسخة الإنتاج محلياً:

```bash
npm run build
npm start
# http://localhost:4000
```

---

## 5) بذر البيانات الأولية

```bash
npm run seed
```

- يُدخل **المفاتيح الناقصة فقط** في الإعدادات (لا يمسح تعديلات المدير).
- يرفع `logo.jpg` إلى Storage إن لم يكن موجوداً.
- ينشئ المواد/الأنشطة فقط إذا كانت الجداول فارغة.
- ينشئ المستخدم `ADMIN_USERNAME` (الافتراضي `admin`) بكلمة المرور من `ADMIN_PASSWORD` **فقط** إذا لم يوجد أي مستخدم.
- لا توجد كلمة مرور افتراضية داخل الكود؛ إذا كانت `ADMIN_PASSWORD` غير مضبوطة أو أقل من 8 أحرف يتوقف `seed` برسالة واضحة.

> **لا ترفع `ADMIN_PASSWORD` إلى Git.** بعد أول تسجيل دخول غيّر كلمة المرور من لوحة الإدارة → الأمان.

---

## 6) لوحة الإدارة

المسار: `/admin` — تسجيل الدخول: `/admin/login`.

| القسم | الوظائف |
|---|---|
| نظرة عامة | إحصائيات، أحدث التسجيلات والطلبات، حالة الدفع، حالة قاعدة البيانات |
| المحتوى | المواد / الأنشطة / المعرض / الكورسات (سعر، سعة، مواعيد، فتح التسجيل، SEO) |
| التسجيلات | فلترة، بحث، تغيير الحالة، ملاحظات، تصدير CSV |
| المدفوعات | كل الطلبات، أحداث الدفع، تأكيد يدوي، استرداد، حذف، **إنشاء طلب دفع** (كورس/شهري/عربون/نشاط/أخرى) مع رابط دفع للعميل |
| التخصيص | الألوان، الخط، الشعار، Favicon، الأقسام وترتيبها، الشريط الإعلاني، الصيانة |
| قوائم الموقع | روابط الهيدر والفوتر وترتيبها |
| الصفحات | الشروط، الخصوصية، الاسترجاع، أي صفحة مخصصة `/p/slug` |
| الوسائط | رفع متعدد، Alt Text، نسخ الرابط، حذف آمن من Storage |
| الإعدادات | بيانات الأكاديمية، التواصل، السوشيال، SEO، إظهار الأقسام |
| بوابات الدفع | تفعيل Paymob/Fawry/Kashier، روابط Webhooks، حالة التهيئة |
| المستخدمون | مدير / محرر، تعطيل الحساب، إعادة تعيين كلمة المرور |
| سجل التغييرات | من عدّل ماذا ومتى (آخر 200 عملية) |
| الأمان | تغيير كلمة المرور وإبطال الجلسات القديمة |

**الأدوار:**
- **مدير:** كل الصلاحيات.
- **محرر:** المحتوى والتسجيلات والإعدادات العامة، دون المستخدمين/السجل/تأكيد المدفوعات.

**التخصيص الفوري:** أي تغيير في الألوان أو الأقسام أو القوائم يظهر في الموقع مباشرة (بدون Build).

---

## 7) الدفع — Paymob + Fawry (+ Kashier اختياري)

### التدفق

```
صفحة الكورس → نموذج التسجيل → إنشاء Enrollment + Order (المبلغ من قاعدة البيانات فقط)
   → اختيار البوابة → إنشاء جلسة لدى المزود
   → صفحة المزود الآمنة (بطاقة / محفظة / رقم فوري)
   → Webhook موقّع → التحقق من التوقيع والمبلغ → تحديث الطلب والتسجيل
   → صفحة النتيجة (مع إعادة المحاولة عند الفشل)
```

### أنواع الطلبات

| النوع | الاستخدام |
|---|---|
| `course` | رسوم كورس — تُنشأ تلقائياً من صفحة الكورس |
| `monthly` | اشتراك شهري |
| `deposit` | عربون / دفعة مقدمة |
| `activity` | رسوم نشاط |
| `other` | أخرى |

من **لوحة التحكم → المدفوعات → إنشاء طلب دفع** يمكن للمدير إنشاء أي نوع، ثم نسخ رابط الدفع وإرساله للعميل. الرابط يحتوي رمز وصول خاصاً بالطلب (`access_token`) ولا يعمل بدونه.

### التفعيل

1. أضف مفاتيح المزود في متغيرات البيئة.
2. من لوحة التحكم → **بوابات الدفع**:
   - فعّل «الدفع الإلكتروني».
   - فعّل البوابة (Paymob / Fawry).
   - اختر الوضع (Sandbox/Live).
   - أضف `Site URL` الصحيح.
3. أضف روابط Webhooks في لوحة المزود:
   - `https://your-domain.com/api/payments/webhook/paymob`
   - `https://your-domain.com/api/payments/webhook/fawry`
   - `https://your-domain.com/api/payments/webhook/kashier`
4. في Paymob (iframe القديم) اضبط **Response Callback URL** داخل Integration ID على:
   - `https://your-domain.com/api/payments/return/paymob`

   هذا الرابط يتحقق من توقيع العودة ثم ينقل العميل إلى صفحة طلبه. لا يعتمد عليه لتحديث الحالة؛ **Webhook** هو المصدر الموثوق.

> **Paymob:** يتطلب حساب تاجر موثّق (KYC) + Integration ID + Iframe ID + HMAC Secret.
> **Fawry:** يتطلب Merchant Code + Security Key، ووضع Sandbox/Live.
> **Kashier:** اختياري — راجع صيغة توقيع Webhook مع مزودك قبل الإنتاج.

### الأمان

- بيانات البطاقة لا تمر على خادمنا إطلاقاً (Hosted Iframe / صفحة المزود).
- التحقق من **HMAC** لكل Webhook، ورفض غير الموقّع.
- التحقق من أن المبلغ المدفوع = مبلغ الطلب في قاعدة البيانات.
- **Idempotency:** الطلب المدفوع لا يُحدَّث مرتين.
- كل حدث يُسجَّل في `payment_events` مع حالة التوقيع.
- Rate Limit على التسجيل والدفع ومتابعة الطلب.
- رمز وصول عشوائي لمتابعة حالة الطلب (لا يمكن تخمين رقم الطلب فقط).

---

## 8) النشر على Vercel

1. ارفع المشروع إلى GitHub.
2. في Vercel: **Add New → Project** واختر المستودع.
3. الإعدادات تُقرأ من `vercel.json` (Install: `npm install && npm --prefix client install`، Build: `npm run build`، Output: `public`).
4. أضف كل متغيرات البيئة في **Settings → Environment Variables**.
5. Deploy.
6. بعد النشر حدّث النطاق في:
   - `client/index.html` (canonical + OG)
   - `client/public/robots.txt`
   - `client/public/sitemap.xml`
   - إعداد `site_url` من لوحة التحكم

---

## 9) قائمة اختبار قبل التسليم

- [ ] كل روابط الهيدر/الفوتر/الأزرار تعمل.
- [ ] تسجيل طالب → يظهر في اللوحة → تغيير الحالة.
- [ ] كورس مدفوع → طلب معلّق → تأكيد يدوي → تسجيل «مؤكد».
- [ ] دفع Sandbox ناجح → Webhook → حالة «مدفوع» تلقائياً.
- [ ] Webhook مكرر لا يضاعف العملية.
- [ ] Webhook بتوقيع خاطئ → 400.
- [ ] محاولة دفع بمبلغ مختلف → مرفوضة.
- [ ] صلاحيات المدير/المحرر.
- [ ] الموبايل + RTL + Lighthouse ≥ 90.
- [ ] لا أخطاء Console، ولا 404 داخلي.
- [ ] نسخة احتياطية من Supabase تعمل.

---

## 10) قائمة أمان إلزامية

- [ ] تدوير `service_role key` إذا تمت مشاركته.
- [ ] تعيين `ADMIN_PASSWORD` قوية قبل أول `npm run seed`، وتغييرها دورياً من `/admin/security`.
- [ ] التأكد من تنفيذ `supabase/rls.sql` بعد كل migrations.
- [ ] التأكد من أن `.env` غير متعقّب في Git (`git check-ignore -v .env`).
- [ ] تفعيل 2FA على Supabase وGitHub وVercel.
- [ ] مراجعة سجل التغييرات دورياً.

---

## 11) استكشاف الأخطاء

| المشكلة | الحل |
|---|---|
| «قاعدة البيانات تحتاج تحديثاً» | نفّذ `supabase/apply_all.sql` في Supabase SQL Editor (أو 002 ثم 003 ثم rls.sql) |
| `Bucket not found` | أنشئ bucket باسم `uploads` واجعله Public |
| `JWT_SECRET is required in production` | أضف المتغير في `.env` أو Vercel |
| `ADMIN_PASSWORD is required` | أضف `ADMIN_PASSWORD` (8 أحرف على الأقل) في `.env` ثم أعد `npm run seed` |
| فشل تسجيل الدخول | تحقق من `SUPABASE_URL` و`service_role key`، ونفّذ `npm run seed` |
| الصور لا تظهر | تأكد أن bucket عام وأن رابط الصورة صحيح |
| خطأ 401 بعد تغيير كلمة المرور | طبيعي — سجّل الدخول من جديد |
| أزرار الدفع لا تظهر | فعّل الدفع + بوابة من اللوحة، وأضف مفاتيحها في البيئة |
| Webhook 400 | تحقق من `HMAC_SECRET` / `FAWRY_SECURITY_KEY` ومن رابط الموقع |
| إطار Paymob لا يظهر | تحقق من `frame-src` في `vercel.json` ومن `PAYMOB_IFRAME_ID` |

---

## 12) ملاحظات

- كل البيانات المعروضة عن الأكاديمية مصدرها صفحاتها على فيسبوك؛ لا بيانات مُختلقة.
- لا توجد صفحات دفع وهمية؛ الدفع الحقيقي فقط بعد تهيئة المفاتيح.
- `npm run seed` آمن للتكرار ولا يمسح تعديلات المدير.
