import { useCallback, useEffect, useState } from 'react';
import { Search, Trash2, Eye, RefreshCw, Wallet, ShieldCheck, AlertTriangle, Plus, Copy, Link2 } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, PageHeader, Badge, Spinner, EmptyState, Modal, Button, Field, useToast } from '../ui';

const STATUS = {
  pending: ['بانتظار الدفع', 'amber'],
  paid: ['مدفوع', 'green'],
  failed: ['فاشل', 'red'],
  cancelled: ['ملغي', 'slate'],
  refunded: ['مسترد', 'purple'],
};
const ORDER_TYPE_LABELS = {
  course: 'رسوم كورس',
  monthly: 'اشتراك شهري',
  deposit: 'عربون / دفعة مقدمة',
  activity: 'رسوم نشاط',
  other: 'أخرى',
};
const EMPTY_ORDER = { order_type: 'monthly', description: '', customer_name: '', phone: '', email: '', amount_cents: 0 };
const money = (cents, currency = 'EGP') => new Intl.NumberFormat('ar-EG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(cents || 0) / 100);
const date = (v) => v ? new Date(v).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const paymentLink = (o) => `${window.location.origin}/payment/${encodeURIComponent(o.order_number)}?token=${encodeURIComponent(o.access_token || '')}`;

export default function Orders() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [events, setEvents] = useState([]);
  const [busy, setBusy] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [created, setCreated] = useState(null);
  const [form, setForm] = useState(EMPTY_ORDER);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.adminOrders(status).then(setItems).catch((e) => { toast(e.message, 'error'); setItems([]); });
  }, [status, toast]);

  useEffect(() => { load(); }, [load]);

  const open = async (order) => {
    setSelected(order); setEvents([]);
    try { setEvents(await api.orderEvents(order.id)); } catch { /* ignore */ }
  };

  const act = async (action, order) => {
    const messages = {
      paid: 'تأكيد أن المبلغ وصل فعلياً؟ سيتم تحويل الطلب إلى «مدفوع» وتأكيد التسجيل.',
      refunded: 'تحويل الطلب إلى «مسترد»؟',
      cancelled: 'إلغاء الطلب؟',
      delete: 'حذف الطلب نهائياً؟',
    };
    if (!window.confirm(messages[action])) return;
    setBusy(action);
    try {
      if (action === 'paid') await api.markOrderPaid(order.id);
      else if (action === 'delete') await api.deleteOrder(order.id);
      else await api.updateOrder(order.id, { status: action });
      toast('تم تحديث الطلب');
      setSelected(null);
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setBusy(''); }
  };

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const openCreate = () => { setForm(EMPTY_ORDER); setCreateOpen(true); };

  const copyLink = async (order) => {
    try {
      await navigator.clipboard.writeText(paymentLink(order));
      toast('تم نسخ رابط الدفع');
    } catch {
      toast('تعذر نسخ الرابط — يمكنك نسخه يدوياً', 'error');
    }
  };

  const submitCreate = async () => {
    if (saving) return;
    if (!form.customer_name.trim() || !form.phone.trim() || !form.email.trim()) {
      toast('أدخل اسم العميل ورقم الهاتف والبريد الإلكتروني', 'error');
      return;
    }
    if (!(Number(form.amount_cents) > 0)) {
      toast('أدخل مبلغاً أكبر من صفر', 'error');
      return;
    }
    setSaving(true);
    try {
      const item = await api.createOrder(form);
      setCreated(item);
      setCreateOpen(false);
      setForm(EMPTY_ORDER);
      toast('تم إنشاء الطلب ورابط الدفع');
      load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const filtered = (items || []).filter((o) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return [o.order_number, o.customer_name, o.phone, o.description].some((v) => String(v || '').toLowerCase().includes(q));
  });

  return (
    <div>
      <PageHeader
        title="المدفوعات والطلبات"
        description="كل طلب دفع: الحالة، البوابة، والمبلغ. الدفع الإلكتروني يُحدَّث تلقائياً عبر Webhooks."
        actions={
          <>
            <Button icon={Plus} onClick={openCreate}>إنشاء طلب دفع</Button>
            <div className="relative">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="رقم الطلب أو الاسم..." className="w-44 sm:w-60 border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-200" />
            </div>
            <Button variant="secondary" icon={RefreshCw} onClick={load}>تحديث</Button>
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
          <EmptyState icon={Wallet} title={items.length ? 'لا توجد نتائج' : 'لا توجد طلبات'} description={items.length ? 'جرّب تغيير الفلتر.' : 'تُنشأ الطلبات تلقائياً عند التسجيل في كورس مدفوع، أو أنشئ طلب دفع يدوياً من الزر أعلى الصفحة.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[820px]">
              <thead>
                <tr className="text-right text-xs text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-3 font-medium">الطلب</th>
                  <th className="px-4 py-3 font-medium">العميل</th>
                  <th className="px-4 py-3 font-medium">المبلغ</th>
                  <th className="px-4 py-3 font-medium">البوابة</th>
                  <th className="px-4 py-3 font-medium">التاريخ</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                  <th className="px-4 py-3 font-medium w-24">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const [label, tone] = STATUS[o.status] || STATUS.pending;
                  return (
                    <tr key={o.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs font-bold text-slate-800" dir="ltr">{o.order_number}</div>
                        <div className="text-[11px] text-slate-500">{o.description || o.order_type}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{o.customer_name || '—'}</div>
                        <div className="text-[11px] text-slate-500" dir="ltr">{o.phone}</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-brand-800">{money(o.amount_cents, o.currency)}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 capitalize">{o.provider || '—'}</td>
                      <td className="px-4 py-3 text-[11px] text-slate-500">{date(o.created_at)}</td>
                      <td className="px-4 py-3"><Badge tone={tone}>{label}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => open(o)} className="p-2 rounded-lg text-slate-500 hover:bg-brand-50 hover:text-brand-700" title="تفاصيل"><Eye size={16} /></button>
                          {o.status === 'pending' && o.access_token && (
                            <button onClick={() => copyLink(o)} className="p-2 rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-700" title="نسخ رابط الدفع"><Copy size={16} /></button>
                          )}
                          <button onClick={() => act('delete', o)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" title="حذف"><Trash2 size={16} /></button>
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

      <Modal open={!!selected} onClose={() => setSelected(null)} title="تفاصيل الطلب" wide
        footer={selected && (
          <>
            <Button variant="secondary" onClick={() => setSelected(null)}>إغلاق</Button>
            {selected.status === 'pending' && <Button icon={ShieldCheck} loading={busy === 'paid'} onClick={() => act('paid', selected)}>تأكيد الدفع يدوياً</Button>}
            {selected.status === 'paid' && <Button variant="secondary" onClick={() => act('refunded', selected)}>تسجيل استرداد</Button>}
            {selected.status !== 'cancelled' && selected.status !== 'paid' && <Button variant="secondary" onClick={() => act('cancelled', selected)}>إلغاء</Button>}
          </>
        )}>
        {selected && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <Info label="رقم الطلب" value={<span className="font-mono" dir="ltr">{selected.order_number}</span>} />
              <Info label="الحالة" value={<Badge tone={(STATUS[selected.status] || STATUS.pending)[1]}>{(STATUS[selected.status] || STATUS.pending)[0]}</Badge>} />
              <Info label="العميل" value={selected.customer_name || '—'} />
              <Info label="الهاتف" value={selected.phone || '—'} />
              <Info label="البريد" value={selected.email || '—'} />
              <Info label="المبلغ" value={money(selected.amount_cents, selected.currency)} />
              <Info label="البوابة" value={selected.provider || '—'} />
              <Info label="مرجع المزود" value={selected.provider_ref || '—'} />
              <Info label="تاريخ الإنشاء" value={date(selected.created_at)} />
              <Info label="تاريخ الدفع" value={date(selected.paid_at)} />
            </div>
            {selected.access_token && selected.status === 'pending' && (
              <div className="bg-brand-50/60 border border-brand-100 rounded-xl p-3">
                <div className="flex items-center gap-1 text-xs font-bold text-brand-900 mb-1"><Link2 size={14}/> رابط الدفع</div>
                <div className="flex items-center gap-2">
                  <code className="text-[10px] text-slate-600 truncate flex-1" dir="ltr">{paymentLink(selected)}</code>
                  <button type="button" onClick={() => copyLink(selected)} className="p-1.5 text-brand-600 hover:text-brand-800" title="نسخ"><Copy size={15}/></button>
                </div>
                <p className="mt-1 text-[10px] text-slate-500">أرسل هذا الرابط للعميل؛ يتطلب تفعيل بوابة دفع ليعمل إلكترونياً.</p>
              </div>
            )}
            {selected.status === 'pending' && (
              <div className="flex items-start gap-2 text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>«تأكيد الدفع يدوياً» مخصص للحالات التي وصل فيها المبلغ خارج البوابة (نقداً/تحويل). لا تستخدمه قبل التحقق الفعلي من وصول المبلغ.</span>
              </div>
            )}
            <div>
              <h3 className="font-bold text-slate-800 text-sm mb-2">سجل أحداث الدفع</h3>
              {events.length === 0 ? <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3">لا توجد أحداث مسجلة لهذا الطلب.</p> : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {events.map((ev) => (
                    <div key={ev.id} className="flex items-center justify-between gap-2 text-xs border border-slate-100 rounded-lg px-3 py-2">
                      <div>
                        <div className="font-bold text-slate-700">{ev.event_type || 'event'} <span className="text-slate-400">({ev.provider})</span></div>
                        <div className="text-[10px] text-slate-400">{date(ev.created_at)}</div>
                      </div>
                      <Badge tone={ev.signature_valid ? 'green' : 'red'}>{ev.signature_valid ? 'موقّع' : 'غير موثّق'}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="إنشاء طلب دفع" wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>إلغاء</Button>
            <Button loading={saving} onClick={submitCreate}>إنشاء الطلب</Button>
          </>
        }>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="نوع الدفع" type="select" value={form.order_type} onChange={(v) => upd('order_type', v)} options={Object.entries(ORDER_TYPE_LABELS).map(([value, label]) => ({ value, label }))} />
          <Field label="المبلغ" type="money" value={form.amount_cents} onChange={(v) => upd('amount_cents', v)} help="المبلغ بالجنيه المصري." />
          <Field label="الوصف" value={form.description} onChange={(v) => upd('description', v)} placeholder="مثال: اشتراك شهر أكتوبر — حضانة" className="sm:col-span-2" />
          <Field label="اسم العميل" value={form.customer_name} onChange={(v) => upd('customer_name', v)} required />
          <Field label="رقم الهاتف" value={form.phone} onChange={(v) => upd('phone', v)} dir="ltr" required />
          <Field label="البريد الإلكتروني" type="email" value={form.email} onChange={(v) => upd('email', v)} dir="ltr" required className="sm:col-span-2" />
        </div>
        <p className="mt-3 text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-3">
          سيتم إنشاء رابط دفع خاص بالعميل. البريد والهاتف مطلوبان لأن بوابة الدفع تحتاجهما.
        </p>
      </Modal>

      <Modal open={!!created} onClose={() => setCreated(null)} title="تم إنشاء طلب الدفع"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreated(null)}>إغلاق</Button>
            <Button icon={Copy} onClick={() => copyLink(created)}>نسخ رابط الدفع</Button>
          </>
        }>
        {created && (
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <Info label="رقم الطلب" value={<span className="font-mono" dir="ltr">{created.order_number}</span>} />
              <Info label="المبلغ" value={money(created.amount_cents, created.currency)} />
            </div>
            <div className="bg-brand-50/60 border border-brand-100 rounded-xl p-3">
              <div className="flex items-center gap-1 text-xs font-bold text-brand-900 mb-1"><Link2 size={14}/> رابط الدفع</div>
              <code className="text-[11px] text-slate-700 break-all" dir="ltr">{paymentLink(created)}</code>
            </div>
            <p className="text-xs text-slate-500">أرسل الرابط للعميل. إذا كان الدفع الإلكتروني معطّلاً، سيرى العميل رسالة التواصل مع الأكاديمية بدلاً من الدفع.</p>
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
