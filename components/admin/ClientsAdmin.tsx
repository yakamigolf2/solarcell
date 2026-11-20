'use client';
import { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, ImagePlus, Pencil, Plus, Save, Trash2, Users, X } from 'lucide-react';
import { uploadLogo } from '@/lib/upload';

type Client = { name: string; logo: string; order: number; status: 'แสดง' | 'ซ่อน' };
type Rec = { id: string; value: Client; updatedAt?: string };
const COLLECTION = 'bge_clients';
const input = 'w-full px-3 py-2.5 rounded-xl border border-[var(--line2)] bg-white text-[14px]';

async function api(action: string, args: Record<string, unknown>) {
  const res = await fetch('/api/actions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, args }) });
  const json = await res.json().catch(() => ({} as any));
  if (!res.ok || json.error) throw new Error(json.error || `API error ${res.status}`);
  return json.data;
}
const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

export default function ClientsAdmin() {
  const [items, setItems] = useState<Rec[] | null>(null);
  const [form, setForm] = useState<Client | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { const d = await api('records.list', { collection: COLLECTION }); setItems([...(d.records as Rec[])].sort((a, b) => (Number(a.value.order) || 0) - (Number(b.value.order) || 0))); }
    catch (e) { setMsg('โหลดข้อมูลไม่สำเร็จ: ' + errText(e)); setItems([]); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!form.name.trim()) { setMsg('กรุณากรอกชื่อลูกค้า'); return; }
    if (!form.logo) { setMsg('กรุณาอัปโหลดโลโก้'); return; }
    setBusy(true); setMsg(null);
    try {
      if (editId) await api('records.replace', { collection: COLLECTION, id: editId, value: form, expected_updated_at: (items || []).find(x => x.id === editId)?.updatedAt });
      else await api('records.create', { collection: COLLECTION, value: form, idempotency_key: `client-${Date.now()}` });
      setForm(null); setEditId(null); setMsg('บันทึกแล้ว'); await load();
    } catch (err) { setMsg('บันทึกไม่สำเร็จ: ' + errText(err)); }
    setBusy(false);
  }
  async function remove(id: string) {
    try { await api('records.delete', { collection: COLLECTION, id }); setMsg('ลบลูกค้าแล้ว'); await load(); } catch (err) { setMsg('ลบไม่สำเร็จ: ' + errText(err)); }
    setConfirmId(null);
  }
  async function toggle(r: Rec) {
    try { await api('records.replace', { collection: COLLECTION, id: r.id, value: { ...r.value, status: r.value.status === 'แสดง' ? 'ซ่อน' : 'แสดง' }, expected_updated_at: r.updatedAt }); await load(); }
    catch (err) { setMsg('เปลี่ยนสถานะไม่สำเร็จ: ' + errText(err)); }
  }
  async function pickLogo(f: File | undefined) {
    if (!f) return;
    setBusy(true); setMsg(null);
    try { const url = await uploadLogo(f); setForm(p => p && ({ ...p, logo: url })); } catch (err) { setMsg('อัปโหลดไม่สำเร็จ: ' + errText(err)); }
    setBusy(false);
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div><h1 className="text-[24px] font-bold flex items-center gap-2"><Users className="text-[var(--primary)]" /> ลูกค้าของเรา</h1><p className="text-[13px] text-[var(--muted)]">จัดการโลโก้ลูกค้าที่แสดงบนหน้าแรกของเว็บไซต์ — เพิ่ม ลบ ซ่อน และจัดลำดับได้</p></div>
        <button onClick={() => { setForm({ name: '', logo: '', order: (items?.length || 0) + 1, status: 'แสดง' }); setEditId(null); setMsg(null); }} className="btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-semibold"><Plus size={17} /> เพิ่มลูกค้า</button>
      </div>
      {msg && <div role="status" className="mb-4 bg-white/80 border text-[13px] px-4 py-3 rounded-2xl flex justify-between gap-2"><span>{msg}</span><button onClick={() => setMsg(null)} aria-label="ปิด"><X size={16} /></button></div>}

      {form && (
        <form onSubmit={save} className="rounded-3xl glass p-5 mb-5 grid sm:grid-cols-2 gap-3">
          <h2 className="sm:col-span-2 font-bold">{editId ? 'แก้ไขลูกค้า' : 'เพิ่มลูกค้าใหม่'}</h2>
          <div><label className="text-[12px] font-semibold text-[var(--muted)]" htmlFor="cl-name">ชื่อลูกค้า / แบรนด์ *</label><input id="cl-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={input} maxLength={80} /></div>
          <div><label className="text-[12px] font-semibold text-[var(--muted)]" htmlFor="cl-order">ลำดับการแสดง</label><input id="cl-order" type="number" min={0} value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })} className={input} /></div>
          <div className="sm:col-span-2 rounded-2xl bg-white/60 p-3">
            <div className="text-[12px] font-semibold text-[var(--muted)] mb-2">โลโก้ * (แนะนำไฟล์ PNG พื้นโปร่งใส)</div>
            <div className="flex flex-wrap items-center gap-3">
              <label className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[13px] font-semibold bg-white ${busy ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:bg-gray-50'}`}><ImagePlus size={15} /> {form.logo ? 'เปลี่ยนโลโก้' : 'อัปโหลดโลโก้'}<input type="file" accept="image/png,image/webp,image/jpeg" className="hidden" onChange={e => { void pickLogo(e.target.files?.[0]); e.target.value = ''; }} /></label>
              {form.logo && <span className="rounded-xl bg-[linear-gradient(45deg,#eee_25%,transparent_25%,transparent_75%,#eee_75%),linear-gradient(45deg,#eee_25%,#fff_25%,#fff_75%,#eee_75%)] bg-[length:12px_12px] bg-[position:0_0,6px_6px] border p-2"><img src={form.logo} alt={`โลโก้ ${form.name}`} className="h-14 w-auto max-w-[180px] object-contain" /></span>}
            </div>
          </div>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3 pt-1">
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Client['status'] })} className={input + ' !w-auto'} aria-label="สถานะ"><option>แสดง</option><option>ซ่อน</option></select>
            <button disabled={busy} className="btn-primary inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[13px] font-semibold disabled:opacity-60"><Save size={16} /> {busy ? 'กำลังทำงาน…' : 'บันทึก'}</button>
            <button type="button" onClick={() => { setForm(null); setEditId(null); }} className="px-4 py-2.5 rounded-full text-[13px] font-semibold bg-white/70">ยกเลิก</button>
          </div>
        </form>
      )}

      {items === null ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3" aria-busy="true"><div className="skeleton h-28" /><div className="skeleton h-28" /><div className="skeleton h-28" /></div> :
        items.length === 0 ? <div className="rounded-3xl glass p-10 text-center text-[var(--muted)]"><Users className="mx-auto mb-2 text-sky-300" size={32} />ยังไม่มีลูกค้า กด “เพิ่มลูกค้า” เพื่อเริ่มต้น (ถ้าไม่มีเลย ส่วน “ลูกค้าของเรา” จะถูกซ่อนบนหน้าแรก)</div> :
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(r => (
            <li key={r.id} className={`rounded-3xl glass p-4 flex flex-col gap-3 ${r.value.status === 'ซ่อน' ? 'opacity-60' : ''}`}>
              <div className="h-20 flex items-center justify-center rounded-2xl bg-white"><img src={r.value.logo} alt={r.value.name} className="max-h-16 max-w-[80%] object-contain" /></div>
              <div className="flex items-center gap-2"><div className="flex-1 min-w-0"><div className="font-semibold text-[14px] truncate">{r.value.order}. {r.value.name}</div><div className="text-[11px] text-[var(--muted)]">{r.value.status === 'แสดง' ? 'แสดงบนเว็บไซต์' : 'ซ่อนอยู่'}</div></div>
                <button onClick={() => toggle(r)} aria-label={r.value.status === 'แสดง' ? 'ซ่อน' : 'แสดง'} title={r.value.status === 'แสดง' ? 'ซ่อน' : 'แสดง'} className="p-2 rounded-full bg-white/70">{r.value.status === 'แสดง' ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                <button onClick={() => { setForm(r.value); setEditId(r.id); setMsg(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label="แก้ไข" className="p-2 rounded-full bg-white/70"><Pencil size={16} /></button>
                {confirmId === r.id ? <span className="flex items-center gap-1 text-[12px]"><button onClick={() => remove(r.id)} className="px-3 py-1 rounded-full bg-rose-600 text-white font-semibold">ลบ</button><button onClick={() => setConfirmId(null)} className="px-3 py-1 rounded-full bg-white/70">ไม่</button></span>
                  : <button onClick={() => setConfirmId(r.id)} aria-label="ลบ" className="p-2 rounded-full bg-white/70 text-rose-600"><Trash2 size={16} /></button>}
              </div>
            </li>))}
        </ul>}
    </>
  );
}
