import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Users as UsersIcon, Shield, UserCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, PageHeader, Button, Modal, Field, Spinner, EmptyState, Badge, useToast } from '../ui';

const ROLE_LABEL = { admin: ['مدير', 'brand'], editor: ['محرر', 'amber'] };

export default function Users() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [me, setMe] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', role: 'editor', active: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api.adminUsers().then(setItems).catch((e) => { toast(e.message, 'error'); setItems([]); });
  }, [toast]);
  useEffect(() => { load(); api.me().then(setMe).catch(() => {}); }, [load]);

  const openCreate = () => {
    setForm({ username: '', password: '', role: 'editor', active: true });
    setEditing(null); setError(''); setOpen(true);
  };
  const openEdit = (u) => {
    setForm({ username: u.username, password: '', role: u.role || 'admin', active: !!u.active });
    setEditing(u); setError(''); setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true); setError('');
    try {
      if (editing) {
        const payload = { role: form.role, active: form.active ? 1 : 0 };
        if (form.password) payload.password = form.password;
        await api.updateUser(editing.id, payload);
      } else {
        await api.createUser({ username: form.username, password: form.password, role: form.role });
      }
      toast(editing ? 'تم تحديث المستخدم' : 'تمت إضافة المستخدم');
      setOpen(false); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const del = async (u) => {
    if (!window.confirm(`حذف المستخدم «${u.username}»؟`)) return;
    try { await api.deleteUser(u.id); toast('تم الحذف'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div>
      <PageHeader
        title="المستخدمون"
        description="حسابات لوحة التحكم. المدير يملك كل الصلاحيات، والمحرر يدير المحتوى والتسجيلات."
        actions={<Button icon={Plus} onClick={openCreate}>إضافة مستخدم</Button>}
      />

      <Card>
        {items === null ? <Spinner /> : items.length === 0 ? (
          <EmptyState icon={UsersIcon} title="لا يوجد مستخدمون" action={<Button icon={Plus} onClick={openCreate}>إضافة مستخدم</Button>} />
        ) : (
          <div className="divide-y divide-slate-50">
            {items.map((u) => {
              const [roleLabel, roleTone] = ROLE_LABEL[u.role] || ROLE_LABEL.editor;
              return (
                <div key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-bold">{u.username.slice(0, 1).toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      {u.username}
                      {me?.id === u.id && <Badge tone="brand">أنت</Badge>}
                    </div>
                    <div className="text-[11px] text-slate-500">آخر دخول: {u.last_login ? new Date(u.last_login).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</div>
                  </div>
                  <Badge tone={roleTone}>{roleLabel}</Badge>
                  <Badge tone={u.active ? 'green' : 'red'}>{u.active ? 'نشط' : 'معطّل'}</Badge>
                  <button onClick={() => openEdit(u)} className="p-2 rounded-lg text-slate-500 hover:bg-brand-50 hover:text-brand-700" title="تعديل"><Pencil size={16} /></button>
                  {me?.id !== u.id && <button onClick={() => del(u)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" title="حذف"><Trash2 size={16} /></button>}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'تعديل المستخدم' : 'إضافة مستخدم'}
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>إلغاء</Button><Button loading={saving} onClick={submit}>حفظ</Button></>}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="اسم المستخدم" required disabled={!!editing} value={form.username} onChange={(v) => setForm((f) => ({ ...f, username: v }))} dir="ltr" help={editing ? 'لا يمكن تغيير اسم المستخدم.' : 'حروف إنجليزية وأرقام ونقطة/شرطة.'} />
          <Field label={editing ? 'كلمة مرور جديدة (اتركها فارغة للإبقاء)' : 'كلمة المرور'} required={!editing} type="password" value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} help="8 أحرف على الأقل." />
          <Field label="الدور" type="select" value={form.role} onChange={(v) => setForm((f) => ({ ...f, role: v }))} options={[{ value: 'editor', label: 'محرر — محتوى وتسجيلات' }, { value: 'admin', label: 'مدير — كل الصلاحيات' }]} />
          {editing && <Field label="الحساب نشط" type="checkbox" value={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} />}
          <div className="text-xs bg-slate-50 border border-slate-100 rounded-xl p-3 text-slate-600 flex gap-2">
            <Shield size={16} className="shrink-0 text-brand-500" />
            <span>المحرر لا يستطيع إدارة المستخدمين أو سجل التغييرات أو تأكيد المدفوعات يدوياً.</span>
          </div>
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</div>}
          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </Modal>
    </div>
  );
}
