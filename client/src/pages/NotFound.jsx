import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import usePageMeta from '../lib/usePageMeta';

export default function NotFound() {
  usePageMeta('الصفحة غير موجودة');
  return (
    <section className="max-w-3xl mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4">🦋</div>
      <h1 className="text-3xl font-extrabold text-brand-900 mb-2">الصفحة غير موجودة</h1>
      <p className="text-slate-600 mb-6">عذراً، لم نتمكن من العثور على الصفحة المطلوبة.</p>
      <Link to="/" className="inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-brand-700">
        <Home size={18} /> العودة للرئيسية
      </Link>
    </section>
  );
}
