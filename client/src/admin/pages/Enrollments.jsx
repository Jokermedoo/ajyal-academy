import { useCallback, useEffect, useState } from 'react';
import { Download, Search, Trash2, Eye, Loader2, Users } from 'lucide-react';
import { api, enrollmentsCsvUrl } from '../../lib/api';
import { Card, PageHeader, Badge, Spinner, EmptyState, Modal, Button, Field, useToast } from '../ui';

const STATUS = {
  new: ['جديد', 'brand'],
  contacted: ['تم التواصل', 'amber'],
  confirmed: ['مؤكد', 'green'],
  cancelled: ['ملغي', 'red'],
  completed: ['مكتمل', 'purple'],
};
const date = (v) => v ? new Date(v).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function Enrollments() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.adminEnrollments(status).then(setItems).catch((e) => { toast(e.message, 'error'); setItems([]); });
  }, [status, toast]);

  useEffect(() => { load(); }, [load]);

  const open = (item) => { setSelected(item); setNotes(item.notes || ''); };

  const save = async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      await api.updateEnrollment(selected.id, { status: selected.status, notes });
      toast('تم تحديث التسجيل');
      setSelected(null);
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const changeStatus = async (item, value) => {
    try { await api.updateEnrollment(item.id, { status: value }); toast('تم تحديث الحالة'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const del = async (item) => {
    if (!window.confirm(`حذف تسجيل «${item.student_name}»؟`)) return;
    try { await api.deleteEnrollment(item.id); toast('تم الحذف'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const filtered = (items || []).filter((e) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return [e.student_name, e.phone, e.guardian_name, e.courses?.title, e.email].some((v) => String(v || '').toLowerCase().includes(q));
  });

  return (
    <div>
      <PageHeader
        title="التسجيلات"
        description="طلبات التسجيل الواردة من الموقع. غيّر الحالة وتابع كل طالب."
        actions={
          <>
            <div className="relative">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو الهاتف..." className="w-44 sm:w-60 border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-200" />
            </div>
            <a href={enrollmentsCsvUrl + (status ? '?status=' + status : '')} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:border-brand-300">
              <Download size={16} /> CSV
            </a>
          </>
        }
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {[['', 'الكل'], ...Object.entries(STATUS).map(([k, v]) => [k, v[0]])].map(([value, label]) => (
          <button key={value} onClick={() => setStatus(value)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${status === value ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}>
            {label}
          </button>
        ))}
      </div>

      <Card>
        {items === null ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState icon={Users} title={items.length ? 'لا توجد نتائج' : 'لا توجد تسجيلات'} description={items.length ? 'جرّب تغيير الفلتر أو البحث.' : 'ستظهر هنا طلبات التسجيل من صفحة الكورسات.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="text-right text-xs text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-3 font-medium">الطالب</th>
                  <th className="px-4 py-3 font-medium">الكورس</th>
                  <th className="px-4 py-3 font-medium">الهاتف</th>
                  <th className="px-4 py-3 font-medium">التاريخ</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                  <th className="px-4 py-3 font-medium w-24">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const [label, tone] = STATUS[e.status] || STATUS.new;
                  return (
                    <tr key={e.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{e.student_name}</div>
                        <div className="text-[11px] text-slate-500">{e.student_age ? `العمر ${e.student_age}` : ''} {e.guardian_name ? `— ${e.guardian_name}` : ''}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{e.courses?.title || '—'}</td>
                      <td className="px-4 py-3"><a href={`tel:${e.phone}`} className="text-brand-700 hover:underline" dir="ltr">{e.phone}</a></td>
                      <td className="px-4 py-3 text-[11px] text-slate-500">{date(e.created_at)}</td>
                      <td className="px-4 py-3">
                        <select value={e.status} onChange={(ev) => changeStatus(e, ev.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white">
                          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v[0]}</option>)}
                        </select>
                        <div className="mt-1"><Badge tone={tone}>{label}</Badge></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => open(e)} className="p-2 rounded-lg text-slate-500 hover:bg-brand-50 hover:text-brand-700" title="تفاصيل"><Eye size={16} /></button>
                          <button onClick={() => del(e)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" title="حذف"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="تفاصيل التسجيل"
        footer={<><Button variant="secondary" onClick={() => setSelected(null)}>إغلاق</Button><Button loading={saving} onClick={save}>حفظ</Button></>}>
        {selected && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <Info label="الطالب" value={selected.student_name} />
              <Info label="العمر" value={selected.student_age || '—'} />
              <Info label="ولي الأمر" value={selected.guardian_name || '—'} />
              <Info label="الهاتف" value={<a href={`tel:${selected.phone}`} className="text-brand-700" dir="ltr">{selected.phone}</a>} />
              <Info label="البريد" value={selected.email || '—'} />
              <Info label="الكورس" value={selected.courses?.title || '—'} />
              <Info label="تاريخ التسجيل" value={date(selected.created_at)} />
              <Info label="آخر تحديث" value={date(selected.updated_at)} />
            </div>
            <Field label="الحالة" type="select" value={selected.status} onChange={(v) => setSelected((s) => ({ ...s, status: v }))} options={Object.entries(STATUS).map(([value, v]) => ({ value, label: v[0] }))} />
            <Field label="ملاحظات داخلية" type="textarea" value={notes} onChange={setNotes} rows={4} />
          </div>
        )}
      </Modal>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-xl px-3 py-2">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="font-medium text-slate-800 mt-0.5">{value}</div>
    </div>
  );
}
