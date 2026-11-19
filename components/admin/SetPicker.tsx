'use client';
import { useEffect, useState } from 'react';
import { History, Layers } from 'lucide-react';
import Combobox from './Combobox';
import { SETS_COLLECTION, setsApi, setTotal, type SetRec } from './EquipmentSets';

export type HistoryItem = { key: string; customer: string; status: string; sold: boolean; item: QuoteLine };
export type QuoteLine = { name: string; qty: number; price: number; discount?: number; vatPct?: number; details?: string[]; groups?: { title: string; lines: string[]; warranty?: string }[] };

/** In the quotation editor: pick a saved equipment set and append all of its lines to the quote. */
export default function SetPicker({ canEdit, onAdd, history = [] }: { canEdit: boolean; onAdd: (lines: QuoteLine[], setName: string) => void; history?: HistoryItem[] }) {
  const [hid, setHid] = useState('');
  const [soldOnly, setSoldOnly] = useState(true);
  const [sets, setSets] = useState<SetRec[]>([]);
  const [id, setId] = useState('');
  useEffect(() => { (async () => { try { const d = await setsApi('records.list', { collection: SETS_COLLECTION }); setSets((d.records as SetRec[]).slice().reverse()); } catch { /* sets are optional */ } })(); }, []);
  const hist = history.filter(h => !soldOnly || h.sold);
  if (sets.length === 0 && history.length === 0) return null;
  const cur = sets.find(s => s.id === id);
  const baht = (n: number) => `฿${Math.round(n).toLocaleString('th-TH')}`;
  const net = (l: QuoteLine) => Math.max(0, l.qty * l.price - (l.discount || 0));
  const curH = history.find(h => h.key === hid);
  return (
    <div className="space-y-3 mb-3">
      <div className="border rounded-2xl p-3 bg-amber-50">
        <div className="font-bold text-[14px] mb-1 flex items-center gap-1.5"><History size={16} /> ดึงต้นแบบจากแพ็กเกจที่เคยขาย</div>
        <p className="text-[12px] text-gray-600 mb-2">คัดลอกรายการพร้อมอุปกรณ์ในชุดและการรับประกันจากใบเสนอราคาก่อนหน้า แล้วแก้ไขต่อได้ทั้งหมด</p>
        <label className="flex items-center gap-2 text-[12px] mb-2"><input type="checkbox" checked={soldOnly} onChange={e => { setSoldOnly(e.target.checked); setHid(''); }} /> เฉพาะงานที่ปิดการขายแล้ว ({history.filter(h => h.sold).length} รายการ)</label>
        <div className="flex flex-wrap items-center gap-2">
          <Combobox className="flex-1 min-w-[220px]" ariaLabel="เลือกแพ็กเกจที่เคยขาย" disabled={!canEdit} value={hid} onChange={setHid} placeholder={hist.length ? 'พิมพ์ค้นหา เช่น Hybrid 12.9 kWp หรือชื่อลูกค้า…' : 'ยังไม่มีแพ็กเกจที่ตรงเงื่อนไข'} options={hist.map(h => ({ value: h.key, label: h.item.name, hint: `${baht(net(h.item))} • ${h.customer}${h.sold ? ' • ขายแล้ว' : ''}`, search: `${h.customer} ${(h.item.groups || []).map(g => g.title + ' ' + g.lines.join(' ')).join(' ')}` }))} />
          <button type="button" disabled={!canEdit || !curH} onClick={() => { if (!curH) return; const it = curH.item; onAdd([{ ...it, details: [...(it.details || [])], groups: (it.groups || []).map(g => ({ ...g, lines: [...g.lines] })) }], `${it.name} (จากใบเสนอราคาของ ${curH.customer})`); setHid(''); }} className="px-5 py-2.5 rounded-full bg-amber-600 text-white font-bold text-[13px] disabled:opacity-50">+ ดึงมาใช้</button>
        </div>
        {curH && (curH.item.groups || []).length > 0 && <ul className="mt-2 text-[12px] text-gray-600 flex flex-wrap gap-x-4 gap-y-0.5">{(curH.item.groups || []).map((g, i) => <li key={i}>{String(i + 1).padStart(2, '0')}. {g.title}</li>)}</ul>}
      </div>
      {sets.length > 0 && (
    <div className="border rounded-2xl p-3 bg-emerald-50">
      <div className="font-bold text-[14px] mb-2 flex items-center gap-1.5"><Layers size={16} /> เพิ่มเป็นเซ็ตอุปกรณ์</div>
      <div className="flex flex-wrap items-center gap-2">
        <Combobox className="flex-1 min-w-[220px]" ariaLabel="เลือกหรือค้นหาเซ็ตอุปกรณ์" disabled={!canEdit} value={id} onChange={setId} placeholder="พิมพ์ค้นหา หรือเลือกเซ็ตที่บันทึกไว้…" options={sets.map(s => ({ value: s.id, label: s.value.name, hint: `฿${Math.round(setTotal(s.value)).toLocaleString('th-TH')} • ${s.value.items.length} รายการ`, search: s.value.items.map(l => l.name).join(' ') }))} />
        <button type="button" disabled={!canEdit || !cur} onClick={() => { if (!cur) return; onAdd(cur.value.items.map(l => ({ name: l.name, qty: l.qty, price: l.price, discount: l.discount || 0, details: (l.details || []).filter(d => d.trim()), groups: (l.groups || []).map(g => ({ ...g, lines: [...g.lines] })) })), cur.value.name); setId(''); }} className="px-5 py-2.5 rounded-full bg-[var(--primary)] text-white font-bold text-[13px] disabled:opacity-50">+ เพิ่มทั้งเซ็ต</button>
      </div>
    </div>)}
    </div>
  );
}
