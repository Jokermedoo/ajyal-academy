import { Link } from 'react-router-dom';
import { Phone, MapPin, Facebook } from 'lucide-react';
import { useSettings } from '../App';

export default function Footer() {
  const { settings, navigation, pages } = useSettings();
  const footerNav = (navigation || []).filter(n => n.location === 'footer');

  return (
    <footer className="bg-brand-900 text-white mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <div className="font-extrabold text-lg">{settings?.short_name || 'أكاديمية أجيال'}</div>
          <p className="text-brand-100 text-sm mt-2">{settings?.slogan}</p>
          <p className="text-brand-200 text-sm mt-3 leading-relaxed max-w-md">{settings?.about}</p>
        </div>
        <div>
          <div className="font-bold mb-3">روابط سريعة</div>
          <div className="space-y-2 text-sm text-brand-100">
            {(footerNav.length ? footerNav : pages || []).map((n) => (
              n.location === 'footer' ? (
                n.href.startsWith('/') ? <Link key={n.id} to={n.href} className="block hover:text-white">{n.label}</Link>
                  : <a key={n.id} href={n.href} target={n.target || '_self'} rel="noreferrer" className="block hover:text-white">{n.label}</a>
              ) : (
                <Link key={n.id} to={`/p/${n.slug}`} className="block hover:text-white">{n.title}</Link>
              )
            ))}
            {!footerNav.length && !pages?.length && (
              <>
                <Link to="/about" className="block hover:text-white">نبذة عنا</Link>
                <Link to="/courses" className="block hover:text-white">الكورسات</Link>
                <Link to="/contact" className="block hover:text-white">التواصل</Link>
              </>
            )}
          </div>
        </div>
        <div>
          <div className="font-bold mb-3">التواصل</div>
          <div className="space-y-2 text-sm text-brand-100">
            <div className="flex items-center gap-2"><Phone size={16}/><a href={`tel:+${settings?.phone_raw || '201155271647'}`} className="hover:text-white" dir="ltr">{settings?.phone}</a></div>
            <div className="flex items-center gap-2"><MapPin size={16}/><span>{settings?.location}</span></div>
            {settings?.facebook_1 && <a href={settings.facebook_1} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-brand-100 hover:text-white"><Facebook size={16}/> فيسبوك</a>}
            {settings?.facebook_2 && <a href={settings.facebook_2} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-brand-100 hover:text-white"><Facebook size={16}/> Aya Sorour English Pioneer</a>}
          </div>
        </div>
      </div>
      <div className="border-t border-brand-800 text-center text-xs text-brand-200 py-4">
        © {new Date().getFullYear()} {settings?.short_name} — جميع الحقوق محفوظة
      </div>
    </footer>
  );
}
