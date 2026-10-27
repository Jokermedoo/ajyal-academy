import { useEffect, useCallback, useState } from 'react';
import { X, ChevronRight, ChevronLeft, Image as ImageIcon } from 'lucide-react';
import { api } from '../lib/api';
import usePageMeta from '../lib/usePageMeta';

export default function Gallery() {
  const [items, setItems] = useState(null);
  const [index, setIndex] = useState(-1);
  usePageMeta('معرض الصور', 'صور أكاديمية أجيال النموذجية.');

  useEffect(() => { api.getGallery().then(setItems).catch(() => setItems([])); }, []);

  const close = useCallback(() => setIndex(-1), []);
  const next = useCallback(() => {
    setIndex(i => (items && items.length ? (i + 1) % items.length : -1));
  }, [items]);
  const prev = useCallback(() => {
    setIndex(i => (items && items.length ? (i - 1 + items.length) % items.length : -1));
  }, [items]);

  useEffect(() => {
    if (index < 0) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, close, next, prev]);

  const active = index >= 0 && items ? items[index] : null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-extrabold text-brand-900 mb-2">معرض الصور</h1>
      <p className="text-slate-600 mb-8">صور أكاديمية أجيال.</p>

      {items === null ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <ImageIcon className="mx-auto text-brand-300" size={44} />
          <h2 className="mt-4 font-bold text-brand-900">لا توجد صور حالياً</h2>
          <p className="text-sm text-slate-500 mt-1">سيتم إضافة الصور قريباً.</p>
        </div>
      ) : (
        <>
        <h2 className="sr-only">صور الأكاديمية</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((g, i) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`عرض الصورة: ${g.caption || i + 1}`}
              className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <img src={g.image} alt={g.caption || 'صورة من الأكاديمية'} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition" />
              {g.caption && <div className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-xs p-2">{g.caption}</div>}
            </button>
          ))}
        </div>
        </>
      )}

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="عرض الصورة"
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={close}
        >
          <button type="button" aria-label="إغلاق" className="absolute top-4 left-4 text-white p-2 hover:bg-white/10 rounded-full" onClick={close}>
            <X size={28} />
          </button>
          <span className="absolute top-5 right-5 text-white/80 text-sm" dir="ltr">{index + 1} / {items.length}</span>

          {items.length > 1 && (
            <>
              <button
                type="button"
                aria-label="الصورة التالية"
                className="absolute right-3 md:right-6 text-white p-3 rounded-full bg-white/10 hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); next(); }}
              >
                <ChevronRight size={30} />
              </button>
              <button
                type="button"
                aria-label="الصورة السابقة"
                className="absolute left-3 md:left-6 text-white p-3 rounded-full bg-white/10 hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); prev(); }}
              >
                <ChevronLeft size={30} />
              </button>
            </>
          )}

          <figure className="max-w-full max-h-full text-center" onClick={e => e.stopPropagation()}>
            <img src={active.image} alt={active.caption || 'صورة من الأكاديمية'} className="max-w-full max-h-[85vh] rounded-xl mx-auto" />
            {active.caption && <figcaption className="text-white/90 text-sm mt-3">{active.caption}</figcaption>}
          </figure>
        </div>
      )}
    </section>
  );
}
