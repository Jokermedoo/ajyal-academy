import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import {
  Loader2, X, CheckCircle2, AlertCircle, Upload, Plus, Pencil, Trash2,
  ChevronUp, ChevronDown, Search, Image as ImageIcon, Eye, EyeOff, Link2,
} from 'lucide-react';
import { api } from '../lib/api';

export const cx = (...c) => c.filter(Boolean).join(' ');

// ---------- Toasts ----------
const ToastCtx = createContext(() => {});
export function useToast() { return useContext(ToastCtx); }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 left-4 z-[70] space-y-2 max-w-sm" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={cx(
            'flex items-start gap-2 rounded-xl border px-4 py-3 shadow-lg text-sm bg-white',
            t.type === 'error' ? 'border-red-200 text-red-800' : 'border-green-200 text-green-800'
          )}>
            {t.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={18} className="shrink-0 mt-0.5" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ---------- Buttons ----------
const BTN = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-200',
  secondary: 'bg-white border border-slate-200 text-slate-700 hover:border-brand-300 hover:text-brand-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-slate-600 hover:bg-slate-100',
  success: 'bg-green-600 text-white hover:bg-green-700',
};

export function Button({ variant = 'primary', size = 'md', loading, icon: Icon, children, className, type = 'button', ...props }) {
  return (
    <button
      type={type}
      disabled={loading || props.disabled}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition disabled:opacity-60 disabled:cursor-not-allowed',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm',
        BTN[variant],
        className
      )}
      {...props}
    >
      {loading ? <Loader2 size={size === 'sm' ? 14 : 17} className="animate-spin" /> : Icon ? <Icon size={size === 'sm' ? 14 : 17} /> : null}
      {children}
    </button>
  );
}

// ---------- Inputs ----------
export function Field({ label, value, onChange, type = 'text', options = [], help, required, placeholder, rows = 4, min, max, step, className, disabled, dir }) {
  const id = useId();
  const base = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300 disabled:bg-slate-50';
  if (type === 'checkbox') {
    return (
      <label htmlFor={id} className={cx('flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 cursor-pointer', className)}>
        <input id={id} type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-brand-600" />
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {help && <span className="text-[11px] text-slate-400">{help}</span>}
      </label>
    );
  }
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea id={id} rows={rows} required={required} disabled={disabled} placeholder={placeholder} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={base} />
      ) : type === 'select' ? (
        <select id={id} required={required} disabled={disabled} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={base}>
          {options.map((o) => {
            const opt = typeof o === 'string' ? { value: o, label: o } : o;
            return <option key={opt.value} value={opt.value}>{opt.label}</option>;
          })}
        </select>
      ) : type === 'money' ? (
        <div className="relative">
          <input id={id} type="number" min="0" step="0.01" disabled={disabled} value={value === '' || value == null ? '' : Number(value) / 100}
            onChange={(e) => onChange(e.target.value === '' ? 0 : Math.round(Number(e.target.value) * 100))} className={cx(base, 'pl-12')} />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">جنيه</span>
        </div>
      ) : type === 'color' ? (
        <div className="flex items-center gap-2">
          <input id={id} type="color" value={value || '#1e6fe6'} onChange={(e) => onChange(e.target.value)} className="w-11 h-11 rounded-xl border border-slate-200 bg-white p-1 cursor-pointer" />
          <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} className={cx(base, 'font-mono')} dir="ltr" placeholder="#1e6fe6" />
        </div>
      ) : (
        <input id={id} type={type} min={min} max={max} step={step} required={required} disabled={disabled} placeholder={placeholder} dir={dir} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={base} />
      )}
      {help && <p className="mt-1 text-[11px] text-slate-400">{help}</p>}
    </div>
  );
}

export async function uploadImage(file) {
  const res = await api.upload(file);
  try {
    await api.createMedia({ url: res.url, mime: file.type || '', size: file.size || 0, alt: '' });
  } catch { /* media library is best-effort */ }
  return res.url;
}

