import { useEffect, useState } from 'react';
import { RefreshCw, History, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, PageHeader, Button, Spinner, EmptyState, Badge, useToast } from '../ui';

const ACTION = { create: ['إنشاء', 'green'], update: ['تعديل', 'brand'], delete: ['حذف', 'red'], reorder: ['ترتيب', 'purple'] };
const ENTITY = {
  subject: 'مادة', activity: 'نشاط', gallery: 'صورة معرض', course: 'كورس', navigation: 'رابط',
  section: 'قسم', page: 'صفحة', media: 'وسائط', enrollment: 'تسجيل', order: 'طلب',
  user: 'مستخدم', settings: 'إعدادات', password: 'كلمة مرور', enrollment_public: 'تسجيل عام',
};
const date = (v) => v ? new Date(v).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function Audit() {
  const toast = useToast();
  const [items, setItems] = useState(null);

  const load = () => api.adminAudit(200).then(setItems).catch((e) => { toast(e.message, 'error'); setItems([]); });
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <PageHeader
        title="سجل التغييرات"
        description="من عدّل ماذا ومتى — آخر 200 عملية."
        actions={<Button variant="secondary" icon={RefreshCw} onClick={load}>تحديث</Button>}
      />

      <Card>
        {items === null ? <Spinner /> : items.length === 0 ? (
          <EmptyState icon={History} title="السجل فارغ" description="ستظهر هنا كل عمليات الإضافة والتعديل والحذف." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-right text-xs text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-3 font-medium">التاريخ</th>
                  <th className="px-4 py-3 font-medium">المستخدم</th>
                  <th className="px-4 py-3 font-medium">الإجراء</th>
                  <th className="px-4 py-3 font-medium">العنصر</th>
                  <th className="px-4 py-3 font-medium">تفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => {
                  const [actionLabel, tone] = ACTION[a.action] || [a.action, 'slate'];
                  return (
                    <tr key={a.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">{date(a.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-700"><ShieldCheck size={14} className="text-brand-500" /> {a.username || 'النظام'}</div>
                      </td>
                      <td className="px-4 py-3"><Badge tone={tone}>{actionLabel}</Badge></td>
                      <td className="px-4 py-3 text-slate-600">{ENTITY[a.entity] || a.entity || '—'} {a.entity_id ? <span className="text-slate-400 text-[11px]">#{a.entity_id}</span> : null}</td>
                      <td className="px-4 py-3">
                        {a.details && Object.keys(a.details).length ? (
                          <details>
                            <summary className="text-[11px] text-brand-600 cursor-pointer">عرض</summary>
                            <pre className="text-[10px] bg-slate-50 rounded-lg p-2 mt-1 max-w-xs overflow-x-auto" dir="ltr">{JSON.stringify(a.details, null, 2)}</pre>
                          </details>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
