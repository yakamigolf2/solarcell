'use client';
import { useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import ScopeBar, { DEFAULT_SCOPE, inScope, type Scope } from '@/components/admin/ScopeBar';
import { LEAD_SOURCES, leadSourceOf, quoteTotals, type Receipt } from '@/lib/job';

type Job = { customer: string; customerTaxId?: string; address: string; status: string; created: string; leadSource?: string; source?: string; payments?: { label: string; receipt?: Receipt }[]; items?: unknown; labor?: unknown; discount?: unknown };
const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : '—');
const TH_MONTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

/** Reports: monthly output VAT (from issued receipts, for ภ.พ.30) and lead sources with close rate. */
export default function Reports({ jobs, soldStatuses, onMessage }: { jobs: Job[]; soldStatuses: string[]; onMessage: (m: string) => void }) {
  const [tab, setTab] = useState<'vat' | 'source'>('vat');
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [scope, setScope] = useState<Scope>({ ...DEFAULT_SCOPE, hideClosed: false, preset: 'year' });

  // receipt.date is dd/mm/yyyy (Thai local date of issue)
  const vatRows = useMemo(() => {
    const [y, m] = month.split('-');
    return jobs.flatMap((j) => (j.payments || []).filter((p) => p.receipt).map((p) => ({ j, p, rc: p.receipt! })))
      .filter(({ rc }) => { const [, mm, yyyy] = rc.date.split('/'); return yyyy === y && mm === m; })
      .sort((a, b) => a.rc.no.localeCompare(b.rc.no));
  }, [jobs, month]);
  const vatSum = vatRows.reduce((s, x) => ({ net: s.net + x.rc.net, vat: s.vat + x.rc.vat, amount: s.amount + x.rc.amount }), { net: 0, vat: 0, amount: 0 });

  const sources = useMemo(() => {
    const scoped = jobs.filter((j) => inScope(j.created, scope));
    const names = [...LEAD_SOURCES, 'ไม่ระบุ'] as string[];
    const rows = names.map((name) => {
      const leads = scoped.filter((j) => leadSourceOf(j) === name);
      const won = leads.filter((j) => soldStatuses.includes(j.status));
      return { name, leads: leads.length, won: won.length, revenue: won.reduce((s, j) => s + quoteTotals(j).total, 0) };
    }).filter((r) => r.leads > 0);
    const total = rows.reduce((s, r) => ({ leads: s.leads + r.leads, won: s.won + r.won, revenue: s.revenue + r.revenue }), { leads: 0, won: 0, revenue: 0 });
    return { rows: rows.sort((a, b) => b.leads - a.leads), total, count: scoped.length };
  }, [jobs, scope, soldStatuses]);

  async function exportVat() {
    try {
      const { exportVatExcel } = await import('@/lib/sales-export');
      await exportVatExcel(vatRows.map(({ j, rc }) => ({ date: rc.date, no: rc.no, customer: j.customer, taxId: j.customerTaxId || '', address: j.address, net: rc.net, vat: rc.vat, amount: rc.amount })), month);
    } catch (e) { onMessage('Export ไม่สำเร็จ: ' + (e instanceof Error ? e.message : String(e))); }
  }

  const [y, m] = month.split('-').map(Number);
  return (
    <div>
      <h1 className="text-[24px] font-extrabold">รายงาน</h1>
      <div role="tablist" className="inline-flex p-1 rounded-full bg-gray-100 my-3">
        {([['vat', 'ภาษีขาย (ภ.พ.30)'], ['source', 'ที่มาของลีด']] as const).map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`px-4 py-2 rounded-full text-[13px] font-bold ${tab === id ? 'bg-white shadow' : 'text-gray-600'}`}>{label}</button>)}
      </div>

      {tab === 'vat' && <section>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <label className="text-[13px]">เดือนภาษี <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="ml-1 px-2 py-1.5 rounded-lg border bg-white" /></label>
          <span className="text-[13px] text-[var(--muted)]">{TH_MONTH[m - 1]} {y + 543} • {vatRows.length} ใบ</span>
          <button type="button" onClick={exportVat} disabled={!vatRows.length} className="ml-auto px-4 py-2 rounded-full border bg-white text-[13px] font-bold flex items-center gap-1.5 disabled:opacity-50"><FileText size={15} />Export Excel</button>
        </div>
        <p className="text-[12px] text-[var(--muted)] mb-2">รายงานภาษีขายจากใบเสร็จรับเงิน / ใบกำกับภาษีที่ออกในเดือนนั้น ใช้ประกอบการยื่น ภ.พ.30 ควรให้ฝ่ายบัญชีตรวจก่อนยื่น</p>
        <div className="overflow-x-auto bg-[var(--surface)] border rounded-2xl">
          <table className="w-full text-[13px] min-w-[760px]">
            <thead className="bg-gray-50 text-left"><tr>{['วันที่', 'เลขที่', 'ลูกค้า', 'เลขประจำตัวผู้เสียภาษี', 'มูลค่าก่อน VAT', 'VAT 7%', 'รวม'].map((h, i) => <th key={h} className={`px-3 py-2 font-bold ${i >= 4 ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
            <tbody>
              {vatRows.map(({ j, rc }) => <tr key={rc.no} className="border-t"><td className="px-3 py-2">{rc.date}</td><td className="px-3 py-2 font-semibold">{rc.no}</td><td className="px-3 py-2">{j.customer}</td><td className="px-3 py-2">{j.customerTaxId && j.customerTaxId !== '-' ? j.customerTaxId : '—'}</td><td className="px-3 py-2 text-right tabular-nums">{fmt(rc.net)}</td><td className="px-3 py-2 text-right tabular-nums">{fmt(rc.vat)}</td><td className="px-3 py-2 text-right tabular-nums">{fmt(rc.amount)}</td></tr>)}
              {!vatRows.length && <tr><td colSpan={7} className="px-3 py-8 text-center text-[var(--muted)]">ไม่มีใบเสร็จในเดือนนี้</td></tr>}
            </tbody>
            {vatRows.length > 0 && <tfoot className="border-t-2 font-bold"><tr><td colSpan={4} className="px-3 py-2">รวม</td><td className="px-3 py-2 text-right tabular-nums">{fmt(vatSum.net)}</td><td className="px-3 py-2 text-right tabular-nums">{fmt(vatSum.vat)}</td><td className="px-3 py-2 text-right tabular-nums">{fmt(vatSum.amount)}</td></tr></tfoot>}
          </table>
        </div>
      </section>}

      {tab === 'source' && <section>
        <ScopeBar scope={{ ...scope, mine: false }} onChange={(s) => setScope({ ...s, mine: false, hideClosed: false })} shown={sources.count} total={jobs.length} />
        <div className="overflow-x-auto bg-[var(--surface)] border rounded-2xl">
          <table className="w-full text-[13px] min-w-[560px]">
            <thead className="bg-gray-50 text-left"><tr>{['ที่มา', 'ลีด', 'ปิดการขาย', 'อัตราปิดการขาย', 'ยอดขาย (รวม VAT)'].map((h, i) => <th key={h} className={`px-3 py-2 font-bold ${i ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
            <tbody>
              {sources.rows.map((r) => <tr key={r.name} className="border-t"><td className="px-3 py-2 font-semibold">{r.name}</td><td className="px-3 py-2 text-right">{r.leads}</td><td className="px-3 py-2 text-right">{r.won}</td><td className="px-3 py-2 text-right">{pct(r.won, r.leads)}</td><td className="px-3 py-2 text-right tabular-nums">{fmt(r.revenue)}</td></tr>)}
              {!sources.rows.length && <tr><td colSpan={5} className="px-3 py-8 text-center text-[var(--muted)]">ไม่มีลีดในช่วงนี้</td></tr>}
            </tbody>
            {sources.rows.length > 0 && <tfoot className="border-t-2 font-bold"><tr><td className="px-3 py-2">รวม</td><td className="px-3 py-2 text-right">{sources.total.leads}</td><td className="px-3 py-2 text-right">{sources.total.won}</td><td className="px-3 py-2 text-right">{pct(sources.total.won, sources.total.leads)}</td><td className="px-3 py-2 text-right tabular-nums">{fmt(sources.total.revenue)}</td></tr></tfoot>}
          </table>
        </div>
        <p className="text-[12px] text-[var(--muted)] mt-2">"ปิดการขาย" = สถานะตั้งแต่ตกลงจ้างขึ้นไป ตั้งที่มาของลีดได้ในฟอร์มลูกค้า ลีดจากฟอร์มเว็บไซต์ตั้งให้อัตโนมัติ</p>
      </section>}
    </div>
  );
}
