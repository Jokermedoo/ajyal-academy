import { useEffect, useState } from 'react';
import { CalendarDays, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import usePageMeta from '../lib/usePageMeta';
import { CardSkeleton } from '../components/Skeleton';

export default function Activities() {
  const [items, setItems] = useState(null);
  usePageMeta('الأنشطة التعليمية', 'أنشطة وفعاليات أكاديمية أجيال النموذجية.');

  useEffect(() => { api.getActivities().then(setItems).catch(() => setItems([])); }, []);

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-extrabold text-brand-900 mb-2">الأنشطة التعليمية</h1>
      <p className="text-slate-600 mb-8">أنشطة وفعاليات من أكاديمية أجيال (مستندة إلى منشورات صفحة الفيسبوك).</p>

      {items === null ? (
        <CardSkeleton count={3} />
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Sparkles className="mx-auto text-brand-300" size={44} />
          <h2 className="mt-4 font-bold text-brand-900">لا توجد أنشطة حالياً</h2>
          <p className="text-sm text-slate-500 mt-1">تابعنا على فيسبوك لمعرفة أحدث الفعاليات.</p>
        </div>
      ) : (
        <>
        <h2 className="sr-only">قائمة الأنشطة</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(a => (
            <article key={a.id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition">
              {a.image && (
                <img src={a.image} alt={a.title} loading="lazy" decoding="async" className="w-full h-40 object-cover" />
              )}
              <div className="p-5">
                <h3 className="font-bold text-brand-800 text-lg">{a.title}</h3>
                {a.event_date && (
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                    <CalendarDays size={14} /> {a.event_date}
                  </div>
                )}
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{a.description}</p>
              </div>
            </article>
          ))}
        </div>
        </>
      )}
    </section>
  );
}
