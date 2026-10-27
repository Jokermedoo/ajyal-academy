import { Link, useLocation } from 'react-router-dom';
import { Phone, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useSettings } from '../App';

const fallbackNav = [
  { href: '/', label: 'الرئيسية' },
  { href: '/about', label: 'نبذة' },
  { href: '/curriculum', label: 'المنهج' },
  { href: '/activities', label: 'الأنشطة' },
  { href: '/gallery', label: 'المعرض' },
  { href: '/courses', label: 'الكورسات' },
  { href: '/contact', label: 'التواصل' },
];

export default function Header() {
  const { settings, navigation } = useSettings();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const nav = (navigation || []).filter(n => n.location === 'header').length
    ? navigation.filter(n => n.location === 'header')
    : fallbackNav;

  const isActive = (href) => href === '/' ? loc.pathname === '/' : loc.pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          {settings?.hero_image ? (
            <img src={settings.hero_image} alt="logo" className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-200" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">أ</div>
          )}
          <div className="leading-tight">
            <div className="font-extrabold text-brand-800 text-sm md:text-base">{settings?.short_name || 'أكاديمية أجيال'}</div>
            <div className="text-[10px] md:text-xs text-slate-500">{settings?.slogan || 'تعليم اليوم، نجاح الغد.'}</div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {nav.map(n => (
            n.href.startsWith('/') ? (
              <Link key={n.id || n.href} to={n.href} target={n.target || '_self'} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${isActive(n.href) ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:text-brand-700 hover:bg-slate-50'}`}>{n.label}</Link>
            ) : (
              <a key={n.id || n.href} href={n.href} target={n.target || '_self'} rel="noreferrer" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-700 hover:bg-slate-50">{n.label}</a>
            )
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a href={`tel:${settings?.phone_raw ? '+'+settings.phone_raw : settings?.phone}`} className="hidden sm:inline-flex items-center gap-1 bg-brand-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-700">
            <Phone size={16}/> اتصال
          </a>
          <button className="md:hidden p-2 rounded-lg hover:bg-slate-100" onClick={()=>setOpen(!open)} aria-label="القائمة" aria-expanded={open}>
            {open ? <X size={20}/> : <Menu size={20}/>}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <div className="max-w-6xl mx-auto px-4 py-2 flex flex-col">
            {nav.map(n => (
              n.href.startsWith('/') ? (
                <Link key={n.id || n.href} to={n.href} target={n.target || '_self'} onClick={()=>setOpen(false)} className={`px-3 py-3 rounded-lg text-sm font-medium ${isActive(n.href) ? 'bg-brand-50 text-brand-700' : 'text-slate-600'}`}>{n.label}</Link>
              ) : (
                <a key={n.id || n.href} href={n.href} target={n.target || '_self'} rel="noreferrer" className="px-3 py-3 rounded-lg text-sm font-medium text-slate-600">{n.label}</a>
              )
            ))}
            <a href={`tel:${settings?.phone_raw ? '+'+settings.phone_raw : settings?.phone}`} className="mt-1 mb-2 inline-flex items-center justify-center gap-2 bg-brand-600 text-white px-3 py-3 rounded-lg text-sm font-bold">
              <Phone size={16}/> اتصال مباشر
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
