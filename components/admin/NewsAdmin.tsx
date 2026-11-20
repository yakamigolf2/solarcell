'use client';
import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Camera, ExternalLink, Heading2, ImagePlus, Newspaper, Pencil, Pilcrow, Plus, Save, Trash2, Video, X } from 'lucide-react';
import { uploadImage } from '@/lib/upload';
import { toEmbedUrl } from '@/lib/embed';

type Block = { type: 'heading' | 'text'; text: string } | { type: 'image'; url: string; caption: string } | { type: 'video'; url: string };

type News = { title: string; tag: string; summary: string; body: string; blocks: Block[]; date: string; cover: string; status: 'เผยแพร่' | 'แบบร่าง' };
type Rec = { id: string; value: News; updatedAt?: string };
const COLLECTION = 'bge_news';
const TAGS = ['ความรู้', 'คู่มือ', 'บำรุงรักษา', 'ข่าวบริษัท', 'โปรโมชัน'];
const empty = (): News => ({ title: '', tag: TAGS[0], summary: '', body: '', blocks: [], date: new Date().toISOString().slice(0, 10), cover: '', status: 'แบบร่าง' });
const input = 'w-full px-3 py-2.5 rounded-xl border border-[var(--line2)] bg-white/80 text-[14px]';

function BlockEditor({ blocks, onChange, onError }: { blocks: Block[]; onChange: (b: Block[]) => void; onError: (m: string) => void }) {
  const [busyIdx, setBusyIdx] = useState<number | null>(null);
  const set = (i: number, b: Block) => onChange(blocks.map((x, k) => (k === i ? b : x)));
  const move = (i: number, d: -1 | 1) => { const a = blocks.slice(); const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; onChange(a); };
  const add = (b: Block) => onChange([...blocks, b]);
  async function pick(i: number, f: File | undefined) {
    if (!f) return;
    setBusyIdx(i);
    try { const url = await uploadImage(f, 'news'); const cur = blocks[i]; if (cur.type === 'image') set(i, { ...cur, url }); }
    catch (e) { onError('อัปโหลดไม่สำเร็จ: ' + (e instanceof Error ? e.message : String(e))); }
    setBusyIdx(null);
  }
  const label = { heading: 'หัวข้อย่อย', text: 'ข้อความ', image: 'รูปภาพ', video: 'วิดีโอ (YouTube / Vimeo)' } as const;
  return (
    <div className="sm:col-span-2 rounded-2xl bg-white/60 p-3">
      <div className="text-[12px] font-semibold text-[var(--muted)] mb-2">เนื้อหาบทความ — เรียงบล็อกได้ตามต้องการ</div>
      {blocks.length === 0 && <p className="text-[12px] text-[var(--muted)] mb-2">ยังไม่มีเนื้อหา กดปุ่มด้านล่างเพื่อเพิ่มข้อความ รูป หรือวิดีโอ</p>}
      <ol className="space-y-3">
        {blocks.map((b, i) => (
          <li key={i} className="rounded-xl bg-white border p-3">
            <div className="flex items-center gap-1 mb-2"><span className="text-[12px] font-bold text-[var(--primary)] flex-1">{i + 1}. {label[b.type]}</span>
              <button type="button" aria-label="เลื่อนขึ้น" disabled={i === 0} onClick={() => move(i, -1)} className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30"><ArrowUp size={14} /></button>
              <button type="button" aria-label="เลื่อนลง" disabled={i === blocks.length - 1} onClick={() => move(i, 1)} className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30"><ArrowDown size={14} /></button>
              <button type="button" aria-label="ลบบล็อก" onClick={() => onChange(blocks.filter((_, k) => k !== i))} className="p-1.5 rounded-full hover:bg-gray-100 text-rose-600"><Trash2 size={14} /></button></div>
            {b.type === 'heading' && <input value={b.text} onChange={e => set(i, { ...b, text: e.target.value })} className={input} placeholder="หัวข้อย่อย" aria-label="หัวข้อย่อย" />}
            {b.type === 'text' && <textarea value={b.text} onChange={e => set(i, { ...b, text: e.target.value })} rows={5} className={input} placeholder="พิมพ์ข้อความ (ขึ้นบรรทัดใหม่ได้)" aria-label="ข้อความ" />}
            {b.type === 'image' && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <label className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[13px] font-semibold bg-white ${busyIdx === i ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:bg-gray-50'}`}><Camera size={15} /> {busyIdx === i ? 'กำลังอัปโหลด…' : b.url ? 'เปลี่ยนรูป' : 'อัปโหลดรูป'}<input type="file" accept="image/*" className="hidden" onChange={e => { void pick(i, e.target.files?.[0]); e.target.value = ''; }} /></label>
                  {b.url && <img src={b.url} alt="" className="h-20 rounded-lg border object-cover" />}
                </div>
                <input value={b.caption} onChange={e => set(i, { ...b, caption: e.target.value })} className={input} placeholder="คำบรรยายภาพ (ไม่บังคับ)" aria-label="คำบรรยายภาพ" />
              </div>)}
            {b.type === 'video' && (
              <div className="space-y-2">
                <input value={b.url} onChange={e => set(i, { ...b, url: e.target.value })} className={input} placeholder="วางลิงก์ YouTube หรือ Vimeo เช่น https://youtu.be/xxxx" aria-label="ลิงก์วิดีโอ" />
                {b.url && (toEmbedUrl(b.url) ? <div className="aspect-video max-w-[420px] rounded-xl overflow-hidden border"><iframe src={toEmbedUrl(b.url)!} title="ตัวอย่างวิดีโอ" className="w-full h-full" loading="lazy" allowFullScreen /></div> : <p className="text-[12px] text-rose-600">ลิงก์นี้ใช้ไม่ได้ — รองรับเฉพาะ YouTube และ Vimeo</p>)}
              </div>)}
          </li>))}
      </ol>
      <div className="flex flex-wrap gap-2 mt-3">
        <button type="button" onClick={() => add({ type: 'heading', text: '' })} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border bg-white text-[13px] font-semibold hover:bg-gray-50"><Heading2 size={15} /> หัวข้อย่อย</button>
        <button type="button" onClick={() => add({ type: 'text', text: '' })} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border bg-white text-[13px] font-semibold hover:bg-gray-50"><Pilcrow size={15} /> ข้อความ</button>
        <button type="button" onClick={() => add({ type: 'image', url: '', caption: '' })} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border bg-white text-[13px] font-semibold hover:bg-gray-50"><ImagePlus size={15} /> รูปภาพ</button>
        <button type="button" onClick={() => add({ type: 'video', url: '' })} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border bg-white text-[13px] font-semibold hover:bg-gray-50"><Video size={15} /> วิดีโอ</button>
      </div>
    </div>
  );
}

