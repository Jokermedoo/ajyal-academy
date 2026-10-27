import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { createContext, useContext, useEffect, useState, lazy, Suspense } from 'react';
import { api } from './lib/api';
import { applyTheme } from './lib/theme';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';
import WhatsAppFloat from './components/WhatsAppFloat';
import Home from './pages/Home';
import About from './pages/About';
import Curriculum from './pages/Curriculum';
import Activities from './pages/Activities';
import Gallery from './pages/Gallery';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import PaymentResult from './pages/PaymentResult';
import PaymentReturn from './pages/PaymentReturn';
import DynamicPage from './pages/DynamicPage';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

const AdminLogin = lazy(() => import('./admin/Login'));
const AdminDashboard = lazy(() => import('./admin/Dashboard'));

export const SettingsContext = createContext(null);
export const useSettings = () => useContext(SettingsContext);

function PageLoading() {
  return <div className="text-center py-20 text-slate-500">جاري التحميل...</div>;
}

function Maintenance({ settings }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-lg text-center bg-white rounded-3xl border border-slate-100 shadow-sm p-10">
        {settings?.hero_image && (
          <img src={settings.hero_image} alt="شعار الأكاديمية" className="w-20 h-20 rounded-full object-cover mx-auto mb-4" />
        )}
        <h1 className="text-2xl font-extrabold text-brand-900">{settings?.short_name || 'أكاديمية أجيال'}</h1>
        <p className="mt-3 text-slate-600 leading-relaxed">
          {settings?.maintenance_message || 'الموقع تحت الصيانة حالياً، نعود قريباً بإذن الله.'}
        </p>
        <a href="/admin/login" className="inline-block mt-6 text-sm text-brand-600 hover:underline">دخول الإدارة</a>
      </div>
    </div>
  );
}

export default function App() {
  const [site, setSite] = useState(null);
  const [authed, setAuthed] = useState(null);

  const refreshSettings = () => api.getBootstrap().then(setSite).catch(() => {
    setSite((prev) => prev || {
      settings: null, navigation: [], sections: [], pages: [],
      payments: { online_enabled: false, mode: 'sandbox', providers: [] },
    });
  });

  useEffect(() => { refreshSettings(); }, []);
  useEffect(() => { api.session().then(r => setAuthed(r.authenticated)).catch(()=>setAuthed(false)); }, []);

  const settings = site?.settings || null;
  useEffect(() => { applyTheme(settings); }, [settings?.primary_color, settings?.secondary_color, settings?.font_family, settings?.favicon_url]);

  const context = {
    settings,
    site,
    payments: site?.payments,
    navigation: site?.navigation || [],
    pages: site?.pages || [],
    sections: site?.sections || [],
    refreshSettings,
    authed,
    setAuthed,
  };

  const isAdmin = useLocation().pathname.startsWith('/admin');
  const maintenance = settings?.maintenance_mode === '1' && !isAdmin;

  return (
    <SettingsContext.Provider value={context}>
      <ErrorBoundary>
        <div className={isAdmin ? 'min-h-screen' : 'min-h-screen flex flex-col'}>
          <ScrollToTop />
          {!isAdmin && settings?.announcement_enabled === '1' && settings?.announcement_text && (
            <div className="bg-brand-900 text-white text-center text-xs md:text-sm px-4 py-2">
              {settings.announcement_text}
            </div>
          )}
          {!isAdmin && <Header />}
          <main className={isAdmin ? '' : 'flex-1'}>
            {maintenance ? <Maintenance settings={settings} /> : (
              <Suspense fallback={<PageLoading/>}>
                <Routes>
                  <Route path="/" element={<Home/>} />
                  <Route path="/about" element={<About/>} />
                  <Route path="/curriculum" element={<Curriculum/>} />
                  <Route path="/activities" element={<Activities/>} />
                  <Route path="/gallery" element={<Gallery/>} />
                  <Route path="/courses" element={<Courses/>} />
                  <Route path="/courses/:slug" element={<CourseDetail/>} />
                  <Route path="/payment-result" element={<PaymentReturn/>} />
                  <Route path="/payment/:orderNumber" element={<PaymentResult/>} />
                  <Route path="/p/:slug" element={<DynamicPage/>} />
                  <Route path="/contact" element={<Contact/>} />
                  <Route path="/admin/*" element={authed === null ? <PageLoading/> : (authed ? <AdminDashboard/> : <Navigate to="/admin/login" replace/>)} />
                  <Route path="/admin/login" element={authed === null ? <PageLoading/> : (authed ? <Navigate to="/admin" replace/> : <AdminLogin/>)} />
                  <Route path="*" element={<NotFound/>} />
                </Routes>
              </Suspense>
            )}
          </main>
          {!isAdmin && <Footer />}
          {!isAdmin && settings?.whatsapp_float !== '0' && settings?.phone_raw && (
            <WhatsAppFloat phone={settings.phone_raw} />
          )}
        </div>
      </ErrorBoundary>
    </SettingsContext.Provider>
  );
}
