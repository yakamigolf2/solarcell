'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Calculator as CalcIcon } from 'lucide-react';
import CountUp from '@/components/CountUp';

// Rough planning assumptions (shown to the user below the result).
const TARIFF = 4.2;          // บาท/หน่วย
const YIELD_PER_KW_DAY = 4;  // kWh ต่อ kWp ต่อวัน (หลังหักการสูญเสีย)
const DAYTIME_SHARE = 0.6;   // สัดส่วนไฟที่ใช้ช่วงกลางวัน
const COST_PER_KW = 30000;   // บาท/kWp (ประมาณ)

export default function Calculator() {
  const [bill, setBill] = useState(4000);
  const r = useMemo(() => {
    const monthlyKwh = bill / TARIFF;
    const kw = Math.max(1, Math.round((monthlyKwh * DAYTIME_SHARE) / (YIELD_PER_KW_DAY * 30) * 10) / 10);
    const gen = kw * YIELD_PER_KW_DAY * 30;
    const saveMonth = Math.min(gen, monthlyKwh * DAYTIME_SHARE) * TARIFF;
    const cost = kw * COST_PER_KW;
    return { kw, saveMonth, saveYear: saveMonth * 12, payback: cost / (saveMonth * 12), co2: gen * 12 * 0.5 };
  }, [bill]);
  return (
    <div className="glass rounded-[32px] p-6 sm:p-9 grid lg:grid-cols-2 gap-8 items-center">
      <div>
        <div className="flex items-center gap-2 text-[var(--emerald)] font-semibold text-[13px]"><CalcIcon size={18} /> เครื่องคำนวณการประหยัดไฟ</div>
        <h3 className="mt-2 text-[24px] sm:text-[28px] font-bold text-[var(--navy)]">ค่าไฟเดือนละเท่าไร?</h3>
        <label htmlFor="bill" className="mt-5 block text-[13px] text-[var(--muted)]">ค่าไฟเฉลี่ยต่อเดือน</label>
        <div className="text-[34px] font-bold text-[var(--navy)]">฿{bill.toLocaleString('th-TH')}</div>
        <input id="bill" type="range" min={1000} max={100000} step={500} value={bill} onChange={e => setBill(Number(e.target.value))} className="w-full accent-[#16A34A]" />
        <div className="flex justify-between text-[11px] text-[var(--muted)]"><span>฿1,000</span><span>฿100,000</span></div>
        <p className="mt-4 text-[12px] text-[var(--muted)] leading-relaxed">* เป็นค่าประมาณเพื่อการวางแผน คำนวณจากค่าไฟ {TARIFF} บาท/หน่วย ผลิตไฟ {YIELD_PER_KW_DAY} หน่วย/kWp/วัน ใช้ไฟช่วงกลางวัน {DAYTIME_SHARE * 100}% และราคาระบบประมาณ {COST_PER_KW.toLocaleString('th-TH')} บาท/kWp ราคาจริงขึ้นกับการสำรวจหน้างาน</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[{ l: 'ขนาดระบบที่แนะนำ', v: <><CountUp value={r.kw} format={n => n.toFixed(1)} /> <small className="text-[13px] font-medium">kWp</small></> },
          { l: 'ประหยัดต่อเดือน', v: <>฿<CountUp value={r.saveMonth} /></> },
          { l: 'ประหยัดต่อปี', v: <>฿<CountUp value={r.saveYear} /></> },
          { l: 'คืนทุนประมาณ', v: <><CountUp value={r.payback} format={n => n.toFixed(1)} /> <small className="text-[13px] font-medium">ปี</small></> }].map(x => (
          <div key={x.l} className="rounded-3xl bg-white/80 p-4"><div className="text-[12px] text-[var(--muted)]">{x.l}</div><div className="text-[24px] font-bold text-[var(--navy)] leading-tight">{x.v}</div></div>))}
        <div className="col-span-2 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 flex items-center justify-between gap-3"><div className="text-[13px]">ลดการปล่อยคาร์บอนประมาณ <b><CountUp value={r.co2} /></b> กก./ปี</div><Link href="/quote" className="shrink-0 inline-flex items-center gap-1 bg-white text-emerald-700 rounded-full px-4 py-2 text-[13px] font-semibold">ขอราคาจริง <ArrowRight size={14} /></Link></div>
      </div>
    </div>
  );
}
