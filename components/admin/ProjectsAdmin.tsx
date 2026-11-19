'use client';
import { useCallback, useEffect, useState } from 'react';
import { Camera, HardHat, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { uploadImage } from '@/lib/upload';
import { PROJECT_TYPES } from '@/lib/site-data';

type Project = { title: string; place: string; type: string; kw: number; text: string; cover: string; status: 'เผยแพร่' | 'แบบร่าง' };
type Rec = { id: string; value: Project };
const COLLECTION = 'bge_projects';
const empty = (): Project => ({ title: '', place: '', type: PROJECT_TYPES[0], kw: 0, text: '', cover: '', status: 'แบบร่าง' });
const input = 'w-full px-3 py-2.5 rounded-xl border border-[var(--line2)] bg-white/80 text-[14px]';

async function api(action: string, args: Record<string, unknown>) {
  const res = await fetch('/api/actions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, args }) });
  const json = await res.json().catch(() => ({} as any));
  if (!res.ok || json.error) throw new Error(json.error || `API error ${res.status}`);
  return json.data;
}
const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

export default function ProjectsAdmin() {
  const [items, setItems] = useState<Rec[] | null>(null);
  const [form, setForm] = useState<Project | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { const d = await api('records.list', { collection: COLLECTION }); setItems([...(d.records as Rec[])].reverse()); }
    catch (e) { setMsg('โหลดผลงานไม่สำเร็จ: ' + errText(e)); setItems([]); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!form.title.trim()) { setMsg('กรุณากรอกชื่อโครงการ'); return; }
    setBusy(true); setMsg(null);
    try {
      if (editId) await api('records.replace', { collection: COLLECTION, id: editId, value: form });
      else await api('records.create', { collection: COLLECTION, value: form, idempotency_key: `project-${Date.now()}` });
      setForm(null); setEditId(null); setMsg(form.status === 'เผยแพร่' ? 'บันทึกและเผยแพร่แล้ว' : 'บันทึกแบบร่างแล้ว'); await load();
    } catch (err) { setMsg('บันทึกไม่สำเร็จ: ' + errText(err)); }
    setBusy(false);
  }
  async function remove(id: string) {
    try { await api('records.delete', { collection: COLLECTION, id }); setMsg('ลบผลงานแล้ว'); await load(); } catch (err) { setMsg('ลบไม่สำเร็จ: ' + errText(err)); }
    setConfirmId(null);
  }
  async function toggle(r: Rec) {
    try { await api('records.replace', { collection: COLLECTION, id: r.id, value: { ...r.value, status: r.value.status === 'เผยแพร่' ? 'แบบร่าง' : 'เผยแพร่' } }); await load(); }
    catch (err) { setMsg('เปลี่ยนสถานะไม่สำเร็จ: ' + errText(err)); }
  }
  async function pickCover(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    try { const url = await uploadImage(f, 'news'); setForm(p => p && ({ ...p, cover: url })); } catch (err) { setMsg('อัปโหลดไม่สำเร็จ: ' + errText(err)); }
    setBusy(false);
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div><h1 className="text-[24px] font-bold flex items-center gap-2"><HardHat className="text-[var(--primary)]" /> ผลงานการติดตั้ง</h1><p className="text-[13px] text-[var(--muted)]">จัดการผลงานที่แสดงบนหน้าเว็บไซต์ — เฉพาะผลงานที่เผยแพร่เท่านั้นที่ผู้เยี่ยมชมเห็น</p></div>
        <button onClick={() => { setForm(empty()); setEditId(null); setMsg(null); }} className="btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-semibold"><Plus size={17} /> เพิ่มผลงานใหม่</button>
      </div>
      {msg && <div role="status" className="mb-4 bg-white/80 border text-[13px] px-4 py-3 rounded-2xl flex justify-between gap-2"><span>{msg}</span><button onClick={() => setMsg(null)} aria-label="ปิด"><X size={16} /></button></div>}

      {form && (
        <form onSubmit={save} className="rounded-3xl glass p-5 mb-5 grid sm:grid-cols-2 gap-3">
          <h2 className="sm:col-span-2 font-bold">{editId ? 'แก้ไขผลงาน' : 'ผลงานใหม่'}</h2>
          <div className="sm:col-span-2"><label className="text-[12px] font-semibold text-[var(--muted)]" htmlFor="p-title">ชื่อโครงการ *</label><input id="p-title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={input} maxLength={160} /></div>
          <div><label className="text-[12px] font-semibold text-[var(--muted)]" htmlFor="p-type">ประเภท</label><select id="p-type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={input}>{PROJECT_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
          <div><label className="text-[12px] font-semibold text-[var(--muted)]" htmlFor="p-place">สถานที่ (จังหวัด/พื้นที่)</label><input id="p-place" value={form.place} onChange={e => setForm({ ...form, place: e.target.value })} className={input} /></div>
          <div><label className="text-[12px] font-semibold text-[var(--muted)]" htmlFor="p-kw">ขนาดระบบ (kWp)</label><input id="p-kw" type="number" min={0} step="0.1" value={form.kw} onChange={e => setForm({ ...form, kw: Number(e.target.value) })} className={input} /></div>
          <div className="sm:col-span-2"><label className="text-[12px] font-semibold text-[var(--muted)]" htmlFor="p-text">รายละเอียด</label><textarea id="p-text" rows={4} value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} className={input} /></div>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <label className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[13px] font-semibold bg-white ${busy ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:bg-gray-50'}`}><Camera size={15} /> {form.cover ? 'เปลี่ยนรูปปก' : 'อัปโหลดรูปปก'}<input type="file" accept="image/*" className="hidden" onChange={e => { void pickCover(e.target.files?.[0]); e.target.value = ''; }} /></label>
            {form.cover && <><img src={form.cover} alt="รูปปก" className="h-14 w-24 object-cover rounded-lg border" /><button type="button" onClick={() => setForm({ ...form, cover: '' })} className="text-[12px] text-rose-600 font-semibold">ลบรูป</button></>}
          </div>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3 pt-1">
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Project['status'] })} className={input + ' !w-auto'} aria-label="สถานะ"><option>แบบร่าง</option><option>เผยแพร่</option></select>
            <button disabled={busy} className="btn-primary inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[13px] font-semibold disabled:opacity-60"><Save size={16} /> {busy ? 'กำลังบันทึก…' : 'บันทึก'}</button>
            <button type="button" onClick={() => { setForm(null); setEditId(null); }} className="px-4 py-2.5 rounded-full text-[13px] font-semibold bg-white/70">ยกเลิก</button>
          </div>
        </form>
      )}

      {items === null ? <div className="space-y-3" aria-busy="true"><div className="skeleton h-20" /><div className="skeleton h-20" /></div> :
        items.length === 0 ? <div className="rounded-3xl glass p-10 text-center text-[var(--muted)]"><HardHat className="mx-auto mb-2 text-sky-300" size={32} />ยังไม่มีผลงาน กด “เพิ่มผลงานใหม่” เพื่อเริ่มต้น</div> :
        <ul className="space-y-3">{items.map(r => (
          <li key={r.id} className="rounded-3xl glass p-4 flex flex-wrap items-center gap-3">
            {r.value.cover ? <img src={r.value.cover} alt="" className="w-20 h-14 object-cover rounded-xl" /> : <span className="w-20 h-14 rounded-xl bg-gradient-to-br from-sky-100 to-blue-200" aria-hidden />}
            <div className="flex-1 min-w-[200px]"><div className="font-semibold text-[14px]">{r.value.title}</div><div className="text-[12px] text-[var(--muted)]">{r.value.type}{r.value.place && ` • ${r.value.place}`}{r.value.kw > 0 && ` • ${r.value.kw} kWp`}</div></div>
            <button onClick={() => toggle(r)} title="สลับสถานะ" className={`px-3 py-1 rounded-full text-[12px] font-bold ${r.value.status === 'เผยแพร่' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{r.value.status}</button>
            <button onClick={() => { setForm(r.value); setEditId(r.id); setMsg(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label="แก้ไข" className="p-2 rounded-full bg-white/70"><Pencil size={16} /></button>
            {confirmId === r.id ? <span className="flex items-center gap-1 text-[12px]">ลบจริงไหม? <button onClick={() => remove(r.id)} className="px-3 py-1 rounded-full bg-rose-600 text-white font-semibold">ลบ</button><button onClick={() => setConfirmId(null)} className="px-3 py-1 rounded-full bg-white/70">ไม่</button></span>
              : <button onClick={() => setConfirmId(r.id)} aria-label="ลบ" className="p-2 rounded-full bg-white/70 text-rose-600"><Trash2 size={16} /></button>}
          </li>))}</ul>}
    </>
  );
}
