-- ============================================================
-- Ajyal Academy — Migration 002
-- لوحة تحكم متقدمة + تخصيص + تسجيلات + طلبات + مدفوعات
-- شغّل هذا الملف في Supabase SQL Editor بعد schema.sql
-- ============================================================

-- ---------- الكورسات ----------
alter table courses add column if not exists slug text;
alter table courses add column if not exists price_cents integer not null default 0;
alter table courses add column if not exists currency text not null default 'EGP';
alter table courses add column if not exists capacity integer not null default 0;
alter table courses add column if not exists is_open integer not null default 1;
alter table courses add column if not exists age_min integer;
alter table courses add column if not exists age_max integer;
alter table courses add column if not exists duration text not null default '';
alter table courses add column if not exists sort_order integer not null default 0;
alter table courses add column if not exists seo_title text not null default '';
alter table courses add column if not exists seo_description text not null default '';

create unique index if not exists courses_slug_key on courses (slug) where slug is not null;

-- ---------- المستخدمون ----------
alter table users add column if not exists role text not null default 'admin';
alter table users add column if not exists active integer not null default 1;
alter table users add column if not exists last_login timestamptz;
alter table users add column if not exists created_at timestamptz not null default now();

-- ---------- القائمة ----------
create table if not exists navigation (
  id bigserial primary key,
  label text not null,
  href text not null,
  location text not null default 'header',
  sort_order integer not null default 0,
  visible integer not null default 1,
  target text not null default '_self',
  created_at timestamptz not null default now()
);

create unique index if not exists navigation_location_href_key on navigation (location, href);

-- ---------- أقسام الرئيسية ----------
create table if not exists site_sections (
  id bigserial primary key,
  key text not null unique,
  title text not null default '',
  subtitle text not null default '',
  visible integer not null default 1,
  sort_order integer not null default 0,
  settings jsonb not null default '{}'::jsonb
);

-- ---------- الصفحات المخصصة ----------
create table if not exists pages (
  id bigserial primary key,
  slug text not null unique,
  title text not null,
  content text not null default '',
  seo_title text not null default '',
  seo_description text not null default '',
  visible integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- مكتبة الوسائط ----------
create table if not exists media (
  id bigserial primary key,
  url text not null,
  path text not null default '',
  alt text not null default '',
  mime text not null default '',
  size bigint not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- التسجيلات ----------
create table if not exists enrollments (
  id bigserial primary key,
  course_id bigint references courses(id) on delete set null,
  student_name text not null,
  student_age integer,
  guardian_name text not null default '',
  phone text not null,
  email text not null default '',
  notes text not null default '',
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists enrollments_course_idx on enrollments (course_id);
create index if not exists enrollments_status_idx on enrollments (status);

-- ---------- الطلبات / المدفوعات ----------
create table if not exists orders (
  id bigserial primary key,
  order_number text not null unique,
  order_type text not null default 'course',
  enrollment_id bigint references enrollments(id) on delete set null,
  course_id bigint references courses(id) on delete set null,
  description text not null default '',
  customer_name text not null default '',
  phone text not null default '',
  email text not null default '',
  amount_cents integer not null default 0,
  currency text not null default 'EGP',
  status text not null default 'pending',
  provider text,
  provider_ref text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table orders add column if not exists access_token text not null default '';

create index if not exists orders_status_idx on orders (status);
create index if not exists orders_enrollment_idx on orders (enrollment_id);

-- ---------- أحداث الدفع (Webhooks) ----------
create table if not exists payment_events (
  id bigserial primary key,
  order_id bigint references orders(id) on delete cascade,
  provider text not null,
  event_type text not null default '',
  payload jsonb not null default '{}'::jsonb,
  signature_valid boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists payment_events_order_idx on payment_events (order_id);

-- ---------- سجل التغييرات ----------
create table if not exists audit_log (
  id bigserial primary key,
  user_id bigint references users(id) on delete set null,
  username text not null default '',
  action text not null,
  entity text not null default '',
  entity_id text not null default '',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_created_idx on audit_log (created_at desc);

-- ---------- بيانات افتراضية ----------
insert into navigation (label, href, location, sort_order, visible, target) values
  ('الرئيسية', '/', 'header', 1, 1, '_self'),
  ('نبذة', '/about', 'header', 2, 1, '_self'),
  ('المنهج', '/curriculum', 'header', 3, 1, '_self'),
  ('الأنشطة', '/activities', 'header', 4, 1, '_self'),
  ('المعرض', '/gallery', 'header', 5, 1, '_self'),
  ('الكورسات', '/courses', 'header', 6, 1, '_self'),
  ('التواصل', '/contact', 'header', 7, 1, '_self')
on conflict (location, href) do nothing;

insert into site_sections (key, title, subtitle, visible, sort_order) values
  ('hero', 'تعليم اليوم، نجاح الغد.', '', 1, 1),
  ('features', 'لماذا أكاديمية أجيال؟', '', 1, 2),
  ('subjects', 'المنهج التعليمي', '', 1, 3),
  ('activities', 'الأنشطة التعليمية', '', 1, 4),
  ('gallery', 'معرض الصور', '', 1, 5),
  ('courses', 'الكورسات والدروس', '', 1, 6),
  ('cta', 'هل ترغب في معرفة المزيد؟', 'تواصل معنا الآن وسنكون سعداء بالرد على استفساراتك.', 1, 7)
on conflict (key) do nothing;

insert into pages (slug, title, content, visible) values
  ('terms', 'الشروط والأحكام', 'يرجى تعديل هذا المحتوى من لوحة التحكم قبل تفعيل الدفع.', 1),
  ('privacy', 'سياسة الخصوصية', 'يرجى تعديل هذا المحتوى من لوحة التحكم قبل تفعيل الدفع.', 1),
  ('refund', 'سياسة الاسترجاع', 'يرجى تعديل هذا المحتوى من لوحة التحكم قبل تفعيل الدفع.', 1)
on conflict (slug) do nothing;
