import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileText, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import usePageMeta from '../lib/usePageMeta';

export default function DynamicPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [error, setError] = useState('');
  usePageMeta(page?.seo_title || page?.title || 'صفحة', page?.seo_description);

  useEffect(() => {
    setPage(null); setError('');
    api.getPage(slug).then(setPage).catch((e) => setError(e.message));
  }, [slug]);

  if (error) {
    return (
      <section className="max-w-2xl mx-auto px-4 py-20 text-center">
        <FileText className="mx-auto text-slate-300" size={48}/>
        <h1 className="mt-4 text-2xl font-extrabold text-brand-900">{error}</h1>
        <Link to="/" className="inline-flex items-center gap-2 mt-6 text-brand-600 font-bold hover:underline"><ArrowRight size={18}/> الرئيسية</Link>
      </section>
    );
  }
  if (!page) return <div className="text-center py-20 text-slate-500">جاري التحميل...</div>;

  return (
    <section className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-extrabold text-brand-900">{page.title}</h1>
      <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 text-slate-700 leading-loose whitespace-pre-line">
        {page.content}
      </div>
    </section>
  );
}
