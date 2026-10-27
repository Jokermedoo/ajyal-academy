import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Activity, Image as ImageIcon, GraduationCap,
  Users, Wallet, Palette, Link2, FileText, Settings, History, KeyRound,
  LogOut, Menu, X, ExternalLink, CreditCard, UserCog, ShieldCheck,
} from 'lucide-react';
import { api } from '../lib/api';
import { useSettings } from '../App';
import usePageMeta from '../lib/usePageMeta';
import { ToastProvider } from './ui';
import Overview from './pages/Overview';
import Subjects from './pages/Subjects';
import Activities from './pages/Activities';
import GalleryAdmin from './pages/GalleryAdmin';
import CoursesAdmin from './pages/CoursesAdmin';
import Enrollments from './pages/Enrollments';
import Orders from './pages/Orders';
import Appearance from './pages/Appearance';
import NavigationAdmin from './pages/NavigationAdmin';
import PagesAdmin from './pages/PagesAdmin';
import Media from './pages/Media';
import SettingsAdmin from './pages/SettingsAdmin';
import Payments from './pages/Payments';
import UsersPage from './pages/Users';
import Audit from './pages/Audit';
import Security from './pages/Security';

const GROUPS = [
  { label: 'الرئيسية', items: [{ to: '/admin', label: 'نظرة عامة', icon: LayoutDashboard, end: true }] },
  {
    label: 'المحتوى', items: [
      { to: '/admin/content/subjects', label: 'المواد', icon: BookOpen },
      { to: '/admin/content/activities', label: 'الأنشطة', icon: Activity },
      { to: '/admin/content/gallery', label: 'المعرض', icon: ImageIcon },
      { to: '/admin/content/courses', label: 'الكورسات', icon: GraduationCap },
    ],
  },
  {
    label: 'العمليات', items: [
      { to: '/admin/enrollments', label: 'التسجيلات', icon: Users },
      { to: '/admin/orders', label: 'المدفوعات', icon: Wallet },
    ],
  },
  {
    label: 'التخصيص', items: [
      { to: '/admin/appearance', label: 'الهوية والأقسام', icon: Palette },
      { to: '/admin/navigation', label: 'قوائم الموقع', icon: Link2 },
      { to: '/admin/pages', label: 'الصفحات', icon: FileText },
    ],
  },
  {
    label: 'النظام', items: [
      { to: '/admin/media', label: 'مكتبة الوسائط', icon: ImageIcon },
      { to: '/admin/settings', label: 'الإعدادات', icon: Settings },
      { to: '/admin/payments', label: 'بوابات الدفع', icon: CreditCard, adminOnly: true },
      { to: '/admin/users', label: 'المستخدمون', icon: UserCog, adminOnly: true },
      { to: '/admin/audit', label: 'سجل التغييرات', icon: History, adminOnly: true },
      { to: '/admin/security', label: 'الأمان', icon: KeyRound },
    ],
  },
];

const ALL_ITEMS = GROUPS.flatMap((g) => g.items);

