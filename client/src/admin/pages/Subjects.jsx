import { api } from '../../lib/api';
import SubjectIcon from '../../components/SubjectIcon';
import { CrudPage, Badge } from '../ui';

const ICONS = [
  { value: 'BookA', label: 'كتاب (BookA)' },
  { value: 'Hash', label: 'أرقام (Hash)' },
  { value: 'Languages', label: 'لغات (Languages)' },
  { value: 'Calculator', label: 'آلة حاسبة (Calculator)' },
  { value: 'Brain', label: 'ذكاء (Brain)' },
  { value: 'Heart', label: 'قلب (Heart)' },
  { value: 'Palette', label: 'رسم (Palette)' },
  { value: 'FlaskConical', label: 'علوم (FlaskConical)' },
  { value: 'BookOpen', label: 'كتاب مفتوح (BookOpen)' },
];

export default function Subjects() {
  return (
    <CrudPage
      title="المواد الدراسية"
      description="أضف وعدّل مواد المنهج وترتيب ظهورها في الموقع."
      list={api.adminSubjects}
      create={api.createSubject}
      update={api.updateSubject}
      remove={api.deleteSubject}
      entity="subjects"
      addLabel="إضافة مادة"
      emptyTitle="لا توجد مواد بعد"
      emptyDescription="أضف أول مادة دراسية لتظهر في صفحة المنهج."
      fields={[
        { name: 'title', label: 'اسم المادة', required: true },
        { name: 'icon', label: 'الأيقونة', type: 'select', options: ICONS },
        { name: 'description', label: 'الوصف', type: 'textarea', colSpan: 2 },
        { name: 'image', label: 'صورة (اختياري)', type: 'image', colSpan: 2 },
        { name: 'sort_order', label: 'الترتيب', type: 'number' },
        { name: 'visible', label: 'ظاهرة في الموقع', type: 'checkbox' },
      ]}
      defaultValues={{ icon: 'BookOpen', sort_order: 0, visible: 1 }}
      columns={[
        {
          label: 'المادة',
          render: (s) => (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center"><SubjectIcon name={s.icon} size={19} /></div>
              <span className="font-bold text-slate-800">{s.title}</span>
            </div>
          ),
        },
        { label: 'الوصف', render: (s) => <span className="text-slate-500 text-xs line-clamp-2 max-w-xs block">{s.description || '—'}</span> },
        { label: 'الترتيب', render: (s) => <span className="text-slate-500">{s.sort_order}</span> },
        { label: 'الحالة', render: (s) => <Badge tone={s.visible ? 'green' : 'slate'}>{s.visible ? 'ظاهرة' : 'مخفية'}</Badge> },
      ]}
    />
  );
}
