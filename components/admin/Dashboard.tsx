'use client';
import { motion } from 'motion/react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, FileText, Layers, MapPin, Sun, TrendingUp, Users, Wallet, Zap } from 'lucide-react';
import CountUp from '@/components/CountUp';

export type DashKpi = { key: 'quotes' | 'leads' | 'active' | 'revenue'; label: string; value: number; money?: boolean; sub: string; tone: 'amber' | 'violet' | 'blue' | 'green' };
export type DashRecent = { id: string; name: string; address: string; status: string; statusBg: string };
export type DashData = {
  greetingName: string; roleLabel: string;
  kpis: DashKpi[]; extra: { waitingMoney: number; waitElec: number; waitInstall: number };
  monthly: { label: string; count: number }[];
  donut: { name: string; value: number; color: string }[];
  recent: DashRecent[]; total: number;
};

const TONES = {
  amber: { bg: 'bg-amber-50', fg: 'text-amber-500', glow: 'from-amber-200/60' },
  violet: { bg: 'bg-violet-50', fg: 'text-violet-500', glow: 'from-violet-200/60' },
  blue: { bg: 'bg-sky-50', fg: 'text-sky-500', glow: 'from-sky-200/60' },
  green: { bg: 'bg-emerald-50', fg: 'text-emerald-600', glow: 'from-emerald-200/60' },
};
const ICONS: Record<DashKpi['key'], React.ReactNode> = { quotes: <FileText size={22} />, leads: <Users size={22} />, active: <Layers size={22} />, revenue: <TrendingUp size={22} /> };
const baht = (n: number) => `฿${Math.round(n).toLocaleString('th-TH')}`;

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } } };

export function DashboardSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4">
      <div className="skeleton h-14 w-72" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[0, 1, 2, 3].map(i => <div key={i} className="skeleton h-28" />)}</div>
      <div className="grid lg:grid-cols-3 gap-4"><div className="skeleton h-72" /><div className="skeleton h-72" /><div className="skeleton h-72" /></div>
    </div>
  );
}

