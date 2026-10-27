-- ============================================================
-- Ajyal Academy — Migration 003
-- يضيف رمز الوصول للطلبات (لمتابعة حالة الدفع بأمان)
-- شغّله بعد 002 إن كنت قد شغّلت 002 مسبقاً.
-- ============================================================

alter table orders add column if not exists access_token text not null default '';

-- تحديث الإعدادات الجديدة إن لم تكن موجودة (لا يمس أي قيمة عدّلتها)
insert into settings (key, value) values
  ('primary_color', '#1e6fe6'),
  ('secondary_color', '#f97316'),
  ('font_family', 'Tajawal'),
  ('favicon_url', ''),
  ('site_url', 'https://ajyal-academy.vercel.app'),
  ('seo_title', 'أكاديمية أجيال النموذجية للتعليم والتطوير الشامل'),
  ('seo_description', 'أكاديمية أجيال النموذجية — تعليم اليوم، نجاح الغد. حضانة تعليمية في القصاصين الجديدة، الإسماعيلية.'),
  ('og_image', ''),
  ('hero_badge', '🦋 جيل ذو أثر'),
  ('announcement_enabled', '0'),
  ('announcement_text', ''),
  ('maintenance_mode', '0'),
  ('maintenance_message', 'الموقع تحت الصيانة حالياً، نعود قريباً بإذن الله.'),
  ('whatsapp_float', '1'),
  ('payment_online', '0'),
  ('payment_mode', 'sandbox'),
  ('payment_paymob', '0'),
  ('payment_fawry', '0'),
  ('payment_kashier', '0')
on conflict (key) do nothing;
