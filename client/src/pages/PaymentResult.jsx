import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock3, XCircle, AlertCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { useSettings } from '../App';
import usePageMeta from '../lib/usePageMeta';

const money = (cents, currency = 'EGP') => new Intl.NumberFormat('ar-EG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(cents || 0) / 100);

const STATUS = {
  paid: { label: 'مدفوع', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  pending: { label: 'بانتظار الدفع', icon: Clock3, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  failed: { label: 'فشل الدفع', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  cancelled: { label: 'ملغي', icon: XCircle, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
  refunded: { label: 'مسترد', icon: AlertCircle, color: 'text-brand-600', bg: 'bg-brand-50 border-brand-200' },
};

export default function PaymentResult() {
  const { orderNumber } = useParams();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const { payments } = useSettings();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState('');
  const [notice, setNotice] = useState('');

  usePageMeta('حالة الطلب');

  const load = () => {
    api.getOrder(orderNumber, token).then(setOrder).catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
    const id = setInterval(() => {
      api.getOrder(orderNumber, token).then((o) => {
        setOrder(o);
        if (o.status !== 'pending') clearInterval(id);
      }).catch(() => {});
    }, 6000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber, token]);

  const pay = async (provider) => {
    if (paying) return;
    setPaying(provider); setNotice('');
    try {
      const res = await api.startCheckout(order.order_number, provider, token);
      if (res.redirect_url) { window.location.href = res.redirect_url; return; }
      setNotice(res.instructions || 'تم إنشاء طلب الدفع، يرجى إكمال العملية.');
    } catch (e) { setNotice(e.message); }
    finally { setPaying(''); }
  };

  if (error) {
    return (
      <section className="max-w-2xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="mx-auto text-amber-500" size={46}/>
        <h1 className="mt-4 text-2xl font-extrabold text-brand-900">{error}</h1>
        <Link to="/courses" className="inline-flex items-center gap-2 mt-6 text-brand-600 font-bold hover:underline"><ArrowRight size={18}/> العودة للكورسات</Link>
      </section>
    );
  }
  if (!order) return <div className="text-center py-20 text-slate-500">جاري تحميل حالة الطلب...</div>;

  const meta = STATUS[order.status] || STATUS.pending;
  const Icon = meta.icon;

  return (
    <section className="max-w-2xl mx-auto px-4 py-12">
      <div className={`rounded-3xl border p-6 md:p-10 text-center ${meta.bg}`}>
        <Icon className={`mx-auto ${meta.color}`} size={56}/>
        <h1 className={`mt-4 text-2xl md:text-3xl font-extrabold ${meta.color}`}>{meta.label}</h1>
        <p className="mt-2 text-slate-600">{order.course_title || order.description}</p>
        <div className="mt-6 inline-flex flex-wrap justify-center gap-6 bg-white/70 rounded-2xl px-6 py-4 text-sm">
          <div>
            <div className="text-xs text-slate-500">رقم الطلب</div>
            <div className="font-mono font-bold" dir="ltr">{order.order_number}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">المبلغ</div>
            <div className="font-bold">{money(order.amount_cents, order.currency)}</div>
          </div>
          {order.provider && (
            <div>
              <div className="text-xs text-slate-500">بوابة الدفع</div>
              <div className="font-bold capitalize">{order.provider}</div>
            </div>
          )}
        </div>

        {['pending', 'failed', 'cancelled'].includes(order.status) && payments?.online_enabled && (
          <div className="mt-6">
            {payments.mode === 'sandbox' && (
              <div className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 rounded-full px-2.5 py-1 mb-3">
                وضع تجريبي (Sandbox) — لا يتم خصم مبالغ حقيقية
              </div>
            )}
            <div className="text-sm text-slate-600 mb-3">
              {order.status === 'pending' ? 'لم يكتمل الدفع بعد. يمكنك المحاولة عبر:' : 'يمكنك إعادة محاولة الدفع عبر:'}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {payments.providers.map(p => (
                <button key={p.id} onClick={()=>pay(p.id)} disabled={!!paying} className="inline-flex items-center gap-2 bg-white border-2 border-brand-200 text-brand-800 px-4 py-2.5 rounded-xl font-bold hover:border-brand-500 disabled:opacity-60">
                  {paying === p.id ? <Loader2 size={16} className="animate-spin"/> : <ShieldCheck size={16}/>} {p.label}
                </button>
              ))}
            </div>
            {notice && <div className="mt-3 text-sm bg-white border border-slate-200 rounded-xl px-4 py-3">{notice}</div>}
          </div>
        )}

        {order.status === 'pending' && !payments?.online_enabled && (
          <p className="mt-6 text-sm text-slate-600">
            الدفع الإلكتروني غير مفعّل حالياً. سيتواصل معك فريق الأكاديمية لتأكيد التسجيل وترتيب الدفع.
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/courses" className="inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-bold hover:border-brand-300"><ArrowRight size={16}/> الكورسات</Link>
          <Link to="/contact" className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-brand-700">تواصل معنا</Link>
        </div>
      </div>
    </section>
  );
}
