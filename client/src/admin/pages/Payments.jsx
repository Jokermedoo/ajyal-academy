import { useEffect, useState } from 'react';
import { Save, ShieldCheck, AlertTriangle, Copy, CheckCircle2, XCircle, Wallet } from 'lucide-react';
import { api } from '../../lib/api';
import { useSettings } from '../../App';
import { Card, PageHeader, Button, Field, Spinner, Badge, useToast } from '../ui';

const ENV_KEYS = {
  paymob: ['PAYMOB_API_KEY', 'PAYMOB_INTEGRATION_ID_CARD', 'PAYMOB_IFRAME_ID', 'PAYMOB_HMAC_SECRET'],
  fawry: ['FAWRY_MERCHANT_CODE', 'FAWRY_SECURITY_KEY', 'FAWRY_MODE'],
  kashier: ['KASHIER_MERCHANT_ID', 'KASHIER_API_KEY', 'KASHIER_SECRET_KEY', 'KASHIER_MODE'],
};

export default function Payments() {
  const toast = useToast();
  const { refreshSettings } = useSettings();
  const [settings, setSettings] = useState(null);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadStatus = () => api.paymentsStatus().then(setStatus).catch((e) => toast(e.message, 'error'));

  useEffect(() => {
    api.adminSettings().then(setSettings).catch((e) => toast(e.message, 'error'));
    loadStatus();
  }, [toast]);

  const upd = (k, v) => setSettings((s) => ({ ...s, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    if (saving || !settings) return;
    setSaving(true);
    try {
      const payload = {
        payment_online: settings.payment_online === '1' ? '1' : '0',
        payment_mode: settings.payment_mode || 'sandbox',
        payment_paymob: settings.payment_paymob === '1' ? '1' : '0',
        payment_fawry: settings.payment_fawry === '1' ? '1' : '0',
        payment_kashier: settings.payment_kashier === '1' ? '1' : '0',
        site_url: settings.site_url || '',
      };
      await api.updateSettings(payload);
      await Promise.all([refreshSettings(), loadStatus()]);
      toast('تم حفظ إعدادات الدفع');
    } catch (err) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); toast('تم النسخ'); }
    catch { toast('تعذر النسخ', 'error'); }
  };

  if (!settings || !status) return <Spinner />;

  const base = (settings.site_url || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');
  const webhooks = [
    ['Paymob', `${base}/api/payments/webhook/paymob`],
    ['Fawry', `${base}/api/payments/webhook/fawry`],
    ['Kashier', `${base}/api/payments/webhook/kashier`],
  ];
  const returnUrls = [
    ['Paymob', `${base}/api/payments/return/paymob`],
  ];

  return (
    <form onSubmit={save} className="space-y-5">
      <PageHeader title="بوابات الدفع" description="Paymob وFawry (وبوابة Kashier اختيارية) — الدفع الآمن عبر صفحات المزود." actions={<Button type="submit" icon={Save} loading={saving}>حفظ</Button>} />

      <div className={status.online_enabled ? 'bg-green-50 border border-green-200 text-green-900 rounded-2xl p-4 text-sm flex gap-2' : 'bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 text-sm flex gap-2'}>
        {status.online_enabled ? <ShieldCheck size={18} className="mt-0.5 shrink-0" /> : <AlertTriangle size={18} className="mt-0.5 shrink-0" />}
        <div>
          {status.online_enabled
            ? <p>الدفع الإلكتروني <strong>مفعّل</strong> — الوضع الحالي: <strong>{status.mode === 'live' ? 'إنتاج (Live)' : 'Sandbox تجريبي'}</strong>. تأكد من إعداد Webhooks لدى المزود بالروابط أدناه.</p>
            : <p>الدفع الإلكتروني <strong>غير مفعّل</strong>. لن تظهر أزرار الدفع للزوار، وتبقى التسجيلات كطلبات معلّقة يمكن تأكيدها يدوياً.</p>}
        </div>
      </div>

      <Card className="p-5">
        <h2 className="font-extrabold text-brand-900 mb-4 flex items-center gap-2"><Wallet size={18} /> الإعدادات العامة</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="تفعيل الدفع الإلكتروني" type="checkbox" value={settings.payment_online === '1'} onChange={(v) => upd('payment_online', v ? '1' : '0')} help="يتطلب بوابة واحدة مفعّلة ومهيأة على الأقل." />
          <Field label="وضع التشغيل" type="select" value={settings.payment_mode || 'sandbox'} onChange={(v) => upd('payment_mode', v)}
            options={[{ value: 'sandbox', label: 'Sandbox (تجريبي)' }, { value: 'live', label: 'Live (إنتاج حقيقي)' }]}
            help="وضع العرض فقط — المفاتيح الفعلية تحدد البيئة الحقيقية لكل مزود." />
          <Field label="رابط الموقع (Site URL)" value={settings.site_url || ''} onChange={(v) => upd('site_url', v)} dir="ltr" help="مطلوب لروابط Webhooks والعودة بعد الدفع." />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-extrabold text-brand-900 mb-1">البوابات</h2>
        <p className="text-sm text-slate-500 mb-4">المفاتيح تُضاف في متغيرات بيئة الخادم (Vercel Environment Variables) ولا تُخزَّن في قاعدة البيانات.</p>
        <div className="space-y-3">
          {status.providers.map((p) => (
            <div key={p.id} className="border border-slate-100 rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-bold text-slate-800">{p.label}</div>
                <Badge tone={p.configured ? 'green' : 'red'}>{p.configured ? 'المفاتيح مهيأة' : 'المفاتيح غير مهيأة'}</Badge>
                <Badge tone={p.available ? 'green' : 'slate'}>{p.available ? 'متاحة للزوار' : 'غير متاحة'}</Badge>
                <label className="mr-auto flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input type="checkbox" className="w-4 h-4 accent-brand-600" checked={settings['payment_' + p.id] === '1'} onChange={(e) => upd('payment_' + p.id, e.target.checked ? '1' : '0')} />
                  تفعيل
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {ENV_KEYS[p.id].map((k) => <code key={k} className="text-[10px] bg-slate-100 text-slate-600 rounded px-1.5 py-1" dir="ltr">{k}</code>)}
              </div>
              {p.id === 'paymob' && <p className="text-[11px] text-slate-500 mt-2">الدفع بالبطاقات عبر Paymob. تكامل المحافظ يحتاج Integration ID منفصلاً وإضافة زر المحفظة في الواجهة.</p>}
              {p.id === 'fawry' && <p className="text-[11px] text-slate-500 mt-2">دفع نقدي برقم مرجعي في منافذ فوري وتطبيق myFawry.</p>}
              {p.id === 'kashier' && <p className="text-[11px] text-slate-500 mt-2">بوابة اختيارية — تتطلب تأكيد صيغة التوقيع مع Kashier قبل الإنتاج.</p>}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-extrabold text-brand-900 mb-1">روابط Webhooks</h2>
        <p className="text-sm text-slate-500 mb-3">أضف هذه الروابط في لوحة كل مزود. تعمل فقط بعد نشر الموقع على HTTPS.</p>
        <div className="space-y-2">
          {webhooks.map(([label, url]) => (
            <div key={label} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
              <span className="text-xs font-bold text-slate-600 w-16 shrink-0">{label}</span>
              <code className="text-[11px] text-slate-600 truncate flex-1" dir="ltr">{url}</code>
              <button type="button" onClick={() => copy(url)} className="p-1.5 text-slate-400 hover:text-brand-700" title="نسخ"><Copy size={15} /></button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-extrabold text-brand-900 mb-1">روابط العودة بعد الدفع</h2>
        <p className="text-sm text-slate-500 mb-3">
          Paymob (iframe القديم) يعيد العميل إلى رابط ثابت يُضبط داخل Integration ID باسم <span dir="ltr">Response Callback URL</span>. ضع الرابط التالي هناك، ويظل Webhook هو مصدر تحديث الحالة.
        </p>
        <div className="space-y-2">
          {returnUrls.map(([label, url]) => (
            <div key={label} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
              <span className="text-xs font-bold text-slate-600 w-16 shrink-0">{label}</span>
              <code className="text-[11px] text-slate-600 truncate flex-1" dir="ltr">{url}</code>
              <button type="button" onClick={() => copy(url)} className="p-1.5 text-slate-400 hover:text-brand-700" title="نسخ"><Copy size={15} /></button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-extrabold text-brand-900 mb-3">حالة التهيئة</h2>
        <div className="space-y-2 text-sm">
          {status.providers.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              {p.configured ? <CheckCircle2 size={16} className="text-green-600" /> : <XCircle size={16} className="text-red-400" />}
              <span className="text-slate-700">{p.label}:</span>
              <span className="text-slate-500">{p.configured ? 'المفاتيح موجودة في البيئة' : 'أضف المفاتيح في متغيرات البيئة'}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-slate-400 leading-relaxed">
          ملاحظة: تفعيل الدفع الحقيقي يتطلب حساب تاجر موثّقاً (KYC) لدى Paymob/Fawry وموافقة على النشاط. حتى ذلك الحين يبقى كل شيء في وضع Sandbox أو معطلاً.
        </p>
      </Card>

      <div className="flex justify-end"><Button type="submit" icon={Save} loading={saving}>حفظ إعدادات الدفع</Button></div>
    </form>
  );
}
