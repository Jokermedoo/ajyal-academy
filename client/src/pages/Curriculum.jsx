import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { api } from '../lib/api';
import usePageMeta from '../lib/usePageMeta';
import { CardSkeleton } from '../components/Skeleton';
import SubjectIcon from '../components/SubjectIcon';

export default function Curriculum() {
  const [subjects, setSubjects] = useState(null);
  usePageMeta('المنهج التعليمي', 'المواد والأنشطة التعليمية في أكاديمية أجيال.');
  useEffect(() => { api.getSubjects().then(setSubjects).catch(() => setSubjects([])); }, []);

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-extrabold text-brand-900 mb-2">المنهج التعليمي</h1>
      <p className="text-slate-600 mb-8">مواد وأنشطة متنوعة لتنمية مهارات أطفالنا.</p>

      {subjects === null ? (
        <CardSkeleton count={8} />
      ) : subjects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <BookOpen className="mx-auto text-brand-300" size={44} />
          <h2 className="mt-4 font-bold text-brand-900">لا توجد مواد حالياً</h2>
          <p className="text-sm text-slate-500 mt-1">سيتم إضافة المواد قريباً.</p>
        </div>
      ) : (
        <>
        <h2 className="sr-only">المواد الدراسية</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {subjects.map(s => (
            <div key={s.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
                <SubjectIcon name={s.icon} />
              </div>
              <h3 className="font-bold text-brand-800 text-lg">{s.title}</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{s.description}</p>
              {s.image && <img src={s.image} alt={s.title} loading="lazy" decoding="async" className="mt-3 w-full h-28 object-cover rounded-xl" />}
            </div>
          ))}
        </div>
        </>
      )}
    </section>
  );
}