export function ImageField({ label = 'الصورة', value, onChange, help, className }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef(null);

  const pick = async (file) => {
    if (!file || busy) return;
    setBusy(true); setError('');
    try { onChange(await uploadImage(file)); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); if (ref.current) ref.current.value = ''; }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="flex gap-2">
        <input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="https://..." dir="ltr" className="flex-1 min-w-0 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
        <label className={cx('inline-flex items-center gap-1 px-3 py-2.5 rounded-xl text-sm font-bold cursor-pointer shrink-0', busy ? 'bg-slate-100 text-slate-400' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} رفع
          <input ref={ref} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" disabled={busy} onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])} />
        </label>
        {value && (
          <button type="button" onClick={() => onChange('')} className="px-2 text-slate-400 hover:text-red-600" title="مسح">
            <X size={18} />
          </button>
        )}
      </div>
      {help && <p className="mt-1 text-[11px] text-slate-400">{help}</p>}
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
      {value && <img src={value} alt="معاينة" className="mt-2 h-24 rounded-xl object-cover border border-slate-100" />}
    </div>
  );
}

// ---------- Layout helpers ----------
export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-900">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className }) {
  return <div className={cx('bg-white rounded-2xl border border-slate-100 shadow-sm', className)}>{children}</div>;
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500">{label}</div>
          <div className="mt-1 text-2xl font-extrabold text-brand-900">{value}</div>
          {hint && <div className="text-[11px] text-slate-400 mt-1">{hint}</div>}
        </div>
        {Icon && <div className={cx('w-10 h-10 rounded-xl flex items-center justify-center', tones[tone])}><Icon size={20} /></div>}
      </div>
    </Card>
  );
}

export function Badge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
    brand: 'bg-brand-50 text-brand-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return <span className={cx('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold', tones[tone])}>{children}</span>;
}

