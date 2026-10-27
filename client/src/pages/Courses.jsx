import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Clock, Users, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import usePageMeta from '../lib/usePageMeta';
import { CardSkeleton } from '../components/Skeleton';

const money = (cents, currency = 'EGP') => Number(cents) > 0
  ? new Intl.NumberFormat('ar-EG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(cents) / 100)
  : 'مجاناً';

export default function Courses() {
  const [items, setItems] = useState(null);
  usePageMeta('الكورسات والدروس', 'الكورسات والدروس المتاحة في أكاديمية أجيال النموذجية.');

  useEffect(() => { api.getCourses().then(setItems).catch(() => setItems([])); }, []);

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-extrabold text-brand-900 mb-2">الكورسات والدروس</h1>
      <p className="text-slate-600 mb-8">اختر الكورس المناسب وسجّل بياناتك، وسنتواصل معك لتأكيد الحجز.</p>

      {items === null ? (
        <CardSkeleton count={3} />
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <GraduationCap className="mx-auto text-brand-300" size={44} />
          <h2 className="mt-4 font-bold text-brand-900">لا توجد كورسات حالياً</h2>
          <p className="text-sm text-slate-500 mt-1">تابعنا للإعلان عن الدورات القادمة.</p>
        </div>
      ) : (
        <>
        <h2 className="sr-only">قائمة الكورسات</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(c => (
            <article key={c.id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col">
              {c.image ? (
                <img src={c.image} alt={c.title} loading="lazy" decoding="async" className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-28 bg-gradient-to-l from-brand-50 to-accent-50 flex items-center justify-center">
                  <GraduationCap className="text-brand-400" size={38} />
                </div>
              )}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-brand-800 text-lg">{c.title}</h3>
                  <span className={`shrink-0 text-[11px] font-bold px-2 py-1 rounded-full ${c.is_open !== 0 ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {c.is_open !== 0 ? 'مفتوح' : 'مغلق'}
                  </span>
                </div>
                {c.schedule && (
                  <div className="flex items-center gap-1 text-xs text-brand-600 mt-1 font-medium">
                    <Clock size={14} /> {c.schedule}
                  </div>
                )}
                <p className="text-sm text-slate-600 mt-2 leading-relaxed line-clamp-3">{c.description}</p>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-500">الرسوم</div>
                    <div className="font-extrabold text-brand-900">{money(c.price_cents, c.currency)}</div>
                  </div>
                  <Link to={`/courses/${c.slug || c.id}`} className="inline-flex items-center gap-1 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-700">
                    التفاصيل <ArrowLeft size={15}/>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
        </>
      )}
    </section>
  );
}
