import { useState } from 'react';
import { Key, Save, ShieldAlert } from 'lucide-react';
import { api } from '../../lib/api';
import { useSettings } from '../../App';
import { Card, PageHeader, Button, Field, useToast } from '../ui';

export default function Security() {
  const toast = useToast();
  const { setAuthed } = useSettings();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setError('');
    if (next !== confirm) { setError('تأكيد كلمة المرور غير مطابق'); return; }
    if (next.length < 8) { setError('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل'); return; }
    setSaving(true);
    try {
      await api.changePassword(current, next);
      toast('تم تغيير كلمة المرور — سيتم تسجيل الخروج');
      setAuthed(false);
      setTimeout(() => { window.location.href = '/admin/login'; }, 1400);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title="الأمان" description="تغيير كلمة مرور حسابك وإدارة الجلسات." />

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <h2 className="font-extrabold text-brand-900 mb-4 flex items-center gap-2"><Key size={18} /> تغيير كلمة المرور</h2>
          <form onSubmit={submit} className="space-y-4">
            <Field label="كلمة المرور الحالية" required type="password" value={current} onChange={setCurrent} autoComplete="current-password" />
            <Field label="كلمة المرور الجديدة" required type="password" value={next} onChange={setNext} help="8 أحرف على الأقل." autoComplete="new-password" />
            <Field label="تأكيد كلمة المرور الجديدة" required type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
            {error && <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</div>}
            <Button type="submit" icon={Save} loading={saving}>تغيير كلمة المرور</Button>
          </form>
          <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
            تغيير كلمة المرور يُبطل كل الجلسات السابقة تلقائياً (بما فيها هذه الجلسة).
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="font-extrabold text-brand-900 mb-3 flex items-center gap-2"><ShieldAlert size={18} /> نصائح أمان</h2>
          <ul className="text-sm text-slate-600 space-y-2 list-disc pr-5 leading-relaxed">
            <li>استخدم كلمة مرور طويلة وفريدة لهذا الموقع فقط.</li>
            <li>لا تشارك مفاتيح الدفع (Paymob/Fawry) مع أي شخص، وهي تُضاف في متغيرات البيئة فقط.</li>
            <li>فعّل RLS في Supabase عبر تشغيل <code className="bg-slate-100 px-1 rounded text-[11px]" dir="ltr">supabase/rls.sql</code>.</li>
            <li>راجع سجل التغييرات دورياً لاكتشاف أي تعديل غير متوقع.</li>
            <li>غيّر كلمة المرور الافتراضية فور أول تسجيل دخول.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