export function EmptyState({ icon: Icon = ImageIcon, title, description, action }) {
  return (
    <div className="text-center py-14 px-4">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center"><Icon size={28} /></div>
      <h3 className="mt-4 font-bold text-slate-700">{title}</h3>
      {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Spinner({ label = 'جاري التحميل...' }) {
  return <div className="flex items-center justify-center gap-2 py-16 text-slate-500"><Loader2 className="animate-spin" size={20} /> {label}</div>;
}

export function Modal({ open, onClose, title, children, footer, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={cx('bg-white rounded-2xl shadow-2xl w-full my-6', wide ? 'max-w-3xl' : 'max-w-xl')} role="dialog" aria-modal="true" aria-label={title}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="font-extrabold text-brand-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="إغلاق"><X size={19} /></button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="border-t border-slate-100 px-5 py-4 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

// ---------- Generic CRUD page ----------
export function CrudPage({
  title, description, list, create, update, remove,
  fields, columns, entity, searchKeys = ['title'], defaultValues = {},
  addLabel = 'إضافة جديد', emptyTitle = 'لا توجد عناصر بعد', emptyDescription,
  rowTitle = (item) => item.title,
}) {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    list().then(setItems).catch((e) => { toast(e.message, 'error'); setItems([]); });
  }, [list, toast]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    const initial = { ...defaultValues };
    for (const f of fields) if (f.type === 'checkbox' && initial[f.name] === undefined) initial[f.name] = false;
    setForm(initial); setEditing(null); setError(''); setOpen(true);
  };

  const openEdit = (item) => {
    const initial = {};
    for (const f of fields) {
      const v = item[f.name];
      initial[f.name] = f.type === 'checkbox' ? !!(Number(v) || v === true) : (v ?? '');
    }
    setForm(initial); setEditing(item); setError(''); setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true); setError('');
    try {
      const payload = {};
      for (const f of fields) {
        let v = form[f.name];
        if (f.type === 'checkbox') v = v ? 1 : 0;
        else if (f.type === 'money') v = Math.round(Number(v || 0));
        else if (f.type === 'number') v = v === '' || v === null || v === undefined ? (f.nullable ? null : undefined) : Number(v);
        if (v !== undefined) payload[f.name] = v;
      }
      if (editing) await update(editing.id, payload);
      else await create(payload);
      toast(editing ? 'تم تحديث العنصر' : 'تمت الإضافة بنجاح');
      setOpen(false);
      load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const del = async (item) => {
    if (!window.confirm(`هل تريد حذف «${rowTitle(item)}»؟ لا يمكن التراجع.`)) return;
    try { await remove(item.id); toast('تم الحذف'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const toggleVisible = async (item) => {
    try { await update(item.id, { visible: item.visible ? 0 : 1 }); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const move = async (index, dir) => {
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    try { await api.reorder(entity, next.map((x) => x.id)); }
    catch (e) { toast(e.message, 'error'); load(); }
  };

  const hasVisible = fields.some((f) => f.name === 'visible');
  const filtered = (items || []).filter((item) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return searchKeys.some((k) => String(item[k] ?? '').toLowerCase().includes(q));
  });

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <div className="relative">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." className="w-40 sm:w-56 border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-200" />
            </div>
            <Button icon={Plus} onClick={openCreate}>{addLabel}</Button>
          </>
        }
      />

      <Card>
        {items === null ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState icon={ImageIcon} title={items.length ? 'لا توجد نتائج مطابقة' : emptyTitle} description={items.length ? undefined : emptyDescription} action={<Button icon={Plus} onClick={openCreate}>{addLabel}</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-right text-xs text-slate-500 border-b border-slate-100">
                  {entity && <th className="px-3 py-3 w-16">الترتيب</th>}
                  {columns.map((c) => <th key={c.label} className="px-4 py-3 font-medium">{c.label}</th>)}
                  <th className="px-4 py-3 font-medium w-32">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    {entity && (
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => move(i, -1)} disabled={i === 0} className="text-slate-300 hover:text-brand-600 disabled:opacity-30" aria-label="أعلى"><ChevronUp size={15} /></button>
                          <button onClick={() => move(i, 1)} disabled={i === filtered.length - 1} className="text-slate-300 hover:text-brand-600 disabled:opacity-30" aria-label="أسفل"><ChevronDown size={15} /></button>
                        </div>
                      </td>
                    )}
                    {columns.map((c) => <td key={c.label} className="px-4 py-3 align-middle">{c.render(item)}</td>)}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(item)} className="p-2 rounded-lg text-slate-500 hover:bg-brand-50 hover:text-brand-700" title="تعديل"><Pencil size={16} /></button>
                        {hasVisible && (
                          <button onClick={() => toggleVisible(item)} className={cx('p-2 rounded-lg', item.visible ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100')} title={item.visible ? 'إخفاء' : 'إظهار'}>
                            {item.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                        )}
                        <button onClick={() => del(item)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" title="حذف"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `تعديل: ${rowTitle(editing)}` : addLabel} wide
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>إلغاء</Button><Button loading={saving} onClick={submit}>حفظ</Button></>}>
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
          {fields.map((f) => {
            if (f.type === 'image') {
              return <ImageField key={f.name} label={f.label} help={f.help} value={form[f.name]} onChange={(v) => setForm((s) => ({ ...s, [f.name]: v }))} className={f.colSpan === 2 ? 'sm:col-span-2' : ''} />;
            }
            return (
              <Field key={f.name} label={f.label} help={f.help} required={f.required} type={f.type || 'text'}
                options={f.options} min={f.min} max={f.max} rows={f.rows} dir={f.dir} placeholder={f.placeholder}
                value={form[f.name]} onChange={(v) => setForm((s) => ({ ...s, [f.name]: v }))}
                className={f.colSpan === 2 ? 'sm:col-span-2' : ''} />
            );
          })}
          {error && <div className="sm:col-span-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</div>}
          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </Modal>
    </div>
  );
}
