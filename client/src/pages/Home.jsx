import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Phone, MessageCircle, ShieldCheck, Heart, BookOpen, Clock, GraduationCap } from 'lucide-react';
import { useSettings } from '../App';
import { api } from '../lib/api';
import usePageMeta from '../lib/usePageMeta';
import SubjectIcon from '../components/SubjectIcon';

const money = (cents, currency = 'EGP') => Number(cents) > 0
  ? new Intl.NumberFormat('ar-EG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(cents) / 100)
  : 'مجاناً';

export default function Home() {
  const { settings, sections } = useSettings();
  usePageMeta('الرئيسية', settings?.intro || 'أكاديمية أجيال النموذجية — تعليم اليوم، نجاح الغد.');
  const [subjects, setSubjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api.getSubjects().then(setSubjects).catch(()=>{});
    api.getActivities().then(setActivities).catch(()=>{});
    api.getGallery().then(setGallery).catch(()=>{});
    api.getCourses().then(setCourses).catch(()=>{});
  }, []);

  const sec = (key) => (sections || []).find(s => s.key === key) || {};
  const visible = (key, settingKey) => sec(key).visible !== 0 && (settingKey ? settings?.[settingKey] !== '0' : true);

  const phoneRaw = settings?.phone_raw || '201155271647';
  const wa = 'https://wa.me/' + phoneRaw;
  const features = [
    { icon: ShieldCheck, title: 'بيئة آمنة', desc: 'اهتمام بسلامة الأطفال وراحتهم.' },
    { icon: BookOpen, title: 'تطوير أكاديمي', desc: 'مناهج متنوعة لتنمية المهارات.' },
    { icon: Heart, title: 'قيم وأخلاق', desc: 'غرس القيم والمبادئ (أكاديمي/سلوكي/أخلاقي/ديني).' },
  ];

  return (
    <>
      {visible('hero') && (
        <section className="relative overflow-hidden bg-gradient-to-bl from-brand-50 via-white to-accent-50">
          <div className="max-w-6xl mx-auto px-4 py-12 md:py-20 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-1 bg-brand-100 text-brand-700 text-xs font-bold px-3 py-1 rounded-full">
                {settings?.hero_badge || '🦋 جيل ذو أثر'}
              </span>
              <h1 className="mt-4 text-3xl md:text-5xl font-extrabold text-brand-900 leading-tight">
                {sec('hero').title || settings?.short_name || 'أكاديمية أجيال'}
              </h1>
              <p className="mt-2 text-lg md:text-xl text-brand-700 font-medium">{sec('hero').subtitle || settings?.slogan}</p>
              <p className="mt-4 text-slate-600 leading-relaxed max-w-xl">{settings?.intro}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={`tel:+${phoneRaw}`} className="inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-200">
                  <Phone size={18}/> اتصال مباشر
                </a>
                <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-green-500 text-white px-5 py-3 rounded-xl font-bold hover:bg-green-600 shadow-lg shadow-green-200">
                  <MessageCircle size={18}/> واتساب
                </a>
                <Link to="/courses" className="inline-flex items-center gap-2 border border-slate-200 bg-white px-5 py-3 rounded-xl font-bold hover:border-brand-300">
                  الكورسات <ArrowLeft size={16}/>
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute -inset-6 bg-brand-200/40 rounded-full blur-2xl" />
                {settings?.hero_image ? (
                  <img src={settings.hero_image} alt="شعار الأكاديمية" fetchPriority="high" decoding="async" className="relative w-64 h-64 md:w-80 md:h-80 rounded-full object-cover ring-8 ring-white shadow-2xl" />
                ) : (
                  <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full ring-8 ring-white shadow-2xl bg-gradient-to-bl from-brand-200 to-accent-200 flex items-center justify-center text-6xl">🦋</div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {visible('features') && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl md:text-3xl font-extrabold text-brand-900 text-center mb-2">{sec('features').title || 'لماذا أكاديمية أجيال؟'}</h2>
          {sec('features').subtitle && <p className="text-center text-slate-600 mb-8">{sec('features').subtitle}</p>}
          {!sec('features').subtitle && <div className="mb-8" />}
          <div className="grid sm:grid-cols-3 gap-6">
            {features.map((f,i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition">
                <f.icon className="text-brand-600" size={32}/>
                <h3 className="mt-3 font-bold text-brand-900">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {visible('subjects', 'show_subjects') && subjects.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-brand-900">{sec('subjects').title || 'المنهج التعليمي'}</h2>
              {sec('subjects').subtitle && <p className="text-sm text-slate-500 mt-1">{sec('subjects').subtitle}</p>}
            </div>
            <Link to="/curriculum" className="text-brand-600 font-medium text-sm hover:underline">عرض الكل</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {subjects.slice(0,4).map(s => (
              <div key={s.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-2">
                  <SubjectIcon name={s.icon} />
                </div>
                <div className="font-bold text-brand-800 text-sm">{s.title}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {visible('activities', 'show_activities') && activities.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-brand-900">{sec('activities').title || 'الأنشطة التعليمية'}</h2>
              {sec('activities').subtitle && <p className="text-sm text-slate-500 mt-1">{sec('activities').subtitle}</p>}
            </div>
            <Link to="/activities" className="text-brand-600 font-medium text-sm hover:underline">عرض الكل</Link>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {activities.slice(0,3).map(a => (
              <div key={a.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h3 className="font-bold text-brand-800">{a.title}</h3>
                <p className="text-sm text-slate-600 mt-1 line-clamp-3">{a.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {visible('gallery', 'show_gallery') && gallery.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-brand-900">{sec('gallery').title || 'معرض الصور'}</h2>
              {sec('gallery').subtitle && <p className="text-sm text-slate-500 mt-1">{sec('gallery').subtitle}</p>}
            </div>
            <Link to="/gallery" className="text-brand-600 font-medium text-sm hover:underline">عرض الكل</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {gallery.slice(0,4).map(g => (
              <img key={g.id} src={g.image} alt={g.caption || 'صورة من الأكاديمية'} loading="lazy" decoding="async" className="w-full h-32 object-cover rounded-xl shadow-sm" />
            ))}
          </div>
        </section>
      )}

      {visible('courses', 'show_courses') && courses.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-brand-900">{sec('courses').title || 'الكورسات والدروس'}</h2>
              {sec('courses').subtitle && <p className="text-sm text-slate-500 mt-1">{sec('courses').subtitle}</p>}
            </div>
            <Link to="/courses" className="text-brand-600 font-medium text-sm hover:underline">عرض الكل</Link>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {courses.slice(0,3).map(c => (
              <Link key={c.id} to={`/courses/${c.slug || c.id}`} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-brand-800">{c.title}</h3>
                  <GraduationCap className="text-brand-300 shrink-0" size={22}/>
                </div>
                {c.schedule && <div className="flex items-center gap-1 text-xs text-brand-600 mt-1"><Clock size={13}/> {c.schedule}</div>}
                <p className="text-sm text-slate-600 mt-1 line-clamp-2">{c.description}</p>
                <div className="mt-3 font-extrabold text-brand-900 text-sm">{money(c.price_cents, c.currency)}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {visible('cta') && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-gradient-to-l from-brand-600 to-brand-800 rounded-3xl p-8 md:p-12 text-white text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold">{sec('cta').title || 'هل ترغب في معرفة المزيد؟'}</h2>
            <p className="mt-2 text-brand-100">{sec('cta').subtitle || 'تواصل معنا الآن وسنكون سعداء بالرد على استفساراتك.'}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a href={`tel:+${phoneRaw}`} className="bg-white text-brand-700 px-5 py-3 rounded-xl font-bold hover:bg-brand-50">اتصال</a>
              <a href={wa} target="_blank" rel="noreferrer" className="bg-green-500 text-white px-5 py-3 rounded-xl font-bold hover:bg-green-600">واتساب</a>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
