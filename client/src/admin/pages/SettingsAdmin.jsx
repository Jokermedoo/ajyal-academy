import { useEffect, useState } from 'react';
import { Save, Globe, Share2, Search, SlidersHorizontal } from 'lucide-react';
import { api } from '../../lib/api';
import { useSettings } from '../../App';
import { Card, PageHeader, Button, Field, ImageField, Spinner, useToast } from '../ui';

export default function SettingsAdmin() {
  const toast = useToast();
  const { refreshSettings } = useSettings();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.adminSettings().then(setSettings).catch((e) => toast(e.message, 'error')); }, [toast]);

  const upd = (k, v) => setSettings((s) => ({ ...s, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    if (saving || !settings) return;
    setSaving(true);
    try {
      const keys = ['academy_name', 'short_name', 'english_name', 'slogan', 'intro', 'about', 'mission',
        'location', 'phone', 'phone_raw', 'site_url', 'facebook_1', 'facebook_2',
        'seo_title', 'seo_description', 'og_image',
        'show_subjects', 'show_activities', 'show_gallery', 'show_courses'];
      const payload = {};
      keys.forEach((k) => { payload[k] = settings[k] ?? ''; });
      await api.updateSettings(payload);
      await refreshSettings();
      toast('تم حفظ الإعدادات');
    } catch (err) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  if (!settings) return <Spinner />;

  return (
    <form onSubmit={save} className="space-y-5">
      <PageHeader title="إعدادات الموقع" description="بيانات الأكاديمية والتواصل والسوشيال وSEO." actions={<Button type="submit" icon={Save} loading={saving}>حفظ</Button>} />

      <Card className="p-5">
        <h2 className="font-extrabold text-brand-900 mb-4 flex items-center gap-2"><Globe size={18} /> بيانات الأكاديمية</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="الاسم الكامل" value={settings.academy_name || ''} onChange={(v) => upd('academy_name', v)} />
          <Field label="الاسم المختصر" value={settings.short_name || ''} onChange={(v) => upd('short_name', v)} />
          <Field label="الاسم الإنجليزي" value={settings.english_name || ''} onChange={(v) => upd('english_name', v)} />
          <Field label="الشعار النصي" value={settings.slogan || ''} onChange={(v) => upd('slogan', v)} />
          <Field label="مقدمة الهيرو" type="textarea" rows={3} value={settings.intro || ''} onChange={(v) => upd('intro', v)} className="sm:col-span-2" />
          <Field label="نبذة عن الأكاديمية" type="textarea" rows={4} value={settings.about || ''} onChange={(v) => upd('about', v)} className="sm:col-span-2" />
          <Field label="الرسالة" type="textarea" rows={3} value={settings.mission || ''} onChange={(v) => upd('mission', v)} className="sm:col-span-2" />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-extrabold text-brand-900 mb-4 flex items-center gap-2"><Share2 size={18} /> التواصل</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="الموقع الجغرافي" value={settings.location || ''} onChange={(v) => upd('location', v)} />
          <Field label="رقم الهاتف (للعرض)" value={settings.phone || ''} onChange={(v) => upd('phone', v)} dir="ltr" />
          <Field label="رقم الهاتف (دولي بدون +)" value={settings.phone_raw || ''} onChange={(v) => upd('phone_raw', v)} dir="ltr" help="مثال: 201155271647 — يُستخدم في tel وواتساب." />
          <Field label="رابط الموقع (Site URL)" value={settings.site_url || ''} onChange={(v) => upd('site_url', v)} dir="ltr" help="يُستخدم في روابط Webhooks وروابط الدفع." />
          <Field label="فيسبوك 1" value={settings.facebook_1 || ''} onChange={(v) => upd('facebook_1', v)} dir="ltr" />
          <Field label="فيسبوك 2" value={settings.facebook_2 || ''} onChange={(v) => upd('facebook_2', v)} dir="ltr" />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-extrabold text-brand-900 mb-4 flex items-center gap-2"><SlidersHorizontal size={18} /> عرض الأقسام</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            ['show_subjects', 'عرض المنهج في الرئيسية'],
            ['show_activities', 'عرض الأنشطة في الرئيسية'],
            ['show_gallery', 'عرض المعرض في الرئيسية'],
            ['show_courses', 'عرض الكورسات في الرئيسية'],
          ].map(([k, label]) => (
            <Field key={k} label={label} type="checkbox" value={settings[k] !== '0'} onChange={(v) => upd(k, v ? '1' : '0')} />
          ))}
        </div>
        <p className="text-[11px] text-slate-400 mt-2">للتحكم الكامل في ترتيب الأقسام وعناوينها استخدم صفحة «تخصيص الموقع».</p>
      </Card>

      <Card className="p-5">
        <h2 className="font-extrabold text-brand-900 mb-4 flex items-center gap-2"><Search size={18} /> SEO</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="عنوان الموقع (SEO)" value={settings.seo_title || ''} onChange={(v) => upd('seo_title', v)} />
          <Field label="وصف الموقع (SEO)" value={settings.seo_description || ''} onChange={(v) => upd('seo_description', v)} />
          <ImageField label="صورة المشاركة (OG Image)" value={settings.og_image || ''} onChange={(v) => upd('og_image', v)} className="sm:col-span-2" help="مقاس مفضل 1200×630." />
        </div>
      </Card>

      <div className="flex justify-end"><Button type="submit" icon={Save} loading={saving}>حفظ الإعدادات</Button></div>
    </form>
  );
}
