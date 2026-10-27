import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, Trash2, Copy, Image as ImageIcon, Pencil, Loader2, Search } from 'lucide-react';
import { api } from '../../lib/api';
import { uploadImage, Card, PageHeader, Button, Modal, Field, Spinner, EmptyState, useToast } from '../ui';

const sizeText = (bytes) => {
  const n = Number(bytes || 0);
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
  return (n / (1024 * 1024)).toFixed(1) + ' MB';
};

export default function Media() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(0);
  const [drag, setDrag] = useState(false);
  const [editing, setEditing] = useState(null);
  const [alt, setAlt] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  const load = useCallback(() => {
    api.adminMedia().then(setItems).catch((e) => { toast(e.message, 'error'); setItems([]); });
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const uploadFiles = async (files) => {
    const list = Array.from(files || []).filter((f) => f.type.startsWith('image/'));
    if (!list.length) return;
    setUploading(list.length);
    let ok = 0;
    for (const file of list) {
      try { await uploadImage(file); ok++; }
      catch (e) { toast(`${file.name}: ${e.message}`, 'error'); }
      finally { setUploading((n) => n - 1); }
    }
    if (ok) { toast(`تم رفع ${ok} صورة`); load(); }
    if (inputRef.current) inputRef.current.value = '';
  };

  const copy = async (url) => {
    try { await navigator.clipboard.writeText(url); toast('تم نسخ الرابط'); }
    catch { toast('تعذر النسخ', 'error'); }
  };

  const del = async (item) => {
    if (!window.confirm('حذف هذه الصورة من المكتبة؟ سيتم حذفها من التخزين إن لم تكن مستخدمة.')) return;
    try { await api.deleteMedia(item.id); toast('تم الحذف'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const openAlt = (item) => { setEditing(item); setAlt(item.alt || ''); };
  const saveAlt = async () => {
    if (!editing || saving) return;
    setSaving(true);
    try { await api.updateMedia(editing.id, { alt }); toast('تم حفظ الوصف'); setEditing(null); load(); }
    catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const filtered = (items || []).filter((m) => !search.trim() || String(m.alt || '').toLowerCase().includes(search.trim().toLowerCase()) || String(m.url || '').includes(search.trim()));

  return (
    <div>
      <PageHeader
        title="مكتبة الوسائط"
        description="كل الصور المرفوعة إلى Supabase Storage. ارفع، انسخ الرابط، أو احذف."
        actions={
          <>
            <div className="relative">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." className="w-40 sm:w-56 border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-200" />
            </div>
            <Button icon={Upload} loading={uploading > 0} onClick={() => inputRef.current?.click()}>
              {uploading > 0 ? `جاري رفع ${uploading}...` : 'رفع صور'}
            </Button>
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple className="hidden" onChange={(e) => uploadFiles(e.target.files)} />
          </>
        }
      />

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); uploadFiles(e.dataTransfer.files); }}
        className={`mb-4 border-2 border-dashed rounded-2xl p-6 text-center text-sm transition ${drag ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-500'}`}
      >
        <Upload className="mx-auto mb-2 text-slate-400" size={26} />
        اسحب الصور هنا أو اضغط «رفع صور». الحد الأقصى 5MB للصورة (PNG/JPG/GIF/WEBP).
      </div>

      {items === null ? <Spinner /> : filtered.length === 0 ? (
        <Card><EmptyState icon={ImageIcon} title={items.length ? 'لا توجد نتائج' : 'المكتبة فارغة'} description="ارفع أول صورة لاستخدامها في الموقع." action={<Button icon={Upload} onClick={() => inputRef.current?.click()}>رفع صورة</Button>} /></Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((m) => (
            <Card key={m.id} className="overflow-hidden group">
              <div className="relative aspect-[4/3] bg-slate-100">
                <img src={m.url} alt={m.alt || ''} loading="lazy" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={() => copy(m.url)} className="p-2 rounded-lg bg-white text-slate-700" title="نسخ الرابط"><Copy size={16} /></button>
                  <button onClick={() => openAlt(m)} className="p-2 rounded-lg bg-white text-slate-700" title="وصف الصورة"><Pencil size={16} /></button>
                  <button onClick={() => del(m)} className="p-2 rounded-lg bg-white text-red-600" title="حذف"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="p-3">
                <div className="text-xs text-slate-600 truncate">{m.alt || 'بدون وصف'}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{sizeText(m.size)}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="وصف الصورة (Alt)"
        footer={<><Button variant="secondary" onClick={() => setEditing(null)}>إلغاء</Button><Button loading={saving} onClick={saveAlt}>حفظ</Button></>}>
        {editing && (
          <div className="space-y-3">
            <img src={editing.url} alt="" className="w-full h-48 object-cover rounded-xl border border-slate-100" />
            <Field label="الوصف البديل" value={alt} onChange={setAlt} help="يظهر لقارئات الشاشة ويحسّن SEO." />
            <p className="text-[11px] text-slate-400 break-all" dir="ltr">{editing.url}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
