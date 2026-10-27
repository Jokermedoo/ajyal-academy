import { useEffect, useState } from 'react';
import { Save, ChevronUp, ChevronDown, Palette, LayoutList, Eye, EyeOff } from 'lucide-react';
import { api } from '../../lib/api';
import { useSettings } from '../../App';
import { Card, PageHeader, Button, Field, ImageField, Spinner, useToast, Badge } from '../ui';

const SECTION_LABELS = {
  hero: 'القسم الرئيسي (Hero)',
  features: 'لماذا أجيال',
  subjects: 'المنهج',
  activities: 'الأنشطة',
  gallery: 'المعرض',
  courses: 'الكورسات',
  cta: 'دعوة للتواصل',
};

const FONTS = [
  { value: 'Tajawal', label: 'Tajawal (الافتراضي)' },
  { value: 'Cairo', label: 'Cairo' },
  { value: 'Almarai', label: 'Almarai' },
  { value: 'Noto Kufi Arabic', label: 'Noto Kufi Arabic' },
];

export default function Appearance() {
  const toast = useToast();
  const { refreshSettings } = useSettings();
  const [settings, setSettings] = useState(null);
  const [sections, setSections] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingSection, setSavingSection] = useState(0);

  useEffect(() => {
    api.adminSettings().then(setSettings).catch((e) => toast(e.message, 'error'));
    api.adminSections().then(setSections).catch((e) => { toast(e.message, 'error'); setSections([]); });
  }, [toast]);

  const upd = (k, v) => setSettings((s) => ({ ...s, [k]: v }));

  const save = async (e) => {
    e?.preventDefault?.();
    if (saving || !settings) return;
    setSaving(true);
    try {
      const keys = ['primary_color', 'secondary_color', 'font_family', 'hero_image', 'favicon_url', 'hero_badge',
        'announcement_enabled', 'announcement_text', 'whatsapp_float', 'maintenance_mode', 'maintenance_message'];
      const payload = {};
      keys.forEach((k) => { payload[k] = settings[k] ?? ''; });
      await api.updateSettings(payload);
      await refreshSettings();
      toast('تم حفظ التخصيص وتطبيقه على الموقع');
    } catch (err) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const saveSection = async (sec) => {
    setSavingSection(sec.id);
    try {
      await api.updateSection(sec.id, { title: sec.title, subtitle: sec.subtitle, visible: sec.visible ? 1 : 0 });
      await refreshSettings();
      toast('تم حفظ القسم');
    } catch (e) { toast(e.message, 'error'); }
    finally { setSavingSection(0); }
  };

  const moveSection = async (index, dir) => {
    const next = [...sections];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
    try { await api.reorder('sections', next.map((s) => s.id)); await refreshSettings(); }
    catch (e) { toast(e.message, 'error'); api.adminSections().then(setSections); }
  };

  if (!settings || !sections) return <Spinner />;

  return (
    <div>
      <PageHeader title="تخصيص الموقع" description="الهوية والألوان وأقسام الصفحة الرئيسية — تُطبَّق فوراً على الموقع." />

      <form onSubmit={save} className="space-y-5">
        <Card className="p-5">
          <h2 className="font-extrabold text-brand-900 mb-4 flex items-center gap-2"><Palette size={18} /> الهوية البصرية</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="اللون الأساسي" type="color" value={settings.primary_color || '#1e6fe6'} onChange={(v) => upd('primary_color', v)} help="يُستخدم في الأزرار والروابط والعناصر الرئيسية." />
            <Field label="اللون الثانوي" type="color" value={settings.secondary_color || '#f97316'} onChange={(v) => upd('secondary_color', v)} help="يُستخدم في التدرجات واللمسات الجمالية." />
            <Field label="الخط" type="select" options={FONTS} value={settings.font_family || 'Tajawal'} onChange={(v) => upd('font_family', v)} />
            <Field label="شارة الهيرو" value={settings.hero_badge || ''} onChange={(v) => upd('hero_badge', v)} placeholder="🦋 جيل ذو أثر" />
            <ImageField label="شعار الموقع (Logo)" value={settings.hero_image || ''} onChange={(v) => upd('hero_image', v)} />
            <ImageField label="أيقونة الموقع (Favicon)" value={settings.favicon_url || ''} onChange={(v) => upd('favicon_url', v)} help="PNG أو SVG أو ICO — يفضّل 512×512." />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-extrabold text-brand-900 mb-4">الشريط الإعلاني والواجهة</h2>
          <div className="space-y-3">
            <Field label="إظهار شريط إعلاني أعلى الموقع" type="checkbox" value={settings.announcement_enabled === '1'} onChange={(v) => upd('announcement_enabled', v ? '1' : '0')} />
            <Field label="نص الشريط الإعلاني" value={settings.announcement_text || ''} onChange={(v) => upd('announcement_text', v)} placeholder="مثال: التسجيل مفتوح للعام الدراسي الجديد" />
            <Field label="إظهار زر واتساب العائم" type="checkbox" value={settings.whatsapp_float !== '0'} onChange={(v) => upd('whatsapp_float', v ? '1' : '0')} />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-extrabold text-brand-900 mb-4">وضع الصيانة</h2>
          <div className="space-y-3">
            <Field label="تفعيل وضع الصيانة (يخفي الموقع عن الزوار)" type="checkbox" value={settings.maintenance_mode === '1'} onChange={(v) => upd('maintenance_mode', v ? '1' : '0')} />
            <Field label="رسالة الصيانة" type="textarea" rows={2} value={settings.maintenance_message || ''} onChange={(v) => upd('maintenance_message', v)} placeholder="الموقع تحت الصيانة حالياً، نعود قريباً بإذن الله." />
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">لوحة التحكم تبقى متاحة أثناء الصيانة عبر /admin.</p>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" icon={Save} loading={saving}>حفظ التخصيص</Button>
        </div>
      </form>

      <Card className="p-5 mt-6">
        <div className="flex items-center gap-2 mb-1">
          <LayoutList size={18} className="text-brand-600" />
          <h2 className="font-extrabold text-brand-900">أقسام الصفحة الرئيسية</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">رتّب الأقسام، عدّل عناوينها، أو أخفِ أي قسم من الصفحة الرئيسية.</p>
        {sections.length === 0 && (
          <div className="mb-3 text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-3">
            أقسام الصفحة الرئيسية غير مهيأة بعد. شغّل <code className="bg-white/70 px-1 rounded" dir="ltr">supabase/migrations/002_admin_payments.sql</code> في Supabase SQL Editor ثم أعد تحميل الصفحة.
          </div>
        )}
        <div className="space-y-3">
          {sections.map((sec, i) => (
            <div key={sec.id} className="border border-slate-100 rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="flex flex-col gap-0.5">
                  <button type="button" onClick={() => moveSection(i, -1)} disabled={i === 0} className="text-slate-300 hover:text-brand-600 disabled:opacity-30" aria-label="أعلى"><ChevronUp size={15} /></button>
                  <button type="button" onClick={() => moveSection(i, 1)} disabled={i === sections.length - 1} className="text-slate-300 hover:text-brand-600 disabled:opacity-30" aria-label="أسفل"><ChevronDown size={15} /></button>
                </div>
                <div className="font-bold text-slate-800 text-sm">{SECTION_LABELS[sec.key] || sec.key}</div>
                <Badge tone={sec.visible ? 'green' : 'slate'}>{sec.visible ? 'ظاهر' : 'مخفي'}</Badge>
                <div className="mr-auto flex items-center gap-2">
                  <button type="button" onClick={() => setSections((s) => s.map((x) => x.id === sec.id ? { ...x, visible: x.visible ? 0 : 1 } : x))} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" title={sec.visible ? 'إخفاء' : 'إظهار'}>
                    {sec.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <Button size="sm" variant="secondary" loading={savingSection === sec.id} onClick={() => saveSection(sec)}>حفظ</Button>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="العنوان" value={sec.title} onChange={(v) => setSections((s) => s.map((x) => x.id === sec.id ? { ...x, title: v } : x))} />
                <Field label="الوصف" value={sec.subtitle} onChange={(v) => setSections((s) => s.map((x) => x.id === sec.id ? { ...x, subtitle: v } : x))} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
