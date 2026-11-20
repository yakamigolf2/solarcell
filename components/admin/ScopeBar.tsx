'use client';

export type DatePreset = 'all' | 'month' | '3m' | 'year' | 'custom';
export type Scope = { preset: DatePreset; from: string; to: string; hideClosed: boolean; mine: boolean };
export const DEFAULT_SCOPE: Scope = { preset: 'all', from: '', to: '', hideClosed: true, mine: false };

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Inclusive YYYY-MM-DD bounds for a preset ('' = open). */
export function scopeRange(s: Scope): { from: string; to: string } {
  const now = new Date();
  if (s.preset === 'month') return { from: ymd(new Date(now.getFullYear(), now.getMonth(), 1)), to: '' };
  if (s.preset === '3m') return { from: ymd(new Date(now.getFullYear(), now.getMonth() - 2, 1)), to: '' };
  if (s.preset === 'year') return { from: `${now.getFullYear()}-01-01`, to: '' };
  if (s.preset === 'custom') return { from: s.from, to: s.to };
  return { from: '', to: '' };
}

export function inScope(created: string, s: Scope) {
  const { from, to } = scopeRange(s);
  const d = String(created || '').slice(0, 10);
  return (!from || d >= from) && (!to || d <= to);
}

const PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'month', label: 'เดือนนี้' }, { id: '3m', label: '3 เดือน' }, { id: 'year', label: 'ปีนี้' }, { id: 'all', label: 'ทั้งหมด' }, { id: 'custom', label: 'กำหนดเอง' },
];

/** Shared filter bar for the customer, order and finance pages: created-date range, hide finished jobs, my jobs. */
export default function ScopeBar({ scope, onChange, shown, total }: { scope: Scope; onChange: (s: Scope) => void; shown: number; total: number }) {
  const chip = (on: boolean) => `px-3 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap ${on ? 'bg-[var(--navy)] text-white' : 'bg-white border text-gray-700'}`;
  return (
    <div className="flex flex-wrap items-center gap-2 mb-3 text-[13px]">
      <span className="text-[12px] text-[var(--muted)]">วันที่สร้าง:</span>
      {PRESETS.map((p) => <button key={p.id} type="button" onClick={() => onChange({ ...scope, preset: p.id })} className={chip(scope.preset === p.id)} aria-pressed={scope.preset === p.id}>{p.label}</button>)}
      {scope.preset === 'custom' && <span className="flex items-center gap-1">
        <input type="date" aria-label="ตั้งแต่วันที่" value={scope.from} onChange={(e) => onChange({ ...scope, from: e.target.value })} className="px-2 py-1 rounded-lg border bg-white text-[12px]" />
        <span>–</span>
        <input type="date" aria-label="ถึงวันที่" value={scope.to} onChange={(e) => onChange({ ...scope, to: e.target.value })} className="px-2 py-1 rounded-lg border bg-white text-[12px]" />
      </span>}
      <label className="flex items-center gap-1.5 ml-1 cursor-pointer"><input type="checkbox" checked={scope.hideClosed} onChange={(e) => onChange({ ...scope, hideClosed: e.target.checked })} />ซ่อนงานที่ปิดแล้ว</label>
      <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={scope.mine} onChange={(e) => onChange({ ...scope, mine: e.target.checked })} />งานของฉัน</label>
      <span className="ml-auto text-[12px] text-[var(--muted)]">แสดง {shown.toLocaleString('th-TH')} จาก {total.toLocaleString('th-TH')} งาน</span>
    </div>
  );
}