export default function Dashboard() {
  const { settings, setAuthed } = useSettings();
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState(null);
  const loc = useLocation();
  const navigate = useNavigate();
  usePageMeta('لوحة الإدارة');

  useEffect(() => { api.me().then(setMe).catch(() => {}); }, []);
  useEffect(() => { setOpen(false); }, [loc.pathname]);

  const role = me?.role || 'admin';
  const current = ALL_ITEMS
    .filter((i) => i.end ? loc.pathname === i.to : loc.pathname.startsWith(i.to))
    .sort((a, b) => b.to.length - a.to.length)[0];

  const logout = async () => {
    try { await api.logout(); } catch { /* ignore */ }
    setAuthed(false);
    navigate('/admin/login', { replace: true });
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50 lg:flex" dir="rtl">
        {open && <div className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden" onClick={() => setOpen(false)} />}

        <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-brand-900 text-white flex flex-col transform transition-transform duration-200 lg:static lg:translate-x-0 lg:shrink-0 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10 shrink-0">
            {settings?.hero_image ? (
              <img src={settings.hero_image} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-white/20" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-bold">أ</div>
            )}
            <div className="min-w-0">
              <div className="font-extrabold text-sm truncate">{settings?.short_name || 'أكاديمية أجيال'}</div>
              <div className="text-[10px] text-brand-300">لوحة التحكم</div>
            </div>
            <button onClick={() => setOpen(false)} className="mr-auto p-1.5 rounded-lg hover:bg-white/10 lg:hidden" aria-label="إغلاق"><X size={18} /></button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
            {GROUPS.map((group) => {
              const items = group.items.filter((i) => !i.adminOnly || role === 'admin');
              if (!items.length) return null;
              return (
                <div key={group.label}>
                  <div className="px-3 mb-1.5 text-[10px] font-bold text-brand-300 tracking-wide">{group.label}</div>
                  <div className="space-y-0.5">
                    {items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition ${isActive ? 'bg-white/15 text-white' : 'text-brand-100 hover:bg-white/10 hover:text-white'}`}
                      >
                        <item.icon size={17} />
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-3 shrink-0">
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">{(me?.username || 'A').slice(0, 1).toUpperCase()}</div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold truncate">{me?.username || '...'}</div>
                <div className="text-[10px] text-brand-300 flex items-center gap-1"><ShieldCheck size={11} /> {role === 'admin' ? 'مدير' : 'محرر'}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              <Link to="/" target="_blank" className="flex items-center justify-center gap-1 text-[11px] bg-white/10 hover:bg-white/15 rounded-lg py-2 font-bold"><ExternalLink size={13} /> الموقع</Link>
              <button onClick={logout} className="flex items-center justify-center gap-1 text-[11px] bg-white/10 hover:bg-white/15 rounded-lg py-2 font-bold"><LogOut size={13} /> خروج</button>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-30 bg-white border-b border-slate-100">
            <div className="h-16 px-4 md:px-6 flex items-center gap-3">
              <button onClick={() => setOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100" aria-label="القائمة"><Menu size={20} /></button>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-400">لوحة التحكم</div>
                <h1 className="font-extrabold text-brand-900 text-sm md:text-base truncate">{current?.label || 'لوحة التحكم'}</h1>
              </div>
              <div className="mr-auto flex items-center gap-2">
                <Link to="/" target="_blank" className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-500 hover:text-brand-700 bg-slate-50 rounded-lg px-3 py-2">
                  <ExternalLink size={14} /> عرض الموقع
                </Link>
                <button onClick={logout} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" title="تسجيل الخروج" aria-label="تسجيل الخروج"><LogOut size={18} /></button>
              </div>
            </div>
          </header>

          <div className="flex-1 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route index element={<Overview />} />
                <Route path="content/subjects" element={<Subjects />} />
                <Route path="content/activities" element={<Activities />} />
                <Route path="content/gallery" element={<GalleryAdmin />} />
                <Route path="content/courses" element={<CoursesAdmin />} />
                <Route path="enrollments" element={<Enrollments />} />
                <Route path="orders" element={<Orders />} />
                <Route path="appearance" element={<Appearance />} />
                <Route path="navigation" element={<NavigationAdmin />} />
                <Route path="pages" element={<PagesAdmin />} />
                <Route path="media" element={<Media />} />
                <Route path="settings" element={<SettingsAdmin />} />
                <Route path="payments" element={role === 'admin' ? <Payments /> : <Navigate to="/admin" replace />} />
                <Route path="users" element={role === 'admin' ? <UsersPage /> : <Navigate to="/admin" replace />} />
                <Route path="audit" element={role === 'admin' ? <Audit /> : <Navigate to="/admin" replace />} />
                <Route path="security" element={<Security />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </div>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
