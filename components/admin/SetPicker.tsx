'use client';
import { useEffect, useState } from 'react';
import { Layers } from 'lucide-react';
import Combobox from './Combobox';
import { SETS_COLLECTION, setsApi, setTotal, type SetRec } from './EquipmentSets';

export type QuoteLine = { name: string; qty: number; price: number; discount?: number; vatPct?: number; details?: string[] };

/** In the quotation editor: pick a saved equipment set and append all of its lines to the quote. */
export default function SetPicker({ canEdit, onAdd }: { canEdit: boolean; onAdd: (lines: QuoteLine[], setName: string) => void }) {
  const [sets, setSets] = useState<SetRec[]>([]);
  const [id, setId] = useState('');
  useEffect(() => { (async () => { try { const d = await setsApi('records.list', { collection: SETS_COLLECTION }); setSets((d.records as SetRec[]).slice().reverse()); } catch { /* sets are optional */ } })(); }, []);
  if (sets.length === 0) return null;
  const cur = sets.find(s => s.id === id);
  return (
    <div className="border rounded-2xl p-3 mb-3 bg-emerald-50">
      <div className="font-bold text-[14px] mb-2 flex items-center gap-1.5"><Layers size={16} /> เพิ่มเป็นเซ็ตอุปกรณ์</div>
      <div className="flex flex-wrap items-center gap-2">
        <Combobox className="flex-1 min-w-[220px]" ariaLabel="เลือกหรือค้นหาเซ็ตอุปกรณ์" disabled={!canEdit} value={id} onChange={setId} placeholder="พิมพ์ค้นหา หรือเลือกเซ็ตที่บันทึกไว้…" options={sets.map(s => ({ value: s.id, label: s.value.name, hint: `฿${Math.round(setTotal(s.value)).toLocaleString('th-TH')} • ${s.value.items.length} รายการ`, search: s.value.items.map(l => l.name).join(' ') }))} />
        <button type="button" disabled={!canEdit || !cur} onClick={() => { if (!cur) return; onAdd(cur.value.items.map(l => ({ name: l.name, qty: l.qty, price: l.price, discount: l.discount || 0, details: (l.details || []).filter(d => d.trim()) })), cur.value.name); setId(''); }} className="px-5 py-2.5 rounded-full bg-[var(--primary)] text-white font-bold text-[13px] disabled:opacity-50">+ เพิ่มทั้งเซ็ต</button>
      </div>
    </div>
  );
}