export default function Dashboard({ d, onOpen, onNav }: { d: DashData; onOpen: (id: string) => void; onNav: (v: string) => void }) {
  const hasDonut = d.donut.some(x => x.value > 0);
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={item} className="flex items-center gap-3">
        <span className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-amber-400"><Sun size={26} /></span>
        <div><h1 className="text-[22px] sm:text-[26px] font-bold leading-tight">สวัสดี, {d.greetingName} 👋</h1><p className="text-[13px] text-[var(--muted)]">ภาพรวมการดำเนินงานของบริษัท • {d.roleLabel}</p></div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {d.kpis.map(k => { const t = TONES[k.tone]; return (
          <motion.div key={k.key} variants={item} className="lift relative overflow-hidden rounded-3xl glass p-4 sm:p-5">
            <div className={`absolute -right-6 -bottom-8 w-32 h-32 rounded-full bg-gradient-to-t ${t.glow} to-transparent blur-xl`} aria-hidden />
            <div className="relative flex items-start gap-3">
              <span className={`w-11 h-11 rounded-2xl ${t.bg} ${t.fg} flex items-center justify-center shrink-0`}>{ICONS[k.key]}</span>
              <div className="min-w-0"><div className="text-[12px] sm:text-[13px] text-[var(--muted)] font-medium leading-tight">{k.label}</div>
                <div className="text-[clamp(22px,3.4vw,32px)] font-bold leading-tight [overflow-wrap:anywhere]">{k.money ? <CountUp value={k.value} format={baht} /> : <CountUp value={k.value} />}</div>
                <div className="text-[12px] text-emerald-600 font-semibold">{k.sub}</div></div>
            </div>
          </motion.div>); })}
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {[{ l: 'เงินรอโอน', v: baht(d.extra.waitingMoney), i: <Wallet size={16} /> }, { l: 'งานรอติดตั้ง', v: `${d.extra.waitInstall} งาน`, i: <Layers size={16} /> }, { l: 'งานรอการไฟฟ้า', v: `${d.extra.waitElec} งาน`, i: <Zap size={16} /> }].map(x => (
          <motion.div key={x.l} variants={item} className="rounded-2xl glass px-4 py-3 flex items-center justify-between"><span className="flex items-center gap-2 text-[13px] text-[var(--muted)]"><span className="text-[var(--primary)]">{x.i}</span>{x.l}</span><b className="text-[15px]">{x.v}</b></motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-4">
        <motion.section variants={item} className="lg:col-span-5 rounded-3xl glass p-5">
          <h3 className="font-bold mb-1">แนวโน้มลูกค้าใหม่</h3><p className="text-[12px] text-[var(--muted)] mb-2">จำนวนรายการที่สร้างต่อเดือน (6 เดือนล่าสุด)</p>
          <div className="h-[230px]" role="img" aria-label="กราฟแนวโน้มลูกค้าใหม่รายเดือน">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.monthly} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
                <defs><linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366F1" stopOpacity={0.35} /><stop offset="100%" stopColor="#6366F1" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid vertical={false} stroke="#E2ECF7" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#52667A' }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#52667A' }} />
                <Tooltip formatter={(v) => [`${v} รายการ`, 'ลูกค้าใหม่']} contentStyle={{ borderRadius: 14, border: 'none', boxShadow: '0 8px 24px rgba(16,42,67,.15)' }} />
                <Area type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={2.5} fill="url(#gArea)" dot={{ r: 3, fill: '#6366F1' }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        <motion.section variants={item} className="lg:col-span-3 rounded-3xl glass p-5">
          <h3 className="font-bold mb-2">สถานะโครงการ</h3>
          <div className="relative h-[170px]" role="img" aria-label="กราฟโดนัทสถานะโครงการ">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={hasDonut ? d.donut : [{ name: 'ไม่มีข้อมูล', value: 1, color: '#E2ECF7' }]} dataKey="value" innerRadius={52} outerRadius={78} paddingAngle={3} stroke="none" cornerRadius={6}>
                  {(hasDonut ? d.donut : [{ color: '#E2ECF7' }]).map((x, i) => <Cell key={i} fill={x.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><div className="text-[28px] font-bold leading-none"><CountUp value={d.total} /></div><div className="text-[11px] text-[var(--muted)]">โครงการ</div></div>
          </div>
          <ul className="mt-3 space-y-1.5">{d.donut.map(x => <li key={x.name} className="flex items-center gap-2 text-[13px]"><span className="w-2.5 h-2.5 rounded-full" style={{ background: x.color }} /><span className="flex-1">{x.name}</span><b>{x.value}</b></li>)}</ul>
        </motion.section>

        <motion.section variants={item} className="lg:col-span-4 rounded-3xl glass p-5">
          <div className="flex justify-between items-center mb-2"><h3 className="font-bold">รายการล่าสุด</h3><button onClick={() => onNav('orders')} className="text-[12px] font-semibold text-[var(--primary)] inline-flex items-center gap-1 hover:underline">ดูทั้งหมด <ArrowRight size={13} /></button></div>
          {d.recent.length === 0 ? <div className="text-center py-10 text-[13px] text-[var(--muted)]"><Sun className="mx-auto mb-2 text-amber-300" />ยังไม่มีรายการ</div> :
            <ul className="space-y-1">{d.recent.map(r => (
              <li key={r.id}><button onClick={() => onOpen(r.id)} className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-white/70 text-left transition">
                <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-100 to-blue-200 text-blue-700 flex items-center justify-center font-bold shrink-0">{r.name.replace('คุณ', '').trim().charAt(0)}</span>
                <span className="flex-1 min-w-0"><span className="block font-semibold text-[13px] truncate">{r.name}</span><span className="flex items-center gap-1 text-[11.5px] text-[var(--muted)] truncate"><MapPin size={11} className="shrink-0" />{r.address}</span></span>
                <span className="text-[11px] font-semibold px-2 py-1 rounded-full whitespace-nowrap" style={{ background: r.statusBg }}>{r.status}</span>
              </button></li>))}</ul>}
        </motion.section>
      </div>
    </motion.div>
  );
}
