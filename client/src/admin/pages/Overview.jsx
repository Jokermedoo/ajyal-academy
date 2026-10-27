import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, Users, Wallet, TrendingUp, Plus, ArrowLeft, AlertTriangle,
  CheckCircle2, Clock3, BookOpen, Image as ImageIcon, Settings as SettingsIcon,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Card, PageHeader, StatCard, Badge, Spinner, EmptyState } from '../ui';

const money = (cents) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(Number(cents || 0) / 100);
const date = (v) => v ? new Date(v).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const ENROLLMENT_LABEL = { new: ['جديد', 'brand'], contacted: ['تم التواصل', 'amber'], confirmed: ['مؤكد', 'green'], cancelled: ['ملغي', 'red'], completed: ['مكتمل', 'purple'] };
const ORDER_LABEL = { pending: ['بانتظار الدفع', 'amber'], paid: ['مدفوع', 'green'], failed: ['فاشل', 'red'], cancelled: ['ملغي', 'slate'], refunded: ['مسترد', 'purple'] };

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api.stats().then(setStats).catch((e) => setError(e.message)); }, []);

  if (error) return <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4">{error}</div>;
  if (!stats) return <Spinner />;

  const payments = stats.payments || {};
  const schemaReady = stats.schema ? stats.schema.ready : true;
  const quick = [
    { to: '/admin/content/courses', label: 'إدارة الكورسات', icon: GraduationCap },
    { to: '/admin/enrollments', label: 'التسجيلات', icon: Users },
    { to: '/admin/orders', label: 'المدفوعات', icon: Wallet },
    { to: '/admin/appearance', label: 'تخصيص الموقع', icon: SettingsIcon },
  ];

  return (
    <div>
      <PageHeader title="نظرة عامة" description="ملخص سريع لحالة الموقع والتسجيلات والمدفوعات." />

      {!schemaReady && (
        <div className="mb-6 flex items-start gap-2 bg-red-50 border border-red-200 text-red-900 rounded-2xl p-4 text-sm">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">قاعدة البيانات تحتاج تحديثاً قبل استخدام اللوحة.</p>
            <p className="mt-1 leading-relaxed">
              الأسرع: شغّل <code className="bg-white/70 px-1 rounded" dir="ltr">supabase/apply_all.sql</code> مرة واحدة في Supabase SQL Editor.
              أو شغّل بالترتيب: <code className="bg-white/70 px-1 rounded" dir="ltr">schema.sql</code> ثم <code className="bg-white/70 px-1 rounded" dir="ltr">002_admin_payments.sql</code> ثم <code className="bg-white/70 px-1 rounded" dir="ltr">003_access_token.sql</code> ثم <code className="bg-white/70 px-1 rounded" dir="ltr">rls.sql</code>.
              {stats.schema?.missing?.length ? <span className="block mt-1 text-[11px]" dir="ltr">Missing: {stats.schema.missing.join(', ')}</span> : null}
            </p>
          </div>
        </div>
      )}

      <div className={payments.online_enabled
        ? 'mb-6 flex items-start gap-2 bg-green-50 border border-green-200 text-green-900 rounded-2xl p-4 text-sm'
        : 'mb-6 flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 text-sm'}>
        {payments.online_enabled ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <AlertTriangle size={18} className="mt-0.5 shrink-0" />}
        <div>
          {payments.online_enabled ? (
            <p><strong>الدفع الإلكتروني مفعّل</strong> ({payments.mode === 'live' ? 'وضع حقيقي' : 'Sandbox'}) — الطلبات المدفوعة تُحدَّث تلقائياً عبر Webhooks.</p>
          ) : (
            <p><strong>الدفع الإلكتروني غير مفعّل.</strong> التسجيلات تُحفظ كطلبات دفع معلّقة، ويمكنك تأكيدها يدوياً من صفحة المدفوعات. لتفعيل Paymob أو Fawry أضف مفاتيح المزود في متغيرات البيئة ثم فعّلها من صفحة المدفوعات.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="الكورسات" value={schemaReady ? stats.courses : '—'} icon={GraduationCap} hint="إجمالي الكورسات" />
        <StatCard label="التسجيلات" value={schemaReady ? stats.enrollments : '—'} icon={Users} tone="green" hint="جميع طلبات التسجيل" />
        <StatCard label="الطلبات" value={schemaReady ? stats.orders : '—'} icon={Wallet} tone="amber" hint={schemaReady ? `${stats.paidOrders} طلب مدفوع` : 'بانتظار تحديث قاعدة البيانات'} />
        <StatCard label="الإيرادات" value={schemaReady ? money(stats.revenue_cents) : '—'} icon={TrendingUp} tone="purple" hint="من الطلبات المدفوعة" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {quick.map((q) => (
          <Link key={q.to} to={q.to} className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-4 hover:border-brand-200 hover:shadow-sm transition">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center"><q.icon size={20} /></div>
            <span className="font-bold text-sm text-slate-700">{q.label}</span>
            <ArrowLeft size={15} className="mr-auto text-slate-300" />
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-brand-900">أحدث التسجيلات</h2>
            <Link to="/admin/enrollments" className="text-xs text-brand-600 hover:underline">عرض الكل</Link>
          </div>
          {stats.recentEnrollments.length === 0 ? (
            <EmptyState icon={Users} title="لا توجد تسجيلات بعد" description="ستظهر هنا التسجيلات الواردة من صفحة الكورسات." />
          ) : (
            <div className="space-y-2">
              {stats.recentEnrollments.map((e) => {
                const [label, tone] = ENROLLMENT_LABEL[e.status] || ENROLLMENT_LABEL.new;
                return (
                  <div key={e.id} className="flex items-center justify-between gap-2 border border-slate-100 rounded-xl px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-800 truncate">{e.student_name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{e.courses?.title || 'بدون كورس'} — {date(e.created_at)}</div>
                    </div>
                    <Badge tone={tone}>{label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-brand-900">أحدث الطلبات</h2>
            <Link to="/admin/orders" className="text-xs text-brand-600 hover:underline">عرض الكل</Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <EmptyState icon={Wallet} title="لا توجد طلبات بعد" description="تُنشأ الطلبات تلقائياً عند التسجيل في كورس مدفوع." />
          ) : (
            <div className="space-y-2">
              {stats.recentOrders.map((o) => {
                const [label, tone] = ORDER_LABEL[o.status] || ORDER_LABEL.pending;
                return (
                  <div key={o.id} className="flex items-center justify-between gap-2 border border-slate-100 rounded-xl px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-bold text-slate-800" dir="ltr">{o.order_number}</div>
                      <div className="text-[11px] text-slate-500">{o.customer_name || o.description} — {money(o.amount_cents)}</div>
                    </div>
                    <Badge tone={tone}>{label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-5 grid sm:grid-cols-3 gap-3">
        <Link to="/admin/content/subjects" className="flex items-center gap-2 text-sm bg-white border border-slate-100 rounded-xl px-4 py-3 hover:border-brand-200"><BookOpen size={17} className="text-brand-500" /> المواد الدراسية</Link>
        <Link to="/admin/media" className="flex items-center gap-2 text-sm bg-white border border-slate-100 rounded-xl px-4 py-3 hover:border-brand-200"><ImageIcon size={17} className="text-brand-500" /> مكتبة الوسائط</Link>
        <Link to="/admin/settings" className="flex items-center gap-2 text-sm bg-white border border-slate-100 rounded-xl px-4 py-3 hover:border-brand-200"><SettingsIcon size={17} className="text-brand-500" /> إعدادات الموقع</Link>
      </div>
    </div>
  );
}
