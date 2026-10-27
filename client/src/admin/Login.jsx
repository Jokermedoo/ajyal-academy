import { useState } from 'react';
import { useSettings } from '../App';
import { api } from '../lib/api';
import usePageMeta from '../lib/usePageMeta';
import { Loader2, Lock } from 'lucide-react';

export default function Login() {
  const { setAuthed } = useSettings();
  usePageMeta('تسجيل دخول المدير');
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setErr('');
    try {
      await api.login(u, p);
      setAuthed(true);
      window.location.href = '/admin';
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <form onSubmit={submit} className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100 w-full max-w-sm">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
          <Lock size={22} />
        </div>
        <h1 className="text-2xl font-extrabold text-brand-900 mb-1">تسجيل دخول المدير</h1>
        <p className="text-sm text-slate-500 mb-6">لوحة إدارة أكاديمية أجيال</p>
        <label className="block text-sm font-medium mb-1" htmlFor="admin-user">اسم المستخدم</label>
        <input id="admin-user" autoComplete="username" required value={u} onChange={e=>setU(e.target.value)} className="w-full border rounded-xl px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brand-300" />
        <label className="block text-sm font-medium mb-1" htmlFor="admin-pass">كلمة المرور</label>
        <input id="admin-pass" type="password" autoComplete="current-password" required value={p} onChange={e=>setP(e.target.value)} className="w-full border rounded-xl px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brand-300" />
        {err && <div role="alert" className="text-red-600 text-sm mb-3">{err}</div>}
        <button disabled={loading} className="w-full inline-flex items-center justify-center gap-2 bg-brand-600 text-white py-2.5 rounded-xl font-bold hover:bg-brand-700 disabled:opacity-60">
          {loading ? <><Loader2 size={18} className="animate-spin"/> جاري الدخول...</> : 'دخول'}
        </button>
      </form>
    </div>
  );
}
