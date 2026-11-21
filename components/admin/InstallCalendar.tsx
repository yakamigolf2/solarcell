'use client';
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type JobLite = { id: string; customer: string; address: string; status: string; techId?: string; techName?: string; installDate?: string; installDays?: number; kw?: number };
type Staff = { id: string; name: string; role: string };

const COLORS = ['#0F766E', '#2563EB', '#D97706', '#9333EA', '#DC2626', '#0891B2', '#65A30D', '#DB2777'];
const TH_MONTH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const DOW = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (s: string, n: number) => { const [y, m, d] = s.split('-').map(Number); return ymd(new Date(y, m - 1, d + n)); };

/** Month calendar of installation days per installer team, so free days are easy to see. */
export default function InstallCalendar({ jobs, staff, waitingStatuses, onOpen }: { jobs: JobLite[]; staff: Staff[]; waitingStatuses: string[]; onOpen: (id: string) => void }) {
  const today = ymd(new Date());
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [tech, setTech] = useState('all');
  const [picked, setPicked] = useState(today); // phones: the day whose jobs are listed under the grid
  const techs = staff.filter((s) => s.role === 'Technician');
  const color = (id?: string) => (id ? COLORS[Math.max(0, techs.findIndex((t) => t.id === id)) % COLORS.length] : '#64748B');

  // date -> jobs installing that day (multi-day jobs fill every day of their span)
  const byDay = useMemo(() => {
    const map: Record<string, JobLite[]> = {};
    for (const j of jobs) {
      if (!j.installDate) continue;
      for (let i = 0; i < Math.max(1, j.installDays || 1); i++) (map[addDays(j.installDate, i)] ||= []).push(j);
    }
    return map;
  }, [jobs]);

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first); start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [month]);

  const unscheduled = jobs.filter((j) => !j.installDate && waitingStatuses.includes(j.status));
  const visible = (list: JobLite[]) => list.filter((j) => tech === 'all' || (tech === 'none' ? !j.techId : j.techId === tech));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div><h1 className="text-[24px] font-extrabold">ปฏิทินติดตั้ง</h1><p className="text-[13px] text-[var(--muted)]">คิวติดตั้งแยกตามทีมช่าง ตั้งวันติดตั้งและทีมช่างได้ในฟอร์มแก้ไขลูกค้า</p></div>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="เดือนก่อน" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="w-9 h-9 rounded-full border bg-white flex items-center justify-center"><ChevronLeft size={18} /></button>
          <div className="min-w-[150px] text-center font-bold">{TH_MONTH[month.getMonth()]} {month.getFullYear() + 543}</div>
          <button type="button" aria-label="เดือนถัดไป" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="w-9 h-9 rounded-full border bg-white flex items-center justify-center"><ChevronRight size={18} /></button>
          <button type="button" onClick={() => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); }} className="ml-1 px-3 py-2 rounded-full border bg-white text-[12px] font-bold">วันนี้</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3 text-[12px]">
        {[{ id: 'all', name: 'ทุกทีม' }, ...techs, { id: 'none', name: 'ยังไม่ระบุทีม' }].map((t) => (
          <button key={t.id} type="button" onClick={() => setTech(t.id)} aria-pressed={tech === t.id} className={`px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 ${tech === t.id ? 'bg-[var(--navy)] text-white' : 'bg-white border'}`}>
            {t.id !== 'all' && <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.id === 'none' ? '#64748B' : color(t.id) }} />}{t.name}
          </button>
        ))}
        {tech !== 'all' && tech !== 'none' && <span className="self-center text-[var(--muted)]">ช่องสีเขียวอ่อน = ทีมนี้ว่าง</span>}
      </div>

      <div className="grid grid-cols-7 gap-1 text-[12px]">
        {DOW.map((d) => <div key={d} className="text-center font-bold text-[var(--muted)] py-1">{d}</div>)}
        {days.map((d) => {
          const key = ymd(d);
          const list = visible(byDay[key] || []);
          const other = d.getMonth() !== month.getMonth();
          const free = tech !== 'all' && tech !== 'none' && list.length === 0 && !other && key >= today;
          return (
            <div key={key} onClick={() => setPicked(key)} className={`min-h-[52px] sm:min-h-[86px] rounded-xl border p-1 cursor-pointer sm:cursor-default ${other ? 'opacity-40' : ''} ${free ? 'bg-emerald-50 border-emerald-200' : 'bg-[var(--surface)]'} ${key === today ? 'ring-2 ring-[var(--primary)]' : ''} ${key === picked ? 'max-sm:border-[var(--navy)] max-sm:border-2' : ''}`}>
              <div className="text-right text-[11px] font-bold text-gray-500">{d.getDate()}</div>
              {/* phones: a dot per job; the list for the tapped day is shown under the grid */}
              <div className="sm:hidden flex flex-wrap gap-0.5 justify-center mt-1" aria-hidden>{list.slice(0, 6).map((j) => <span key={j.id + key} className="w-2 h-2 rounded-full" style={{ background: color(j.techId) }} />)}</div>
              <div className="hidden sm:block space-y-0.5">
                {list.slice(0, 4).map((j) => (
                  <button key={j.id + key} type="button" onClick={() => onOpen(j.id)} title={`${j.customer} • ${j.techName || 'ยังไม่ระบุทีม'} • ${j.status}`} className="w-full text-left truncate rounded px-1 py-0.5 text-white text-[11px] font-semibold" style={{ background: color(j.techId) }}>{j.customer}</button>
                ))}
                {list.length > 4 && <div className="text-[10px] text-gray-500">+{list.length - 4} งาน</div>}
              </div>
            </div>
          );
        })}
      </div>

      <section className="sm:hidden mt-3" aria-live="polite">
        <h2 className="font-bold mb-2 text-[14px]">งานวันที่ {Number(picked.slice(8))} {TH_MONTH[Number(picked.slice(5, 7)) - 1]}</h2>
        {visible(byDay[picked] || []).length === 0
          ? <p className="text-[13px] text-[var(--muted)]">ไม่มีงานติดตั้ง</p>
          : <div className="space-y-2">{visible(byDay[picked] || []).map((j) => <button key={j.id} type="button" onClick={() => onOpen(j.id)} className="w-full text-left bg-[var(--surface)] border rounded-2xl p-3 flex gap-3 items-center"><span className="w-3 h-3 rounded-full shrink-0" style={{ background: color(j.techId) }} /><span className="min-w-0"><span className="block font-bold text-[14px] truncate">{j.customer}</span><span className="block text-[12px] text-[var(--muted)] truncate">{j.techName || 'ยังไม่ระบุทีม'} • {j.status}</span></span></button>)}</div>}
      </section>

      <section className="mt-5">
        <h2 className="font-bold mb-2">ยังไม่ได้นัดวันติดตั้ง ({unscheduled.length})</h2>
        {unscheduled.length === 0 ? <p className="text-[13px] text-[var(--muted)]">ทุกงานที่ขายแล้วมีวันติดตั้งแล้ว</p> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {unscheduled.map((j) => <button key={j.id} type="button" onClick={() => onOpen(j.id)} className="text-left bg-[var(--surface)] border rounded-2xl p-3"><div className="font-bold text-[14px] truncate">{j.customer}</div><div className="text-[12px] text-[var(--muted)] truncate">{j.status} • {j.kw || '—'} kW • {j.address}</div></button>)}
          </div>
        )}
      </section>
    </div>
  );
}
