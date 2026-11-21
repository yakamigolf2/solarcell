'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Calculator as CalcIcon, Info } from 'lucide-react';
import CountUp from '@/components/CountUp';

// Planning assumptions. They are shown to the visitor and are NOT company price quotes — real prices depend on a site survey.
const YIELD_PER_KW_DAY = 4;      // kWh per kWp per day after losses
const COST_PER_KW = 30000;       // THB per kWp (rough, solar only)
const COST_PER_KWH_BATTERY = 12000; // THB per kWh of battery (rough)
const BATTERY_KWH_PER_KW = 1;    // battery sizing: 1 kWh per kWp
const SHARE: Record<string, { label: string; day: number }> = {
  home: { label: 'บ้านพักอาศัย', day: 0.5 },
  business: { label: 'อาคารพาณิชย์ / สำนักงาน', day: 0.75 },
  factory: { label: 'โรงงาน / อุตสาหกรรม', day: 0.85 },
};
const baht = (n: number) => `฿${Math.round(n).toLocaleString('th-TH')}`;

export default function Calculator() {
  const [bill, setBill] = useState(4000);
  const [rate, setRate] = useState(4.2);
  const [type, setType] = useState<keyof typeof SHARE>('home');
  const [battery, setBattery] = useState(false);

  const r = useMemo(() => {
    const monthlyKwh = bill / Math.max(rate, 0.1);
    const day = SHARE[type].day;
    const kw = Math.max(1, Math.round((monthlyKwh * day) / (YIELD_PER_KW_DAY * 30) * 10) / 10);
    const gen = kw * YIELD_PER_KW_DAY * 30;
    // With a battery, part of the surplus is stored and used in the evening (assume 35% of the remaining load can be shifted).
    const shifted = battery ? Math.min(Math.max(0, gen - monthlyKwh * day), monthlyKwh * (1 - day) * 0.35) : 0;
    const usedKwh = Math.min(gen, monthlyKwh * day) + shifted;
    const saveMonth = usedKwh * rate;
    const cost = kw * COST_PER_KW + (battery ? kw * BATTERY_KWH_PER_KW * COST_PER_KWH_BATTERY : 0);
    return { kw, cost, saveMonth, saveYear: saveMonth * 12, payback: saveMonth > 0 ? cost / (saveMonth * 12) : 0, batteryKwh: battery ? kw * BATTERY_KWH_PER_KW : 0 };
  }, [bill, rate, type, battery]);

  const field = 'w-full px-4 py-3 rounded-2xl border border-[var(--line2)] bg-white text-[15px]';
  return (
    <div className="rounded-[32px] bg-white border border-[var(--line)] shadow-[0_10px_40px_rgba(18,60,50,.06)] p-6 sm:p-10 grid lg:grid-cols-2 gap-10">
      <div>
        <div className="flex items-center gap-2 text-[var(--emerald)] font-semibold text-[13px]"><CalcIcon size={18} /> Solar Savings Calculator</div>
        <h3 className="mt-2 text-[26px] sm:text-[30px] font-bold text-[var(--navy)] tracking-tight">ประเมินการประหยัดไฟเบื้องต้น</h3>
        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="bill" className="text-[13px] text-[var(--muted)]">ค่าไฟเฉลี่ยต่อเดือน</label>
            <div className="text-[34px] font-bold text-[var(--navy)] leading-none mt-1">{baht(bill)}</div>
            <input id="bill" type="range" min={1000} max={200000} step={500} value={bill} onChange={e => setBill(Number(e.target.value))} className="w-full mt-2 h-7 accent-[#3F8A2F] cursor-pointer" />
            <div className="flex justify-between text-[11px] text-[var(--muted)]"><span>฿1,000</span><span>฿200,000</span></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label htmlFor="rate" className="text-[13px] text-[var(--muted)]">ค่าไฟเฉลี่ย (บาท/หน่วย)</label><input id="rate" type="number" min={1} max={12} step={0.1} value={rate} onChange={e => setRate(Number(e.target.value) || 0)} className={field + ' mt-1'} /></div>
            <div><label htmlFor="itype" className="text-[13px] text-[var(--muted)]">ประเภทการติดตั้ง</label><select id="itype" value={type} onChange={e => setType(e.target.value as keyof typeof SHARE)} className={field + ' mt-1'}>{Object.entries(SHARE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
          </div>
          <fieldset><legend className="text-[13px] text-[var(--muted)]">ต้องการแบตเตอรี่หรือไม่</legend>
            <div className="mt-1 inline-flex p-1 rounded-full bg-[#F1F4EC]">{[{ v: false, l: 'ไม่ต้องการ' }, { v: true, l: 'ต้องการ' }].map(o => <button key={String(o.v)} type="button" aria-pressed={battery === o.v} onClick={() => setBattery(o.v)} className={`px-5 py-2 rounded-full text-[14px] font-medium transition ${battery === o.v ? 'bg-[var(--navy)] text-white' : 'text-[var(--navy)]'}`}>{o.l}</button>)}</div>
          </fieldset>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-2 gap-3">
          {[{ l: 'ขนาดระบบที่แนะนำ', v: <><CountUp value={r.kw} format={n => n.toFixed(1)} /> <small className="text-[14px] font-medium">kWp</small></> },
            { l: 'เงินลงทุนโดยประมาณ', v: <CountUp value={r.cost} format={baht} /> },
            { l: 'ประหยัดต่อเดือน', v: <CountUp value={r.saveMonth} format={baht} /> },
            { l: 'ประหยัดต่อปี', v: <CountUp value={r.saveYear} format={baht} /> }].map(x => (
            <div key={x.l} className="rounded-3xl bg-[#F6F8F2] p-5"><div className="text-[12px] text-[var(--muted)]">{x.l}</div><div className="mt-1 text-[22px] sm:text-[26px] font-bold text-[var(--navy)] leading-tight [overflow-wrap:anywhere]">{x.v}</div></div>))}
          <div className="col-span-2 rounded-3xl bg-[var(--navy)] text-white p-5 flex items-center justify-between gap-3">
            <div><div className="text-[12px] text-white/70">ระยะเวลาคืนทุนโดยประมาณ</div><div className="text-[30px] font-bold leading-tight"><CountUp value={r.payback} format={n => n.toFixed(1)} /> <small className="text-[15px] font-medium">ปี</small></div>{battery && <div className="text-[12px] text-white/70">รวมแบตเตอรี่ประมาณ {r.batteryKwh.toFixed(1)} kWh</div>}</div>
            <Link href="/quote" className="shrink-0 inline-flex items-center gap-1 bg-[var(--energy)] text-[var(--navy)] rounded-full px-5 py-2.5 text-[14px] font-semibold hover:brightness-105">ขอราคาจริง <ArrowRight size={15} /></Link>
          </div>
        </div>
        <div className="mt-4 flex gap-2 rounded-2xl bg-[#FBF6E8] border border-[#F0E3BD] p-4 text-[12.5px] leading-relaxed text-[#6B5A22]">
          <Info size={16} className="shrink-0 mt-0.5" />
          <div><b>เป็นเพียงค่าประมาณเพื่อการวางแผน</b> ไม่ใช่การรับประกันผลประหยัด ผลจริงขึ้นกับการใช้ไฟจริง สภาพหน้างาน อัตราค่าไฟ และรูปแบบระบบ สมมติฐาน: ผลิตไฟ {YIELD_PER_KW_DAY} หน่วย/kWp/วัน • สัดส่วนใช้ไฟช่วงกลางวัน {Math.round(SHARE[type].day * 100)}% • ราคาระบบประมาณ {COST_PER_KW.toLocaleString('th-TH')} บาท/kWp{battery && ` + แบตเตอรี่ ${COST_PER_KWH_BATTERY.toLocaleString('th-TH')} บาท/kWh`} (ราคาจริงต้องสำรวจหน้างาน)</div>
        </div>
      </div>
    </div>
  );
}
