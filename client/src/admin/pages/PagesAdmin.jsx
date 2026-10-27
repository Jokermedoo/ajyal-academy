import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, FileText, ExternalLink } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, PageHeader, Button, Modal, Field, Spinner, EmptyState, Badge, useToast } from '../ui';

const empty = { slug: '', title: '', content: '', seo_title: '', seo_description: '', visible: true };

export default function PagesAdmin() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api.adminPages().then(setItems).catch((e) => { toast(e.message, 'error'); setItems([]); });
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(empty); setEditing(null); setError(''); setOpen(true); };
  const openEdit = (p) => {
    setForm({ slug: p.slug, title: p.title, content: p.content || '', seo_title: p.seo_title || '', seo_description: p.seo_description || '', visible: !!p.visible });
    setEditing(p); setError(''); setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true); setError('');
    try {
      const payload = { ...form, visible: form.visible ? 1 : 0 };
      if (editing) await api.updatePage(editing.id, payload);
      else await api.createPage(payload);
      toast(editing ? 'تم تحديث الصفحة' : 'تمت إضافة الصفحة');
      setOpen(false); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const del = async (p) => {
    if (!window.confirm(`حذف صفحة «${p.title}»؟`)) return;
    try { await api.deletePage(p.id); toast('تم الحذف'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const toggle = async (p) => {
    try { await api.updatePage(p.id, { visible: p.visible ? 0 : 1 }); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div>
      <PageHeader
        title="الصفحات"
        description="صفحات المحتوى مثل الشروط والخصوصية والاسترجاع — تُعرض في /p/slug وتظهر في الفوتر."
        actions={<Button icon={Plus} onClick={openCreate}>إضافة صفحة</Button>}
      />

      <Card>
        {items === null ? <Spinner /> : items.length === 0 ? (
          <EmptyState icon={FileText} title="لا توجد صفحات" description="أضف صفحة الشروط أو الخصوصية أو الاسترجاع." action={<Button icon={Plus} onClick={openCreate}>إضافة صفحة</Button>} />
        ) : (
          <div className="divide-y divide-slate-50">
            {items.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center"><FileText size={18} /></div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-800 text-sm">{p.title}</div>
                  <div className="text-[11px] text-slate-500" dir="ltr">/p/{p.slug}</div>
                </div>
                <Badge tone={p.visible ? 'green' : 'slate'}>{p.visible ? 'ظاهرة' : 'مخفية'}</Badge>
                {p.visible && <a href={`/p/${p.slug}`} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-brand-700" title="معاينة"><ExternalLink size={16} /></a>}
                <button onClick={() => toggle(p)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" title={p.visible ? 'إخفاء' : 'إظهار'}>{p.visible ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                <button onClick={() => openEdit(p)} className="p-2 rounded-lg text-slate-500 hover:bg-brand-50 hover:text-brand-700" title="تعديل"><Pencil size={16} /></button>
                <button onClick={() => del(p)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" title="حذف"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'تعديل الصفحة' : 'إضافة صفحة'} wide
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>إلغاء</Button><Button loading={saving} onClick={submit}>حفظ</Button></>}>
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
          <Field label="العنوان" required value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} />
          <Field label="الرابط (slug)" required value={form.slug} onChange={(v) => setForm((f) => ({ ...f, slug: v }))} dir="ltr" placeholder="privacy" help="حروف إنجليزية وأرقام وشرطات." />
          <Field label="المحتوى" type="textarea" rows={12} value={form.content} onChange={(v) => setForm((f) => ({ ...f, content: v }))} className="sm:col-span-2" help="نص عادي — الأسطر الجديدة تظهر كما هي. لا يُسمح بـ HTML لأسباب أمنية." />
          <Field label="عنوان SEO" value={form.seo_title} onChange={(v) => setForm((f) => ({ ...f, seo_title: v }))} />
          <Field label="وصف SEO" value={form.seo_description} onChange={(v) => setForm((f) => ({ ...f, seo_description: v }))} />
          <Field label="ظاهرة للزوار" type="checkbox" value={form.visible} onChange={(v) => setForm((f) => ({ ...f, visible: v }))} />
          {error && <div className="sm:col-span-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</div>}
          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </Modal>
    </div>
  );
}
