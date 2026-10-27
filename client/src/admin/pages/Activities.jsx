import { api } from '../../lib/api';
import { CrudPage, Badge } from '../ui';

export default function Activities() {
  return (
    <CrudPage
      title="الأنشطة"
      description="أنشطة الأكاديمية وفعالياتها التي تظهر في الموقع."
      list={api.adminActivities}
      create={api.createActivity}
      update={api.updateActivity}
      remove={api.deleteActivity}
      addLabel="إضافة نشاط"
      emptyTitle="لا توجد أنشطة بعد"
      emptyDescription="أضف أول نشاط ليظهر في صفحة الأنشطة."
      fields={[
        { name: 'title', label: 'عنوان النشاط', required: true },
        { name: 'event_date', label: 'التاريخ (نص)' },
        { name: 'description', label: 'الوصف', type: 'textarea', colSpan: 2 },
        { name: 'image', label: 'صورة النشاط', type: 'image', colSpan: 2 },
        { name: 'visible', label: 'ظاهر في الموقع', type: 'checkbox' },
      ]}
      defaultValues={{ visible: 1 }}
      columns={[
        {
          label: 'النشاط',
          render: (a) => (
            <div className="flex items-center gap-2">
              {a.image ? <img src={a.image} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-slate-100" />}
              <div>
                <div className="font-bold text-slate-800">{a.title}</div>
                {a.event_date && <div className="text-[11px] text-slate-500">{a.event_date}</div>}
              </div>
            </div>
          ),
        },
        { label: 'الوصف', render: (a) => <span className="text-slate-500 text-xs line-clamp-2 max-w-sm block">{a.description || '—'}</span> },
        { label: 'الحالة', render: (a) => <Badge tone={a.visible ? 'green' : 'slate'}>{a.visible ? 'ظاهر' : 'مخفي'}</Badge> },
      ]}
    />
  );
}
