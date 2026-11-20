'use client';
import { useCallback, useEffect, useState } from 'react';
import { Cpu, Database, HardDrive, RefreshCw } from 'lucide-react';

type Part<T> = { ok: true; data: T } | { ok: false; error: string };
type Db = { bytes: number; limitBytes: number; connections: number; cacheHitPct: number | null; collections: { name: string; rows: number; bytes: number }[] };
type Cpu = { available: false; reason: string } | { available: true; cpuSeconds: number; computeHours: number; activeHours: number; limitHours: number; storageBytes: number | null; periodStart: string | null; periodEnd: string | null };
type Blob = { bytes: number; files: number; limitBytes: number; folders: { name: string; files: number; bytes: number }[] };
type Data = { checkedAt: string; db: Part<Db>; cpu: Part<Cpu>; blob: Part<Blob> };

const fmtBytes = (b: number) => {
  if (b < 1024) return `${b} B`;
  const u = ['KB', 'MB', 'GB', 'TB']; let v = b / 1024, i = 0;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v < 10 ? 2 : 1)} ${u[i]}`;
};
const fmtNum = (n: number, d = 1) => n.toLocaleString('th-TH', { maximumFractionDigits: d });
const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '—');

function Meter({ used, limit, label }: { used: number; limit: number; label: string }) {
  const pct = limit > 0 ? (used / limit) * 100 : 0;
  const tone = pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div>
      <div className="flex justify-between text-[13px] mb-1.5"><span className="text-gray-600">{label}</span><span className="font-bold tabular-nums">{fmtNum(pct)}%</span></div>
      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden" role="meter" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-[var(--surface)] rounded-3xl border p-5 flex flex-col gap-4">
      <h2 className="font-bold flex items-center gap-2 text-[15px]">{icon}{title}</h2>
      {children}
    </section>
  );
}

const Failed = ({ msg }: { msg: string }) => <p className="text-[13px] text-rose-600">{msg}</p>;
const Big = ({ value, sub }: { value: string; sub: string }) => <div><div className="text-[26px] font-extrabold tabular-nums leading-tight">{value}</div><div className="text-[13px] text-gray-500">{sub}</div></div>;

function Breakdown({ rows }: { rows: { name: string; a: string; b: string }[] }) {
  if (!rows.length) return null;
  return (
    <table className="w-full text-[13px]">
      <tbody>{rows.map((r) => <tr key={r.name} className="border-t"><td className="py-1.5 pr-2 truncate max-w-[160px]">{r.name}</td><td className="py-1.5 text-right text-gray-500 tabular-nums">{r.a}</td><td className="py-1.5 pl-3 text-right font-semibold tabular-nums">{r.b}</td></tr>)}</tbody>
    </table>
  );
}

/** Admin page: database disk, compute (CPU) and Vercel Blob usage against plan limits. */
export default function SystemMonitor() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/monitor', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'โหลดไม่สำเร็จ');
      setData(json.data);
    } catch (e) { setError(e instanceof Error ? e.message : 'โหลดไม่สำเร็จ'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-[22px] font-extrabold">การใช้งานระบบ</h1>
          <p className="text-[13px] text-gray-500">{data ? `ตรวจล่าสุด ${new Date(data.checkedAt).toLocaleString('th-TH')}` : 'ฐานข้อมูล, CPU และพื้นที่ไฟล์ เทียบกับลิมิตของแพ็กเกจ'}</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border bg-white text-[13px] font-semibold disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />รีเฟรช</button>
      </div>
      {error && <p className="mb-4 text-[13px] text-rose-600">{error}</p>}
      {!data && !error && <div className="grid md:grid-cols-3 gap-4">{[0, 1, 2].map((i) => <div key={i} className="h-[260px] rounded-3xl bg-gray-100 animate-pulse" />)}</div>}
      {data && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Card icon={<HardDrive size={18} className="text-emerald-600" />} title="ฐานข้อมูล (Disk)">
            {data.db.ok ? <>
              <Big value={fmtBytes(data.db.data.bytes)} sub={`จากลิมิต ${fmtBytes(data.db.data.limitBytes)}`} />
              <Meter used={data.db.data.bytes} limit={data.db.data.limitBytes} label="พื้นที่ฐานข้อมูลที่ใช้" />
              <div className="text-[13px] text-gray-600">การเชื่อมต่อขณะนี้ {data.db.data.connections} • Cache hit {data.db.data.cacheHitPct ?? '—'}%</div>
              <Breakdown rows={data.db.data.collections.map((c) => ({ name: c.name, a: `${fmtNum(c.rows, 0)} รายการ`, b: fmtBytes(c.bytes) }))} />
            </> : <Failed msg={data.db.error} />}
          </Card>

          <Card icon={<Cpu size={18} className="text-sky-600" />} title="CPU / Compute (Neon)">
            {!data.cpu.ok ? <Failed msg={data.cpu.error} />
              : !data.cpu.data.available ? <div className="text-[13px] text-gray-600 space-y-2"><p className="font-semibold text-amber-700">{data.cpu.data.reason}</p><p>ค่า CPU ต้องดึงจาก Neon API: สร้าง API key ที่ Neon Console → Account settings → API keys แล้วใส่เป็น <code>NEON_API_KEY</code> ใน Vercel → Settings → Environment Variables</p></div>
              : <>
                <Big value={`${fmtNum(data.cpu.data.computeHours, 2)} ชม.`} sub={`Compute hours จากลิมิต ${fmtNum(data.cpu.data.limitHours, 0)} ชม. / เดือน`} />
                <Meter used={data.cpu.data.computeHours} limit={data.cpu.data.limitHours} label="Compute ที่ใช้ในรอบนี้" />
                <div className="text-[13px] text-gray-600 space-y-1">
                  <div>CPU time {fmtNum(data.cpu.data.cpuSeconds / 3600, 2)} ชม. • Active {fmtNum(data.cpu.data.activeHours, 2)} ชม.</div>
                  {data.cpu.data.storageBytes !== null && <div>พื้นที่รวมตาม Neon {fmtBytes(data.cpu.data.storageBytes)}</div>}
                  <div>รอบการใช้งาน {fmtDate(data.cpu.data.periodStart)} – {fmtDate(data.cpu.data.periodEnd)}</div>
                </div>
              </>}
          </Card>

          <Card icon={<Database size={18} className="text-violet-600" />} title="ไฟล์รูป / PDF (Vercel Blob)">
            {data.blob.ok ? <>
              <Big value={fmtBytes(data.blob.data.bytes)} sub={`${fmtNum(data.blob.data.files, 0)} ไฟล์ • ลิมิต ${fmtBytes(data.blob.data.limitBytes)}`} />
              <Meter used={data.blob.data.bytes} limit={data.blob.data.limitBytes} label="พื้นที่ไฟล์ที่ใช้" />
              <Breakdown rows={data.blob.data.folders.map((f) => ({ name: f.name, a: `${fmtNum(f.files, 0)} ไฟล์`, b: fmtBytes(f.bytes) }))} />
            </> : <Failed msg={data.blob.error} />}
          </Card>
        </div>
      )}
      <p className="mt-4 text-[12px] text-gray-500">ลิมิตตั้งต้น: Neon Free (DB 0.5 GB, compute 100 ชม./เดือน) และ Vercel Blob Hobby (1 GB) เปลี่ยนได้ด้วย MONITOR_DB_LIMIT_GB, MONITOR_COMPUTE_LIMIT_HOURS, MONITOR_BLOB_LIMIT_GB</p>
    </div>
  );
}
