import { MapPin, Facebook, MessageCircle } from 'lucide-react';
import { useSettings } from '../App';
import usePageMeta from '../lib/usePageMeta';

export default function Contact() {
  const { settings } = useSettings();
  const phoneRaw = settings?.phone_raw || '201155271647';
  usePageMeta('التواصل', 'بيانات التواصل مع أكاديمية أجيال النموذجية.');
  return (
    <section className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-extrabold text-brand-900 mb-2">التواصل</h1>
      <p className="text-slate-600 mb-8">نحن هنا للرد على استفساراتك.</p>
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="font-bold text-brand-800 mb-3">الهاتف</div>
          <a href={`tel:+${phoneRaw}`} className="flex items-center gap-2 text-brand-600 font-bold text-lg" dir="ltr">{settings?.phone}</a>
          <a href={`https://wa.me/${phoneRaw}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-600">
            <MessageCircle size={16}/> واتساب
          </a>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="font-bold text-brand-800 mb-3">الموقع</div>
          <div className="flex items-center gap-2 text-slate-700"><MapPin size={16}/>{settings?.location}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="font-bold text-brand-800 mb-3">فيسبوك</div>
          <div className="space-y-2">
            {settings?.facebook_1 && <a href={settings.facebook_1} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-brand-600 hover:underline"><Facebook size={16}/> صفحة الأكاديمية</a>}
            {settings?.facebook_2 && <a href={settings.facebook_2} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-brand-600 hover:underline"><Facebook size={16}/> Aya Sorour English Pioneer</a>}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="font-bold text-brand-800 mb-3">ساعات العمل</div>
          <p className="text-sm text-slate-600">يرجى التواصل عبر الهاتف/واتساب للاستفسار عن المواعيد (لم تُنشر ساعات عمل محددة في المصادر).</p>
        </div>
      </div>
    </section>
  );
}