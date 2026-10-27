import { Link } from 'react-router-dom';
import { CheckCircle2, Clock3, ArrowRight, MessageCircle } from 'lucide-react';
import { useSettings } from '../App';
import usePageMeta from '../lib/usePageMeta';

export default function PaymentReturn() {
  const { settings } = useSettings();
  const phone = settings?.phone_raw || '';

  usePageMeta('نتيجة الدفع');

  return (
    <section className="max-w-2xl mx-auto px-4 py-16">
      <div className="rounded-3xl border border-brand-100 bg-brand-50 p-6 md:p-10 text-center">
        <CheckCircle2 className="mx-auto text-green-600" size={56}/>
        <h1 className="mt-4 text-2xl md:text-3xl font-extrabold text-brand-900">تم استلام عودتك من بوابة الدفع</h1>
        <p className="mt-3 text-slate-600 leading-relaxed">
          سيتم تحديث حالة الطلب تلقائياً خلال لحظات بعد وصول إشعار الدفع من البوابة.
          يمكنك الرجوع لصفحة الطلب من الرابط الذي ظهر لك بعد التسجيل، أو التواصل معنا للتأكد.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 text-sm bg-white/80 border border-brand-100 rounded-xl px-4 py-3 text-brand-800">
          <Clock3 size={18}/>
          لا تغلق هذه الصفحة إن كنت قد وصلت إليها للتو؛ التحديث يتم في الخلفية.
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/courses" className="inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-bold hover:border-brand-300">
            <ArrowRight size={16}/> الكورسات
          </Link>
          {phone ? (
            <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-brand-700">
              <MessageCircle size={16}/> تواصل عبر واتساب
            </a>
          ) : (
            <Link to="/contact" className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-brand-700">
              <MessageCircle size={16}/> تواصل معنا
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
