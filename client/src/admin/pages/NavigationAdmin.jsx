import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, Link2, ExternalLink } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, PageHeader, Button, Modal, Field, Spinner, EmptyState, Badge, useToast } from '../ui';

const TARGETS = [{ value: '_self', label: 'نفس النافذة' }, { value: '_blank', label: 'نافذة جديدة' }];

export default function NavigationAdmin() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [tab, setTab] = useState('header');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ label: '', href: '', location: 'header', target: '_self', sort_order: 0, visible: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api.adminNavigation().then(setItems).catch((e) => { toast(e.message, 'error'); setItems([]); });
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const filtered = (items || []).filter((n) => n.location === tab);

  const openCreate = () => {
    setForm({ label: '', href: '', location: tab, target: '_self', sort_order: filtered.length + 1, visible: true });
    setEditing(null); setError(''); setOpen(true);
  };
  const openEdit = (n) => {
    setForm({ ...n, visible: !!n.visible }); setEditing(n); setError(''); setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true); setError('');
    try {
      const payload = { label: form.label, href: form.href, location: form.location, target: form.target, sort_order: Number(form.sort_order || 0), visible: form.visible ? 1 : 0 };
      if (editing) await api.updateNavigation(editing.id, payload);
      else await api.createNavigation(payload);
      toast(editing ? 'تم تحديث الرابط' : 'تمت إضافة الرابط');
      setOpen(false); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const del = async (n) => {
    if (!window.confirm(`حذف رابط «${n.label}»؟`)) return;
    try { await api.deleteNavigation(n.id); toast('تم الحذف'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const move = async (index, dir) => {
    const next = [...filtered];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setItems((all) => all.map((n) => next.find((x) => x.id === n.id) || n));
    try { await api.reorder('navigation', next.map((n) => n.id)); load(); }
    catch (e) { toast(e.message, 'error'); load(); }
  };

  return (
    <div>
      <PageHeader
        title="قوائم الموقع"
        description="روابط الهيدر والفوتر — تظهر فوراً في الموقع."
        actions={<Button icon={Plus} onClick={openCreate}>إضافة رابط</Button>}
      />

      <div className="flex gap-2 mb-4">
        {[['header', 'القائمة الرئيسية (Header)'], ['footer', 'قائمة الفوتر']].map(([value, label]) => (
          <button key={value} onClick={() => setTab(value)} className={`px-4 py-2 rounded-xl text-sm font-bold border transition ${tab === value ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}>{label}</button>
        ))}
      </div>

      <Card>
        {items === null ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState icon={Link2} title="لا توجد روابط" description="أضف رابطاً ليظهر في القائمة." action={<Button icon={Plus} onClick={openCreate}>إضافة رابط</Button>} />
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((n, i) => (
              <div key={n.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="text-slate-300 hover:text-brand-600 disabled:opacity-30" aria-label="أعلى"><ChevronUp size={15} /></button>
                  <button onClick={() => move(i, 1)} disabled={i === filtered.length - 1} className="text-slate-300 hover:text-brand-600 disabled:opacity-30" aria-label="أسفل"><ChevronDown size={15} /></button>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-800 text-sm">{n.label}</div>
                  <div className="text-[11px] text-slate-500 truncate" dir="ltr">{n.href}</div>
                </div>
                {n.target === '_blank' && <Badge tone="purple">نافذة جديدة</Badge>}
                <Badge tone={n.visible ? 'green' : 'slate'}>{n.visible ? 'ظاهر' : 'مخفي'}</Badge>
                {n.href.startsWith('/') && <a href={n.href} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-brand-700" title="معاينة"><ExternalLink size={16} /></a>}
                <button onClick={() => openEdit(n)} className="p-2 rounded-lg text-slate-500 hover:bg-brand-50 hover:text-brand-700" title="تعديل"><Pencil size={16} /></button>
                <button onClick={() => del(n)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" title="حذف"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'تعديل الرابط' : 'إضافة رابط'}
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>إلغاء</Button><Button loading={saving} onClick={submit}>حفظ</Button></>}>
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
          <Field label="الاسم" required value={form.label} onChange={(v) => setForm((f) => ({ ...f, label: v }))} />
          <Field label="الرابط" required value={form.href} onChange={(v) => setForm((f) => ({ ...f, href: v }))} dir="ltr" placeholder="/about" help="رابط داخلي يبدأ بـ / أو رابط خارجي كامل." />
          <Field label="القائمة" type="select" value={form.location} onChange={(v) => setForm((f) => ({ ...f, location: v }))} options={[{ value: 'header', label: 'الهيدر' }, { value: 'footer', label: 'الفوتر' }]} />
          <Field label="فتح الرابط" type="select" value={form.target} onChange={(v) => setForm((f) => ({ ...f, target: v }))} options={TARGETS} />
          <Field label="الترتيب" type="number" value={form.sort_order} onChange={(v) => setForm((f) => ({ ...f, sort_order: v }))} />
          <Field label="ظاهر في الموقع" type="checkbox" value={form.visible} onChange={(v) => setForm((f) => ({ ...f, visible: v }))} />
          {error && <div className="sm:col-span-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</div>}
          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </Modal>
    </div>
  );
}
