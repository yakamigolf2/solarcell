'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import type { AuditEntry } from '@/lib/audit';

const ACTION: Record<AuditEntry['action'], { label: string; cls: string }> = {
  create: { label: 'สร้าง', cls: 'bg-emerald-100 text-emerald-800' },
  update: { label: 'แก้ไข', cls: 'bg-sky-100 text-sky-800' },
  delete: { label: 'ลบ', cls: 'bg-rose-100 text-rose-800' },
  approve: { label: 'อนุมัติ', cls: 'bg-teal-100 text-teal-800' },
  unapprove: { label: 'ยกเลิกอนุมัติ', cls: 'bg-amber-100 text-amber-800' },
};
const COLLECTION: Record<string, string> = { solarpro_jobs: 'งาน / ลูกค้า', solarpro_users: 'ผู้ใช้', bge_company_settings: 'ตั้งค่าบริษัท', bge_news: 'ข่าว', bge_projects: 'ผลงาน', bge_products: 'อุปกรณ์', bge_clients: 'ลูกค้าของเรา', bge_attachments: 'ไฟล์แนบ', bge_equipment_sets: 'ชุดอุปกรณ์' };

const show = (v: unknown) => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'number') return v.toLocaleString('th-TH', { maximumFractionDigits: 2 });
  return String(v);
};

/** Admin view of the append-only change log (who changed status, price, payments, approvals). */
export default function AuditLog() {
  const [rows, setRows] = useState<{ id: string; value: AuditEntry }[]>([]);
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('ทั้งหมด');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/actions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'records.list', args: { collection: 'bge_audit', limit: 1000 } }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'โหลดไม่สำเร็จ');
      setRows(json.data.records || []);
    } catch (e) { setError(e instanceof Error ? e.message : 'โหลดไม่สำเร็จ'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows.filter(({ value: e }) => {
      if (kind === 'การเงิน' && !e.changes.some(c => /งวด|สลิป|ยอด/.test(c.field))) return false;
      if (kind === 'สถานะงาน' && !e.changes.some(c => c.field === 'สถานะ')) return false;
      if (kind === 'อนุมัติ' && e.action !== 'approve' && e.action !== 'unapprove') return false;
      if (kind === 'ลบ' && e.action !== 'delete') return false;
      return !t || `${e.userName} ${e.recordLabel} ${e.changes.map(c => `${c.field} ${c.from} ${c.to}`).join(' ')}`.toLowerCase().includes(t);
    });
  }, [rows, q, kind]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1">
        <h1 className="text-[22px] font-extrabold">ประวัติการแก้ไข</h1>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border bg-white text-[13px] font-semibold disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />รีเฟรช</button>
      </div>
      <p className="text-[13px] text-gray-500 mb-4">ใครเปลี่ยนสถานะ แก้ราคา ยืนยันการโอน หรืออนุมัติใบเสนอราคา เมื่อไหร่ (1,000 รายการล่าสุด) บันทึกแล้วแก้ไขหรือลบไม่ได้</p>
      <div className="flex flex-col md:flex-row gap-2 mb-3">
        <div className="relative flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหาชื่อผู้ใช้ ลูกค้า หรือรายการ" className="w-full pl-10 pr-4 py-2.5 rounded-full border bg-white text-[14px]" /></div>
        <div className="flex flex-wrap gap-2">{['ทั้งหมด', 'สถานะงาน', 'การเงิน', 'อนุมัติ', 'ลบ'].map(k => <button key={k} onClick={() => setKind(k)} className={`px-3 py-1.5 rounded-full text-[13px] font-semibold ${kind === k ? 'bg-[var(--primary)] text-white' : 'bg-white border'}`}>{k}</button>)}</div>
      </div>
      {error && <p className="text-[13px] text-rose-600 mb-3">{error}</p>}
      <div className="space-y-2">
        {list.map(({ id, value: e }) => (
          <div key={id} className="bg-[var(--surface)] border rounded-2xl p-3 text-[13px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${ACTION[e.action]?.cls || 'bg-gray-100'}`}>{ACTION[e.action]?.label || e.action}</span>
              <span className="font-bold">{e.recordLabel || '—'}</span>
              <span className="text-gray-500">{COLLECTION[e.collection] || e.collection}</span>
              <span className="ml-auto text-gray-500">{new Date(e.at).toLocaleString('th-TH')} • {e.userName}</span>
            </div>
            {e.changes.length > 0 && <ul className="mt-1.5 space-y-0.5 text-gray-700">{e.changes.map((c, i) => <li key={i}><span className="text-gray-500">{c.field}:</span> {show(c.from)} → <b>{show(c.to)}</b></li>)}</ul>}
          </div>
        ))}
        {!loading && list.length === 0 && <p className="text-center text-gray-500 py-10">ยังไม่มีประวัติ</p>}
      </div>
    </div>
  );
}
