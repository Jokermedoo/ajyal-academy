import { api } from '../../lib/api';
import { CrudPage, Badge } from '../ui';

const money = (cents) => Number(cents) > 0
  ? new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(Number(cents) / 100)
  : 'مجاناً';

export default function CoursesAdmin() {
  return (
    <CrudPage
      title="الكورسات والدروس"
      description="أسعار الكورسات والسعة وحالة التسجيل — كل ما يظهر في صفحات الكورسات."
      list={api.adminCourses}
      create={api.createCourse}
      update={api.updateCourse}
      remove={api.deleteCourse}
      entity="courses"
      addLabel="إضافة كورس"
      emptyTitle="لا توجد كورسات بعد"
      emptyDescription="أضف كورساً بسعر وموعد وسعة ليظهر للزوار مع نموذج تسجيل."
      fields={[
        { name: 'title', label: 'عنوان الكورس', required: true },
        { name: 'slug', label: 'الرابط (slug)', help: 'حروف إنجليزية وأرقام وشرطات فقط. اتركه فارغاً للاستخدام بالرقم.', dir: 'ltr' },
        { name: 'description', label: 'الوصف', type: 'textarea', colSpan: 2 },
        { name: 'image', label: 'صورة الكورس', type: 'image', colSpan: 2 },
        { name: 'schedule', label: 'الموعد' },
        { name: 'duration', label: 'المدة' },
        { name: 'price_cents', label: 'السعر', type: 'money', help: 'اتركه صفراً للكورسات المجانية.' },
        { name: 'currency', label: 'العملة', type: 'select', options: [{ value: 'EGP', label: 'جنيه مصري (EGP)' }] },
        { name: 'capacity', label: 'السعة', type: 'number', help: 'صفر = بدون حد أقصى' },
        { name: 'age_min', label: 'أصغر عمر', type: 'number', nullable: true, min: 0, max: 99 },
        { name: 'age_max', label: 'أكبر عمر', type: 'number', nullable: true, min: 0, max: 99 },
        { name: 'is_open', label: 'التسجيل مفتوح', type: 'checkbox' },
        { name: 'visible', label: 'ظاهر في الموقع', type: 'checkbox' },
        { name: 'sort_order', label: 'الترتيب', type: 'number' },
        { name: 'seo_title', label: 'عنوان SEO', colSpan: 2 },
        { name: 'seo_description', label: 'وصف SEO', type: 'textarea', colSpan: 2, rows: 2 },
      ]}
      defaultValues={{ visible: 1, is_open: 1, currency: 'EGP', price_cents: 0, capacity: 0, sort_order: 0 }}
      columns={[
        {
          label: 'الكورس',
          render: (c) => (
            <div className="flex items-center gap-2">
              {c.image ? <img src={c.image} alt="" className="w-12 h-10 rounded-lg object-cover" /> : <div className="w-12 h-10 rounded-lg bg-slate-100" />}
              <div>
                <div className="font-bold text-slate-800">{c.title}</div>
                <div className="text-[11px] text-slate-500">{c.schedule || 'بدون موعد'} {c.capacity > 0 ? `— سعة ${c.capacity}` : ''}</div>
              </div>
            </div>
          ),
        },
        { label: 'السعر', render: (c) => <span className="font-bold text-brand-800">{money(c.price_cents)}</span> },
        {
          label: 'التسجيل',
          render: (c) => (
            <div className="flex flex-col gap-1 items-start">
              <Badge tone={c.is_open ? 'green' : 'slate'}>{c.is_open ? 'مفتوح' : 'مغلق'}</Badge>
              {c.visible ? null : <Badge tone="amber">مخفي</Badge>}
            </div>
          ),
        },
      ]}
    />
  );
}
