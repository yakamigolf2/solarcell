'use client';
import { useCallback, useEffect, useState } from 'react';
import { Camera, ImagePlus, Package, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { uploadImage } from '@/lib/upload';
import { PRODUCT_ICONS } from '@/lib/product-icons';

type Product = { title: string; icon: string; points: string[]; note: string; cover: string; gallery: string[]; order: number; status: 'เผยแพร่' | 'แบบร่าง'; brand?: string; model?: string; capacity?: string; warranty?: string; price?: string };
type Rec = { id: string; value: Product; updatedAt?: string };
const COLLECTION = 'bge_products';
const MAX_GALLERY = 8;
const input = 'w-full px-3 py-2.5 rounded-xl border border-[var(--line2)] bg-white/80 text-[14px]';
const empty = (order: number): Product => ({ title: '', icon: 'package', points: [], note: '', cover: '', gallery: [], order, status: 'เผยแพร่' });

async function api(action: string, args: Record<string, unknown>) {
  const res = await fetch('/api/actions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, args }) });
  const json = await res.json().catch(() => ({} as any));
  if (!res.ok || json.error) throw new Error(json.error || `API error ${res.status}`);
  return json.data;
}
const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

export default function ProductsAdmin() {
  const [items, setItems] = useState<Rec[] | null>(null);
  const [form, setForm] = useState<Product | null>(null);
  const [pointsText, setPointsText] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { const d = await api('records.list', { collection: COLLECTION }); setItems([...(d.records as Rec[])].sort((a, b) => (Number(a.value.order) || 0) - (Number(b.value.order) || 0))); }
    catch (e) { setMsg('โหลดข้อมูลไม่สำเร็จ: ' + errText(e)); setItems([]); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const open = (v: Product, id: string | null) => { setForm({ ...v, gallery: v.gallery || [], points: v.points || [] }); setPointsText((v.points || []).join('\n')); setEditId(id); setMsg(null); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!form.title.trim()) { setMsg('กรุณากรอกชื่อหมวดอุปกรณ์'); return; }
    setBusy(true); setMsg(null);
    const value: Product = { ...form, points: pointsText.split('\n').map(x => x.trim()).filter(Boolean) };
    try {
      if (editId) await api('records.replace', { collection: COLLECTION, id: editId, value, expected_updated_at: (items || []).find(x => x.id === editId)?.updatedAt });
      else await api('records.create', { collection: COLLECTION, value, idempotency_key: `product-${Date.now()}` });
      setForm(null); setEditId(null); setMsg('บันทึกแล้ว'); await load();
    } catch (err) { setMsg('บันทึกไม่สำเร็จ: ' + errText(err)); }
    setBusy(false);
  }
  async function remove(id: string) {
    try { await api('records.delete', { collection: COLLECTION, id }); setMsg('ลบแล้ว'); await load(); } catch (err) { setMsg('ลบไม่สำเร็จ: ' + errText(err)); }
    setConfirmId(null);
  }
  async function toggle(r: Rec) {
    try { await api('records.replace', { collection: COLLECTION, id: r.id, value: { ...r.value, status: r.value.status === 'เผยแพร่' ? 'แบบร่าง' : 'เผยแพร่' }, expected_updated_at: r.updatedAt }); await load(); }
    catch (err) { setMsg('เปลี่ยนสถานะไม่สำเร็จ: ' + errText(err)); }
  }
  async function upload(files: FileList | null, kind: 'cover' | 'gallery') {
    if (!files || !form) return;
    setBusy(true); setMsg(null);
    try {
      if (kind === 'cover') { const url = await uploadImage(files[0], 'news'); setForm(p => p && ({ ...p, cover: url })); }
      else {
        const room = MAX_GALLERY - form.gallery.length;
        const urls: string[] = [];
        for (const f of Array.from(files).slice(0, Math.max(0, room))) urls.push(await uploadImage(f, 'news'));
        setForm(p => p && ({ ...p, gallery: [...p.gallery, ...urls] }));
        if (files.length > room) setMsg(`เพิ่มได้สูงสุด ${MAX_GALLERY} รูปต่อหมวด`);
      }
    } catch (err) { setMsg('อัปโหลดไม่สำเร็จ: ' + errText(err)); }
    setBusy(false);
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div><h1 className="text-[24px] font-bold flex items-center gap-2"><Package className="text-[var(--primary)]" /> อุปกรณ์คุณภาพในทุกระบบ</h1><p className="text-[13px] text-[var(--muted)]">จัดการหมวดอุปกรณ์และรูปภาพที่แสดงในหน้า “สินค้าและบริการ” ของเว็บไซต์</p></div>
        <button onClick={() => open(empty((items?.length || 0) + 1), null)} className="btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-semibold"><Plus size={17} /> เพิ่มหมวดอุปกรณ์</button>
      </div>
      {msg && <div role="status" className="mb-4 bg-white/80 border text-[13px] px-4 py-3 rounded-2xl flex justify-between gap-2"><span>{msg}</span><button onClick={() => setMsg(null)} aria-label="ปิด"><X size={16} /></button></div>}

      {form && (
        <form onSubmit={save} className="rounded-3xl glass p-5 mb-5 grid sm:grid-cols-2 gap-3">
          <h2 className="sm:col-span-2 font-bold">{editId ? 'แก้ไขหมวดอุปกรณ์' : 'หมวดอุปกรณ์ใหม่'}</h2>
          <div className="sm:col-span-2"><label className="text-[12px] font-semibold text-[var(--muted)]" htmlFor="pd-title">ชื่อหมวด *</label><input id="pd-title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={input} maxLength={120} /></div>
          <div><label className="text-[12px] font-semibold text-[var(--muted)]" htmlFor="pd-icon">ไอคอน (แสดงเมื่อยังไม่มีรูปปก)</label><select id="pd-icon" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} className={input}>{Object.entries(PRODUCT_ICONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
          <div><label className="text-[12px] font-semibold text-[var(--muted)]" htmlFor="pd-order">ลำดับการแสดง</label><input id="pd-order" type="number" min={0} value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })} className={input} /></div>
          <div className="sm:col-span-2 grid sm:grid-cols-3 gap-3 rounded-2xl bg-white/60 p-3">
            <div className="sm:col-span-3 text-[12px] text-[var(--muted)]">ข้อมูลจำเพาะ (ไม่บังคับ — กรอกเฉพาะที่ยืนยันแล้ว ช่องว่างจะไม่แสดงบนเว็บไซต์)</div>
            <div><label className="text-[12px] font-semibold text-[var(--muted)]" htmlFor="pd-brand">ยี่ห้อ</label><input id="pd-brand" value={form.brand || ''} onChange={e => setForm({ ...form, brand: e.target.value })} className={input} /></div>
            <div><label className="text-[12px] font-semibold text-[var(--muted)]" htmlFor="pd-model">รุ่น</label><input id="pd-model" value={form.model || ''} onChange={e => setForm({ ...form, model: e.target.value })} className={input} /></div>
            <div><label className="text-[12px] font-semibold text-[var(--muted)]" htmlFor="pd-cap">ขนาด/กำลัง</label><input id="pd-cap" value={form.capacity || ''} onChange={e => setForm({ ...form, capacity: e.target.value })} className={input} placeholder="เช่น 645 W / 10 kW" /></div>
            <div><label className="text-[12px] font-semibold text-[var(--muted)]" htmlFor="pd-war">การรับประกัน</label><input id="pd-war" value={form.warranty || ''} onChange={e => setForm({ ...form, warranty: e.target.value })} className={input} /></div>
            <div><label className="text-[12px] font-semibold text-[var(--muted)]" htmlFor="pd-price">ราคา (เฉพาะที่ยืนยันแล้ว)</label><input id="pd-price" value={form.price || ''} onChange={e => setForm({ ...form, price: e.target.value })} className={input} placeholder="เช่น เริ่มต้น 25,000 บาท" /></div>
          </div>
          <div className="sm:col-span-2"><label className="text-[12px] font-semibold text-[var(--muted)]" htmlFor="pd-points">รายละเอียด / จุดเด่น (บรรทัดละ 1 ข้อ)</label><textarea id="pd-points" rows={5} value={pointsText} onChange={e => setPointsText(e.target.value)} className={input} /></div>
          <div className="sm:col-span-2"><label className="text-[12px] font-semibold text-[var(--muted)]" htmlFor="pd-note">หมายเหตุ (ไม่บังคับ)</label><input id="pd-note" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className={input} /></div>

          <div className="sm:col-span-2 rounded-2xl bg-white/60 p-3">
            <div className="text-[12px] font-semibold text-[var(--muted)] mb-2">รูปหลักของหมวด (แสดงด้านข้างรายละเอียด)</div>
            <div className="flex flex-wrap items-center gap-3">
              <label className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[13px] font-semibold bg-white ${busy ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:bg-gray-50'}`}><Camera size={15} /> {form.cover ? 'เปลี่ยนรูปหลัก' : 'อัปโหลดรูปหลัก'}<input type="file" accept="image/*" className="hidden" onChange={e => { void upload(e.target.files, 'cover'); e.target.value = ''; }} /></label>
              {form.cover && <><img src={form.cover} alt="รูปหลัก" className="h-16 w-28 object-cover rounded-lg border" /><button type="button" onClick={() => setForm({ ...form, cover: '' })} className="text-[12px] text-rose-600 font-semibold">ลบรูป</button></>}
            </div>
          </div>
          <div className="sm:col-span-2 rounded-2xl bg-white/60 p-3">
            <div className="flex items-center justify-between mb-2"><div className="text-[12px] font-semibold text-[var(--muted)]">แกลเลอรีรูปอุปกรณ์ ({form.gallery.length}/{MAX_GALLERY})</div>
              <label className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[13px] font-semibold bg-white ${busy || form.gallery.length >= MAX_GALLERY ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:bg-gray-50'}`}><ImagePlus size={15} /> เพิ่มรูป<input type="file" accept="image/*" multiple className="hidden" onChange={e => { void upload(e.target.files, 'gallery'); e.target.value = ''; }} /></label></div>
            {form.gallery.length === 0 ? <p className="text-[12px] text-[var(--muted)]">ยังไม่มีรูป เลือกได้หลายไฟล์พร้อมกัน</p> :
              <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">{form.gallery.map((u, i) => <li key={u} className="relative"><img src={u} alt={`รูปอุปกรณ์ ${i + 1}`} className="w-full aspect-[4/3] object-cover rounded-xl border" /><button type="button" aria-label="ลบรูป" onClick={() => setForm({ ...form, gallery: form.gallery.filter((_, k) => k !== i) })} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"><X size={13} /></button></li>)}</ul>}
          </div>

          <div className="sm:col-span-2 flex flex-wrap items-center gap-3 pt-1">
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Product['status'] })} className={input + ' !w-auto'} aria-label="สถานะ"><option>เผยแพร่</option><option>แบบร่าง</option></select>
            <button disabled={busy} className="btn-primary inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[13px] font-semibold disabled:opacity-60"><Save size={16} /> {busy ? 'กำลังทำงาน…' : 'บันทึก'}</button>
            <button type="button" onClick={() => { setForm(null); setEditId(null); }} className="px-4 py-2.5 rounded-full text-[13px] font-semibold bg-white/70">ยกเลิก</button>
          </div>
        </form>
      )}

      {items === null ? <div className="space-y-3" aria-busy="true"><div className="skeleton h-20" /><div className="skeleton h-20" /></div> :
        items.length === 0 ? <div className="rounded-3xl glass p-10 text-center text-[var(--muted)]"><Package className="mx-auto mb-2 text-sky-300" size={32} />ยังไม่มีหมวดอุปกรณ์</div> :
        <ul className="space-y-3">{items.map(r => (
          <li key={r.id} className="rounded-3xl glass p-4 flex flex-wrap items-center gap-3">
            {r.value.cover ? <img src={r.value.cover} alt="" className="w-20 h-14 object-cover rounded-xl" /> : <span className="w-20 h-14 rounded-xl bg-gradient-to-br from-sky-100 to-blue-200" aria-hidden />}
            <div className="flex-1 min-w-[200px]"><div className="font-semibold text-[14px]">{r.value.order}. {r.value.title}</div><div className="text-[12px] text-[var(--muted)]">{(r.value.gallery || []).length} รูปในแกลเลอรี • {(r.value.points || []).length} รายละเอียด</div></div>
            <button onClick={() => toggle(r)} title="สลับสถานะ" className={`px-3 py-1 rounded-full text-[12px] font-bold ${r.value.status === 'เผยแพร่' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{r.value.status}</button>
            <button onClick={() => open(r.value, r.id)} aria-label="แก้ไข" className="p-2 rounded-full bg-white/70"><Pencil size={16} /></button>
            {confirmId === r.id ? <span className="flex items-center gap-1 text-[12px]">ลบจริงไหม? <button onClick={() => remove(r.id)} className="px-3 py-1 rounded-full bg-rose-600 text-white font-semibold">ลบ</button><button onClick={() => setConfirmId(null)} className="px-3 py-1 rounded-full bg-white/70">ไม่</button></span>
              : <button onClick={() => setConfirmId(r.id)} aria-label="ลบ" className="p-2 rounded-full bg-white/70 text-rose-600"><Trash2 size={16} /></button>}
          </li>))}</ul>}
    </>
  );
}