async function api(action: string, args: Record<string, unknown>) {
  const res = await fetch('/api/actions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, args }) });
  const json = await res.json().catch(() => ({} as any));
  if (!res.ok || json.error) throw new Error(json.error || `API error ${res.status}`);
  return json.data;
}

export default function NewsAdmin() {
  const [items, setItems] = useState<Rec[] | null>(null);
  const [form, setForm] = useState<News | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { const d = await api('records.list', { collection: COLLECTION }); setItems([...(d.records as Rec[])].sort((a, b) => String(b.value.date).localeCompare(String(a.value.date)))); }
    catch (e) { setMsg('โหลดข่าวไม่สำเร็จ: ' + (e instanceof Error ? e.message : String(e))); setItems([]); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!form.title.trim() || !form.summary.trim()) { setMsg('กรุณากรอกหัวข้อและสรุปสั้น ๆ'); return; }
    setBusy(true); setMsg(null);
    try {
      const value = { ...form, body: '', blocks: (form.blocks || []).filter(b => (b.type === 'image' || b.type === 'video' ? b.url.trim() : b.text.trim())) };
      if (editId) await api('records.replace', { collection: COLLECTION, id: editId, value, expected_updated_at: (items || []).find(x => x.id === editId)?.updatedAt });
      else await api('records.create', { collection: COLLECTION, value, idempotency_key: `news-${Date.now()}` });
      setForm(null); setEditId(null); setMsg(form.status === 'เผยแพร่' ? 'บันทึกและเผยแพร่แล้ว' : 'บันทึกแบบร่างแล้ว'); await load();
    } catch (err) { setMsg('บันทึกไม่สำเร็จ: ' + (err instanceof Error ? err.message : String(err))); }
    setBusy(false);
  }
  async function remove(id: string) {
    try { await api('records.delete', { collection: COLLECTION, id }); setMsg('ลบข่าวแล้ว'); await load(); }
    catch (err) { setMsg('ลบไม่สำเร็จ: ' + (err instanceof Error ? err.message : String(err))); }
    setConfirmId(null);
  }
  async function toggle(r: Rec) {
    try { await api('records.replace', { collection: COLLECTION, id: r.id, value: { ...r.value, status: r.value.status === 'เผยแพร่' ? 'แบบร่าง' : 'เผยแพร่' }, expected_updated_at: r.updatedAt }); await load(); }
    catch (err) { setMsg('เปลี่ยนสถานะไม่สำเร็จ: ' + (err instanceof Error ? err.message : String(err))); }
  }
  async function pickCover(f: File | undefined) {
    if (!f || !form) return;
    setBusy(true);
    try { const url = await uploadImage(f, 'news'); setForm(p => p && ({ ...p, cover: url })); }
    catch (err) { setMsg('อัปโหลดไม่สำเร็จ: ' + (err instanceof Error ? err.message : String(err))); }
    setBusy(false);
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div><h1 className="text-[24px] font-bold flex items-center gap-2"><Newspaper className="text-[var(--primary)]" /> ข่าวสารและบทความ</h1><p className="text-[13px] text-[var(--muted)]">จัดการข่าวที่แสดงบนเว็บไซต์ — เฉพาะข่าวที่เผยแพร่เท่านั้นที่ผู้เยี่ยมชมเห็น</p></div>
        <button onClick={() => { setForm(empty()); setEditId(null); setMsg(null); }} className="btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-semibold"><Plus size={17} /> เขียนข่าวใหม่</button>
      </div>
      {msg && <div role="status" className="mb-4 bg-white/80 border text-[13px] px-4 py-3 rounded-2xl flex justify-between gap-2"><span>{msg}</span><button onClick={() => setMsg(null)} aria-label="ปิด"><X size={16} /></button></div>}

      {form && (
        <form onSubmit={save} className="rounded-3xl glass p-5 mb-5 grid sm:grid-cols-2 gap-3">
          <h2 className="sm:col-span-2 font-bold">{editId ? 'แก้ไขข่าว' : 'ข่าวใหม่'}</h2>
          <div className="sm:col-span-2"><label className="text-[12px] font-semibold text-[var(--muted)]" htmlFor="n-title">หัวข้อ *</label><input id="n-title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={input} maxLength={160} /></div>
          <div><label className="text-[12px] font-semibold text-[var(--muted)]" htmlFor="n-tag">หมวด</label><input id="n-tag" list="n-tags" value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })} className={input} /><datalist id="n-tags">{TAGS.map(t => <option key={t} value={t} />)}</datalist></div>
          <div><label className="text-[12px] font-semibold text-[var(--muted)]" htmlFor="n-date">วันที่</label><input id="n-date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={input} /></div>
          <div className="sm:col-span-2"><label className="text-[12px] font-semibold text-[var(--muted)]" htmlFor="n-sum">สรุปสั้น ๆ (แสดงบนการ์ด) *</label><textarea id="n-sum" rows={2} value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} className={input} maxLength={300} /></div>
          <BlockEditor blocks={form.blocks || []} onChange={blocks => setForm({ ...form, blocks })} onError={m => setMsg(m)} />
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <label className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[13px] font-semibold bg-white ${busy ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:bg-gray-50'}`}><Camera size={15} /> {form.cover ? 'เปลี่ยนรูปปก' : 'อัปโหลดรูปปก'}<input type="file" accept="image/*" className="hidden" onChange={e => { void pickCover(e.target.files?.[0]); e.target.value = ''; }} /></label>
            {form.cover && <><img src={form.cover} alt="รูปปก" className="h-14 w-24 object-cover rounded-lg border" /><button type="button" onClick={() => setForm({ ...form, cover: '' })} className="text-[12px] text-rose-600 font-semibold">ลบรูป</button></>}
          </div>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3 pt-1">
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as News['status'] })} className={input + ' !w-auto'} aria-label="สถานะ"><option>แบบร่าง</option><option>เผยแพร่</option></select>
            <button disabled={busy} className="btn-primary inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[13px] font-semibold disabled:opacity-60"><Save size={16} /> {busy ? 'กำลังบันทึก…' : 'บันทึก'}</button>
            <button type="button" onClick={() => { setForm(null); setEditId(null); }} className="px-4 py-2.5 rounded-full text-[13px] font-semibold bg-white/70">ยกเลิก</button>
          </div>
        </form>
      )}

      {items === null ? <div className="space-y-3" aria-busy="true"><div className="skeleton h-20" /><div className="skeleton h-20" /></div> :
        items.length === 0 ? <div className="rounded-3xl glass p-10 text-center text-[var(--muted)]"><Newspaper className="mx-auto mb-2 text-sky-300" size={32} />ยังไม่มีข่าว กด “เขียนข่าวใหม่” เพื่อเริ่มต้น</div> :
        <ul className="space-y-3">{items.map(r => (
          <li key={r.id} className="rounded-3xl glass p-4 flex flex-wrap items-center gap-3">
            {r.value.cover ? <img src={r.value.cover} alt="" className="w-20 h-14 object-cover rounded-xl" /> : <span className="w-20 h-14 rounded-xl bg-gradient-to-br from-sky-100 to-blue-200" aria-hidden />}
            <div className="flex-1 min-w-[200px]"><div className="font-semibold text-[14px]">{r.value.title}</div><div className="text-[12px] text-[var(--muted)]">{r.value.tag} • {r.value.date}</div></div>
            <button onClick={() => toggle(r)} title="สลับสถานะ" className={`px-3 py-1 rounded-full text-[12px] font-bold ${r.value.status === 'เผยแพร่' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{r.value.status}</button>
            {r.value.status === 'เผยแพร่' && <a href={`/news/${r.id}`} target="_blank" rel="noreferrer" aria-label="ดูหน้าเว็บ" className="p-2 rounded-full bg-white/70"><ExternalLink size={16} /></a>}
            <button onClick={() => { setForm({ ...r.value, blocks: r.value.blocks?.length ? r.value.blocks : (r.value.body ? [{ type: 'text', text: r.value.body }] : []) }); setEditId(r.id); setMsg(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label="แก้ไข" className="p-2 rounded-full bg-white/70"><Pencil size={16} /></button>
            {confirmId === r.id ? <span className="flex items-center gap-1 text-[12px]">ลบจริงไหม? <button onClick={() => remove(r.id)} className="px-3 py-1 rounded-full bg-rose-600 text-white font-semibold">ลบ</button><button onClick={() => setConfirmId(null)} className="px-3 py-1 rounded-full bg-white/70">ไม่</button></span>
              : <button onClick={() => setConfirmId(r.id)} aria-label="ลบ" className="p-2 rounded-full bg-white/70 text-rose-600"><Trash2 size={16} /></button>}
          </li>))}</ul>}
    </>
  );
}
