import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CalendarDays, Clock, GraduationCap, Loader2, CheckCircle2, AlertCircle, Users, Wallet, ShieldCheck, Phone } from 'lucide-react';
import { api } from '../lib/api';
import { useSettings } from '../App';
import usePageMeta from '../lib/usePageMeta';

const money = (cents, currency = 'EGP') => {
  const value = Number(cents || 0) / 100;
  return new Intl.NumberFormat('ar-EG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
};

const emptyForm = { student_name: '', student_age: '', guardian_name: '', phone: '', email: '', notes: '' };

export default function CourseDetail() {
  const { slug } = useParams();
  const { settings, payments } = useSettings();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [paying, setPaying] = useState('');

  usePageMeta(course?.seo_title || course?.title || 'تفاصيل الكورس', course?.seo_description || course?.description);

  useEffect(() => {
    setCourse(null); setError('');
    api.getCourse(slug).then(setCourse).catch((e) => setError(e.message));
  }, [slug]);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const paid = Number(course?.price_cents || 0) > 0;

  const submit = async (e) => {
    e.preventDefault();
    if (submitting || !course) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await api.enroll({ ...form, course_id: course.id });
      setResult(res);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const pay = async (provider) => {
    if (paying) return;
    setPaying(provider);
    setError('');
    try {
      const res = await api.startCheckout(result.order.order_number, provider, result.order.access_token);
      if (res.redirect_url) {
        window.location.href = res.redirect_url;
        return;
      }
      setCheckout(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setPaying('');
    }
  };

  if (error && !course) {
    return (
      <section className="max-w-3xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="mx-auto text-amber-500" size={44} />
        <h1 className="mt-4 text-2xl font-extrabold text-brand-900">{error}</h1>
        <Link to="/courses" className="inline-flex items-center gap-2 mt-6 text-brand-600 font-bold hover:underline">
          <ArrowRight size={18} /> العودة للكورسات
        </Link>
      </section>
    );
  }

  if (!course) {
    return <div className="text-center py-20 text-slate-500">جاري التحميل...</div>;
  }

  const seatsLeft = course.seats_left;
  const full = seatsLeft !== null && seatsLeft <= 0;
  const isOpen = course.is_open !== 0;

  return (
    <section className="max-w-5xl mx-auto px-4 py-10">
      <Link to="/courses" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-700 mb-5">
        <ArrowRight size={16} /> كل الكورسات
      </Link>

      {result ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-10">
          <div className="text-center">
            <CheckCircle2 className="mx-auto text-green-500" size={54} />
            <h1 className="mt-4 text-2xl md:text-3xl font-extrabold text-brand-900">تم استلام طلب التسجيل</h1>
            <p className="mt-2 text-slate-600">
              شكراً {result.enrollment.student_name} — تم تسجيل طلبك في كورس <strong>{result.enrollment.course_title}</strong>.
            </p>
          </div>

          {result.order ? (
            <div className="mt-8 border-t border-slate-100 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 rounded-2xl p-4">
                <div>
                  <div className="text-xs text-slate-500">رقم الطلب</div>
                  <div className="font-mono font-bold text-brand-900" dir="ltr">{result.order.order_number}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">المبلغ المستحق</div>
                  <div className="font-bold text-brand-900">{money(result.order.amount_cents, result.order.currency)}</div>
                </div>
              </div>

              {result.payments?.online_enabled && !checkout ? (
                <div className="mt-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h2 className="font-bold text-brand-900 flex items-center gap-2"><Wallet size={18}/> اختر طريقة الدفع</h2>
                    {result.payments.mode === 'sandbox' && (
                      <span className="text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 rounded-full px-2.5 py-1">وضع تجريبي (Sandbox) — لا يتم خصم مبالغ حقيقية</span>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {result.payments.providers.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => pay(p.id)}
                        disabled={!!paying}
                        className="flex items-center justify-center gap-2 border-2 border-slate-200 hover:border-brand-500 hover:bg-brand-50 rounded-2xl px-4 py-4 font-bold text-brand-800 disabled:opacity-60"
                      >
                        {paying === p.id ? <Loader2 size={18} className="animate-spin"/> : <ShieldCheck size={18}/>}
                        الدفع عبر {p.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-slate-500 flex items-center gap-1">
                    <ShieldCheck size={14}/> الدفع يتم على صفحة مزود الدفع الآمنة، ولا نحتفظ ببيانات بطاقتك.
                  </p>
                  <div className="mt-3 text-center">
                    <Link to={`/payment/${result.order.order_number}?token=${result.order.access_token}`} className="text-sm text-brand-600 font-bold hover:underline">متابعة حالة الطلب</Link>
                  </div>
                </div>
              ) : checkout ? (
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <h2 className="font-bold text-amber-900">أكمل الدفع</h2>
                  {checkout.reference_number && (
                    <p className="mt-2 text-amber-900">
                      رقم المرجع: <strong className="font-mono text-lg" dir="ltr">{checkout.reference_number}</strong>
                    </p>
                  )}
                  <p className="mt-2 text-sm text-amber-800">{checkout.instructions || 'اتبع تعليمات مزود الدفع لإتمام العملية.'}</p>
                  {checkout.redirect_url && (
                    <a href={checkout.redirect_url} className="inline-block mt-3 bg-amber-600 text-white px-4 py-2 rounded-xl font-bold">متابعة الدفع</a>
                  )}
                </div>
              ) : (
                <div className="mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-5">
                  <h2 className="font-bold text-brand-900">الدفع الإلكتروني غير مفعّل حالياً</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    تم حفظ طلبك بنجاح. سيتواصل معك فريق الأكاديمية هاتفياً لتأكيد التسجيل وترتيب الدفع.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    <a href={`tel:+${settings?.phone_raw || ''}`} className="inline-flex items-center gap-1 text-brand-700 font-bold"><Phone size={15}/> {settings?.phone}</a>
                    <Link to={`/payment/${result.order.order_number}?token=${result.order.access_token}`} className="text-brand-600 hover:underline">متابعة حالة الطلب</Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
              <p className="text-green-900 font-bold">تم تسجيلك في الكورس، وسنتواصل معك لتأكيد الموعد.</p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/courses" className="text-sm text-slate-500 hover:text-brand-700">العودة إلى الكورسات</Link>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
              {course.image ? (
                <img src={course.image} alt={course.title} className="w-full h-56 md:h-72 object-cover" />
              ) : (
                <div className="w-full h-40 bg-gradient-to-l from-brand-100 to-accent-50 flex items-center justify-center">
                  <GraduationCap className="text-brand-500" size={48} />
                </div>
              )}
              <div className="p-6 md:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  {isOpen ? (
                    <span className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full">التسجيل مفتوح</span>
                  ) : (
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">التسجيل مغلق</span>
                  )}                  {full && <span className="bg-red-50 text-red-700 text-xs font-bold px-3 py-1 rounded-full">اكتمل العدد</span>}
                </div>
                <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-brand-900">{course.title}</h1>
                <p className="mt-3 text-slate-600 leading-relaxed whitespace-pre-line">{course.description}</p>

                <div className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
                  {course.schedule && (
                    <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-3"><CalendarDays size={18} className="text-brand-600"/><span>{course.schedule}</span></div>
                  )}
                  {course.duration && (
                    <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-3"><Clock size={18} className="text-brand-600"/><span>{course.duration}</span></div>
                  )}
                  {(course.age_min || course.age_max) && (
                    <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-3"><Users size={18} className="text-brand-600"/><span>العمر: {course.age_min || '—'} - {course.age_max || '—'} سنة</span></div>
                  )}
                  {seatsLeft !== null && (
                    <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-3"><Users size={18} className="text-brand-600"/><span>المقاعد المتاحة: {seatsLeft}</span></div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sticky top-24">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-xs text-slate-500">رسوم الكورس</div>
                  <div className="text-2xl font-extrabold text-brand-900">{paid ? money(course.price_cents, course.currency) : 'مجاناً'}</div>
                </div>
                <Wallet className="text-brand-300" size={32} />
              </div>

              <form onSubmit={submit} className="mt-5 space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">اسم الطالب *</label>
                  <input required value={form.student_name} onChange={e=>upd('student_name', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-200" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">العمر</label>
                    <input type="number" min="2" max="99" value={form.student_age} onChange={e=>upd('student_age', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">ولي الأمر</label>
                    <input value={form.guardian_name} onChange={e=>upd('guardian_name', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">رقم الهاتف *</label>
                  <input required inputMode="tel" value={form.phone} onChange={e=>upd('phone', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">البريد الإلكتروني {paid && <span className="text-slate-400">(مطلوب للدفع الإلكتروني)</span>}</label>
                  <input type="email" required={paid && payments?.online_enabled} value={form.email} onChange={e=>upd('email', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ملاحظات</label>
                  <textarea rows="2" value={form.notes} onChange={e=>upd('notes', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5" />
                </div>

                {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</div>}

                <button type="submit" disabled={submitting || !isOpen || full} className="w-full inline-flex items-center justify-center gap-2 bg-brand-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-brand-700 disabled:opacity-60">
                  {submitting ? <Loader2 size={18} className="animate-spin"/> : <GraduationCap size={18}/>}
                  {full ? 'اكتمل العدد' : isOpen ? (paid ? 'احجز الآن' : 'سجّل الآن') : 'التسجيل مغلق'}
                </button>
                <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                  بإرسال الطلب أنت توافق على <Link to="/p/terms" className="underline">الشروط</Link> و<Link to="/p/privacy" className="underline">سياسة الخصوصية</Link>.
                </p>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
