'use client';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

export type SpecGroup = { title: string; lines: string[]; warranty?: string };

const input = 'w-full px-3 py-2 rounded-xl border border-[var(--line2)] bg-white text-[13px] disabled:bg-gray-100';

/** "Package includes" editor: each group = one piece of equipment (title), free-writing spec lines, and its own warranty. */
export default function GroupsEditor({ groups, onChange, disabled }: { groups: SpecGroup[]; onChange: (g: SpecGroup[]) => void; disabled?: boolean }) {
  const set = (i: number, patch: Partial<SpecGroup>) => onChange(groups.map((g, k) => (k === i ? { ...g, ...patch } : g)));
  const move = (i: number, d: -1 | 1) => { const a = groups.slice(); const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; onChange(a); };
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="text-[12px] font-bold text-[var(--muted)] mb-2">อุปกรณ์ในชุด (Package Includes) — เพิ่มได้ไม่จำกัด แต่ละอุปกรณ์มีรายละเอียดและการรับประกันของตัวเอง</div>
      <ol className="space-y-2">
        {groups.map((g, i) => (
          <li key={i} className="rounded-xl bg-gray-50 p-2.5 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-[12px] font-bold flex items-center justify-center shrink-0">{String(i + 1).padStart(2, '0')}</span>
              <input aria-label="ชื่อกลุ่มอุปกรณ์" disabled={disabled} value={g.title} onChange={e => set(i, { title: e.target.value })} className={input + ' font-semibold'} placeholder="เช่น Solar Panel / Hybrid Inverter / Lithium Battery" />
              {!disabled && <>
                <button type="button" aria-label="เลื่อนขึ้น" disabled={i === 0} onClick={() => move(i, -1)} className="p-1.5 rounded-full hover:bg-white disabled:opacity-30"><ArrowUp size={14} /></button>
                <button type="button" aria-label="เลื่อนลง" disabled={i === groups.length - 1} onClick={() => move(i, 1)} className="p-1.5 rounded-full hover:bg-white disabled:opacity-30"><ArrowDown size={14} /></button>
                <button type="button" aria-label="ลบกลุ่มอุปกรณ์" onClick={() => onChange(groups.filter((_, k) => k !== i))} className="p-1.5 rounded-full hover:bg-white text-rose-600"><Trash2 size={14} /></button>
              </>}
            </div>
            <textarea aria-label="รายละเอียดอุปกรณ์ (บรรทัดละ 1 ข้อ)" disabled={disabled} value={g.lines.join('\n')} onChange={e => set(i, { lines: e.target.value.split('\n') })} rows={Math.max(2, Math.min(6, g.lines.length))} className={input} placeholder={'รายละเอียด บรรทัดละ 1 ข้อ เช่น\nLONGi Solar 645W Tier 1\nจำนวน 20 แผง'} />
            <input aria-label="การรับประกัน" disabled={disabled} value={g.warranty || ''} onChange={e => set(i, { warranty: e.target.value })} className={input} placeholder="การรับประกัน (ไม่บังคับ) เช่น รับประกันสินค้า 15 ปี / ประสิทธิภาพ 30 ปี" />
          </li>))}
      </ol>
      {!disabled && <button type="button" onClick={() => onChange([...groups, { title: '', lines: [''], warranty: '' }])} className="mt-2 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border bg-white text-[13px] font-semibold hover:bg-gray-50"><Plus size={15} /> เพิ่มอุปกรณ์ในชุด</button>}
    </div>
  );
}
