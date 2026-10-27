import { useSettings } from '../App';
import usePageMeta from '../lib/usePageMeta';
export default function About() {
  const { settings } = useSettings();
  usePageMeta('نبذة عن الأكاديمية', settings?.about || 'نبذة عن أكاديمية أجيال النموذجية.');
  return (
    <section className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-extrabold text-brand-900 mb-6">نبذة عن الأكاديمية</h1>
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-4 leading-relaxed text-slate-700">
        <p className="text-lg">{settings?.about}</p>
        <div className="grid sm:grid-cols-2 gap-4 pt-4">
          <div className="bg-brand-50 rounded-2xl p-5">
            <div className="font-bold text-brand-800 mb-1">الموقع</div>
            <div className="text-sm text-slate-700">{settings?.location}</div>
          </div>
          <div className="bg-brand-50 rounded-2xl p-5">
            <div className="font-bold text-brand-800 mb-1">الهاتف</div>
            <div className="text-sm text-slate-700" dir="ltr">{settings?.phone}</div>
          </div>
        </div>
        <div className="bg-slate-50 rounded-2xl p-5">
          <div className="font-bold text-brand-800 mb-1">رسالتنا</div>
          <p className="text-sm text-slate-700">{settings?.mission}</p>
        </div>
        <p className="text-xs text-slate-400 pt-2">
          * المعلومات مستندة إلى صفحات الأكاديمية على فيسبوك. (أكاديمية أجيال النموذجية — 🦋 جيل ذو أثر 🦋 نحن نؤمن بأن كل طفل هو جيل المستقبل. نركز على التطوير الأكاديمي، السلوكي، الأخلاقي، والديني، في بيئة آمنة ومحفزة.)
        </p>
      </div>
    </section>
  );
}