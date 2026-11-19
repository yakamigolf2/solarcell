'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Layers, Pencil, Plus, Save, Trash2, X } from 'lucide-react';

export type SetLine = { name: string; qty: number; price: number; discount: number; details: string[] };
export type EquipmentSet = { name: string; note: string; items: SetLine[] };
export type SetRec = { id: string; value: EquipmentSet };
type CatalogRow = { name: string; price: number; code: string; category: string };

export const SETS_COLLECTION = 'bge_equipment_sets';
const baht = (n: number) => `฿${Math.round(n).toLocaleString('th-TH')}`;
const lineTotal = (l: SetLine) => Math.max(0, l.qty * l.price - l.discount);
export const setTotal = (s: EquipmentSet) => s.items.reduce((a, l) => a + lineTotal(l), 0);
const input = 'w-full px-3 py-2 rounded-xl border border-[var(--line2)] bg-white text-[13.5px] disabled:bg-gray-100';
const emptySet = (): EquipmentSet => ({ name: '', note: '', items: [] });

export async function setsApi(action: string, args: Record<string, unknown>) {
  const res = await fetch('/api/actions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, args }) });
  const json = await res.json().catch(() => ({} as any));
  if (!res.ok || json.error) throw new Error(json.error || `API error ${res.status}`);
  return json.data;
}
const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** Settings screen: build named sets of equipment (lines picked from the catalog or typed freely) and save them for reuse in quotations. */
export default function EquipmentSets({ catalog, canEdit }: { catalog: CatalogRow[]; canEdit: boolean }) {
  const [sets, setSets] = useState<SetRec[] | null>(null);
  const [form, setForm] = useState<EquipmentSet | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [pick, setPick] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { const d = await setsApi('records.list', { collection: SETS_COLLECTION }); setSets((d.records as SetRec[]).slice().reverse()); }
    catch (e) { setMsg('โหลดเซ็ตไม่สำเร็จ: ' + errText(e)); setSets([]); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const total = useMemo(() => (form ? setTotal(form) : 0), [form]);
  const setLine = (i: number, patch: Partial<SetLine>) => form && setForm({ ...form, items: form.items.map((l, k) => (k === i ? { ...l, ...patch } : l)) });
  const addFromCatalog = (name: string) => {
    if (!form || !name) return;
    const c = catalog.find(x => x.name === name);
    setForm({ ...form, items: [...form.items, { name, qty: 1, price: c?.price ?? 0, discount: 0, details: [] }] }); setPick('');
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!form.name.trim()) { setMsg('กรุณาตั้งชื่อเซ็ต'); return; }
    const items = form.items.filter(l => l.name.trim());
    if (items.length === 0) { setMsg('เพิ่มอุปกรณ์อย่างน้อย 1 รายการ'); return; }
    setBusy(true); setMsg(null);
    const value: EquipmentSet = { ...form, name: form.name.trim(), items: items.map(l => ({ ...l, name: l.name.trim(), qty: Math.max(0, Number(l.qty) || 0), price: Math.max(0, Number(l.price) || 0), discount: Math.max(0, Number(l.discount) || 0) })) };
    try {
      if (editId) await setsApi('records.replace', { collection: SETS_COLLECTION, id: editId, value });
      else await setsApi('records.create', { collection: SETS_COLLECTION, value, idempotency_key: `set-${Date.now()}` });
      setForm(null); setEditId(null); setMsg('บันทึกเซ็ตอุปกรณ์แล้ว'); await load();
    } catch (err) { setMsg('บันทึกไม่สำเร็จ: ' + errText(err)); }
    setBusy(false);
  }
  async function remove(id: string) {
    try { await setsApi('records.delete', { collection: SETS_COLLECTION, id }); setMsg('ลบเซ็ตแล้ว'); await load(); } catch (err) { setMsg('ลบไม่สำเร็จ: ' + errText(err)); }
    setConfirmId(null);
  }

  return (
    <section className="mt-6" aria-label="เซ็ตอุปกรณ์">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
        <div><h2 className="text-[20px] font-extrabold flex items-center gap-2"><Layers className="text-[var(--primary)]" size={22} /> เซ็ตอุปกรณ์</h2><p className="text-[13px] text-[var(--muted)]">จัดกลุ่มอุปกรณ์เป็นชุดสำเร็จรูป บันทึกไว้ แล้วเพิ่มลงใบเสนอราคาได้ในคลิกเดียว</p></div>
        {canEdit && <button type="button" onClick={() => { setForm(emptySet()); setEditId(null); setMsg(null); }} className="btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-semibold"><Plus size={17} /> สร้างเซ็ตใหม่</button>}
      </div>
      {msg && <div role="status" className="mb-3 bg-white border text-[13px] px-4 py-3 rounded-2xl flex justify-between gap-2"><span>{msg}</span><button type="button" onClick={() => setMsg(null)} aria-label="ปิด"><X size={16} /></button></div>}

      {form && (
        <form onSubmit={save} className="bg-[var(--surface)] rounded-3xl border p-4 sm:p-5 mb-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="text-[12px] font-semibold text-[var(--muted)]" htmlFor="set-name">ชื่อเซ็ต *</label><input id="set-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={input} placeholder="เช่น ระบบ On-grid 5kW สำหรับบ้าน" maxLength={120} /></div>
            <div><label className="text-[12px] font-semibold text-[var(--muted)]" htmlFor="set-note">หมายเหตุ (ไม่บังคับ)</label><input id="set-note" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className={input} /></div>
          </div>

          <div className="space-y-2">
            {form.items.length === 0 && <p className="text-[13px] text-[var(--muted)]">ยังไม่มีรายการ เลือกอุปกรณ์จากรายการด้านล่างหรือเพิ่มรายการเอง</p>}
            {form.items.map((l, i) => (
              <div key={i} className="rounded-2xl bg-gray-50 p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input aria-label="ชื่ออุปกรณ์" value={l.name} onChange={e => setLine(i, { name: e.target.value })} className={input + ' flex-1 min-w-[200px]'} placeholder="ชื่ออุปกรณ์" />
                  <label className="text-[11px] text-[var(--muted)]">จำนวน<input aria-label="จำนวน" type="number" min={0} value={l.qty} onChange={e => setLine(i, { qty: Number(e.target.value) })} className={input + ' w-[80px] mt-0.5'} /></label>
                  <label className="text-[11px] text-[var(--muted)]">ราคา/หน่วย<input aria-label="ราคาต่อหน่วย" type="number" min={0} value={l.price} onChange={e => setLine(i, { price: Number(e.target.value) })} className={input + ' w-[120px] mt-0.5'} /></label>
                  <label className="text-[11px] text-[var(--muted)]">ส่วนลด<input aria-label="ส่วนลด" type="number" min={0} value={l.discount} onChange={e => setLine(i, { discount: Number(e.target.value) })} className={input + ' w-[100px] mt-0.5'} /></label>
                  <div className="text-[13px] font-semibold min-w-[90px] text-right">{baht(lineTotal(l))}</div>
                  <button type="button" aria-label="ลบรายการ" onClick={() => setForm({ ...form, items: form.items.filter((_, k) => k !== i) })} className="p-2 rounded-full hover:bg-white text-rose-600"><Trash2 size={15} /></button>
                </div>
                <textarea aria-label="รายละเอียดในใบเสนอราคา" value={l.details.join('\n')} onChange={e => setLine(i, { details: e.target.value.split('\n') })} rows={l.details.length > 1 ? Math.min(6, l.details.length) : 1} className={input} placeholder="รายละเอียดที่จะแสดงใต้รายการในใบเสนอราคา (บรรทัดละ 1 ข้อ — ไม่บังคับ)" />
              </div>))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select value={pick} onChange={e => addFromCatalog(e.target.value)} aria-label="เพิ่มจากรายการอุปกรณ์" className={input + ' !w-auto min-w-[260px]'}>
              <option value="">+ เพิ่มจากรายการอุปกรณ์…</option>
              {catalog.map(c => <option key={c.code + c.name} value={c.name}>{c.name} — {baht(c.price)}</option>)}
            </select>
            <button type="button" onClick={() => setForm({ ...form, items: [...form.items, { name: '', qty: 1, price: 0, discount: 0, details: [] }] })} className="px-3 py-2 rounded-xl border bg-white text-[13px] font-semibold hover:bg-gray-50">+ เพิ่มรายการเอง</button>
            <div className="ml-auto text-[14px]">รวมเซ็ต <b className="text-[17px]">{baht(total)}</b> <span className="text-[11px] text-[var(--muted)]">(ก่อน VAT)</span></div>
          </div>

          <div className="flex gap-2 pt-1">
            <button disabled={busy} className="btn-primary inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[13px] font-semibold disabled:opacity-60"><Save size={16} /> {busy ? 'กำลังบันทึก…' : 'บันทึกเซ็ต'}</button>
            <button type="button" onClick={() => { setForm(null); setEditId(null); }} className="px-4 py-2.5 rounded-full text-[13px] font-semibold bg-gray-100">ยกเลิก</button>
          </div>
        </form>
      )}

      {sets === null ? <div className="skeleton h-24" aria-busy="true" /> :
        sets.length === 0 ? <div className="bg-[var(--surface)] rounded-3xl border p-8 text-center text-[var(--muted)] text-[14px]">ยังไม่มีเซ็ตอุปกรณ์{canEdit && ' — กด “สร้างเซ็ตใหม่” เพื่อเริ่มต้น'}</div> :
        <ul className="grid lg:grid-cols-2 gap-3">
          {sets.map(r => (
            <li key={r.id} className="bg-[var(--surface)] rounded-3xl border p-4">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0"><div className="font-bold text-[15px]">{r.value.name}</div>{r.value.note && <div className="text-[12px] text-[var(--muted)]">{r.value.note}</div>}</div>
                <div className="text-right shrink-0"><div className="font-extrabold">{baht(setTotal(r.value))}</div><div className="text-[11px] text-[var(--muted)]">{r.value.items.length} รายการ • ก่อน VAT</div></div>
              </div>
              <ul className="mt-2 text-[12.5px] text-[var(--muted)] space-y-0.5">{r.value.items.slice(0, 5).map((l, i) => <li key={i} className="truncate">• {l.name} × {l.qty}</li>)}{r.value.items.length > 5 && <li>… และอีก {r.value.items.length - 5} รายการ</li>}</ul>
              {canEdit && <div className="mt-3 flex items-center gap-2">
                <button type="button" onClick={() => { setForm({ ...r.value, items: r.value.items.map(l => ({ ...l, details: l.details || [] })) }); setEditId(r.id); setMsg(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 text-[12px] font-semibold"><Pencil size={13} /> แก้ไข</button>
                {confirmId === r.id ? <span className="flex items-center gap-1 text-[12px]">ลบจริงไหม? <button type="button" onClick={() => remove(r.id)} className="px-3 py-1 rounded-full bg-rose-600 text-white font-semibold">ลบ</button><button type="button" onClick={() => setConfirmId(null)} className="px-3 py-1 rounded-full bg-gray-100">ไม่</button></span>
                  : <button type="button" onClick={() => setConfirmId(r.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 text-rose-600 text-[12px] font-semibold"><Trash2 size={13} /> ลบ</button>}
              </div>}
            </li>))}
        </ul>}
    </section>
  );
}
