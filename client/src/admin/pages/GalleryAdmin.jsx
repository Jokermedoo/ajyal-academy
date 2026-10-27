import { api } from '../../lib/api';
import { CrudPage, Badge } from '../ui';

export default function GalleryAdmin() {
  return (
    <CrudPage
      title="معرض الصور"
      description="صور الأكاديمية. يمكنك رفع الصور وترتيبها وإخفاؤها."
      list={api.adminGallery}
      create={api.createGallery}
      update={api.updateGallery}
      remove={api.deleteGallery}
      entity="gallery"
      addLabel="إضافة صورة"
      emptyTitle="المعرض فارغ"
      emptyDescription="ارفع أول صورة لتظهر في معرض الأكاديمية."
      fields={[
        { name: 'image', label: 'الصورة', type: 'image', required: true, colSpan: 2, help: 'PNG / JPG / GIF / WEBP بحد أقصى 5MB' },
        { name: 'caption', label: 'التعليق', colSpan: 2 },
        { name: 'sort_order', label: 'الترتيب', type: 'number' },
        { name: 'visible', label: 'ظاهرة في الموقع', type: 'checkbox' },
      ]}
      defaultValues={{ sort_order: 0, visible: 1 }}
      columns={[
        {
          label: 'الصورة',
          render: (g) => (
            <div className="flex items-center gap-3">
              <img src={g.image} alt={g.caption || ''} className="w-16 h-12 rounded-lg object-cover border border-slate-100" />
              <span className="text-slate-700 text-sm">{g.caption || 'بدون تعليق'}</span>
            </div>
          ),
        },
        { label: 'الترتيب', render: (g) => <span className="text-slate-500">{g.sort_order}</span> },
        { label: 'الحالة', render: (g) => <Badge tone={g.visible ? 'green' : 'slate'}>{g.visible ? 'ظاهرة' : 'مخفية'}</Badge> },
      ]}
    />
  );
}
