'use client';
import { useState } from 'react';
import { Battery, BatteryCharging, Building2, ChevronRight, Cpu, Home, Leaf, PiggyBank, Plug, RefreshCw, Sun, TreePine, Zap, type LucideIcon } from 'lucide-react';
import IsoScene, { FLOW_LABELS, partAnchor, SCENARIO_FLOWS, type PartId, type Scenario } from '@/components/site/solar/IsoScene';
import { PART_INFO, SCENARIOS, type StepIcon } from '@/lib/solar-copy';

const SC_ICON: Record<Scenario, LucideIcon> = { 'on-grid': Home, hybrid: BatteryCharging, 'off-grid': TreePine, commercial: Building2 };
const STEP_ICON: Record<StepIcon, LucideIcon> = { sun: Sun, inverter: Cpu, home: Home, grid: Plug, battery: Battery };
const BENEFIT_ICON: LucideIcon[] = [PiggyBank, Leaf, RefreshCw];
const CHIPS: { id: PartId; label: string; en: string }[] = [
  { id: 'solar', label: 'แผงโซลาร์เซลล์', en: 'Solar Panel' }, { id: 'inverter', label: 'อินเวอร์เตอร์', en: 'Inverter' },
  { id: 'home', label: 'โหลดภายในบ้าน', en: 'House Load' }, { id: 'battery', label: 'แบตเตอรี่', en: 'Battery' }, { id: 'grid', label: 'ระบบการไฟฟ้า', en: 'Grid' },
];

export default function ExperienceSection() {
  const [scenario, setScenario] = useState<Scenario>('on-grid');
  const [part, setPart] = useState<PartId | null>(null);
  const sc = SCENARIOS.find(s => s.id === scenario)!;
  const has = (p: PartId) => !((p === 'battery' && (scenario === 'on-grid' || scenario === 'commercial')) || (p === 'grid' && scenario === 'off-grid'));
  const pick = (p: PartId) => setPart(prev => (prev === p ? null : p));
  const choose = (id: Scenario) => { setScenario(id); setPart(null); };

  return (
    <div className="rounded-[32px] bg-gradient-to-br from-[#EEF4E8] via-[#F8F9F6] to-[#EAF1E4] border border-[var(--line)] p-4 sm:p-6 lg:p-8">
      <div className="grid lg:grid-cols-[330px_1fr] gap-6 lg:gap-8">
        {/* left: system selector */}
        <div>
          <h3 className="text-[26px] sm:text-[30px] font-bold text-[var(--navy)] tracking-tight leading-tight">ระบบโซลาร์เซลล์ของเรา</h3>
          <p className="mt-2 text-[14px] text-[var(--muted)]">เลือกโซลูชันที่เหมาะกับบ้านและธุรกิจของคุณ</p>
          <div role="tablist" aria-label="ประเภทระบบ" className="mt-5 grid gap-3">
            {SCENARIOS.map(s => { const Icon = SC_ICON[s.id]; const on = scenario === s.id; return (
              <button key={s.id} role="tab" aria-selected={on} onClick={() => choose(s.id)} className={`flex items-center gap-3 text-left rounded-2xl p-4 border transition-colors ${on ? 'bg-white border-[var(--energy)] shadow-[0_0_0_2px_rgba(114,182,90,.35)]' : 'bg-white/70 border-transparent hover:bg-white'}`}>
                <span className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${on ? 'bg-[var(--navy)] text-white' : 'bg-[#E8F0E2] text-[var(--navy)]'}`}><Icon size={22} /></span>
                <span className="flex-1 min-w-0"><span className="block font-bold text-[15px] text-[var(--navy)] leading-snug">{s.title}</span><span className="block text-[12.5px] text-[var(--muted)] leading-snug mt-0.5">{s.tag}</span></span>
                <ChevronRight size={18} className={on ? 'text-[var(--emerald)]' : 'text-[var(--muted)]'} />
              </button>); })}
          </div>
        </div>

        {/* right: scene */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-md">
              <h3 className="text-[26px] sm:text-[32px] font-bold text-[var(--navy)] tracking-tight leading-tight">{sc.title}</h3>
              <div className="mt-2 h-1 w-14 rounded-full bg-[var(--energy)]" aria-hidden />
              <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--muted)]">{sc.summary}</p>
            </div>
            <ul className="flex flex-wrap gap-2.5">
              {sc.benefits.map((b, i) => { const Icon = BENEFIT_ICON[i % 3]; return <li key={b} className="flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2.5 text-[12.5px] font-medium text-[var(--navy)] shadow-sm max-w-[220px]"><Icon size={18} className="text-[var(--emerald)] shrink-0" /><span className="leading-snug">{b}</span></li>; })}
            </ul>
          </div>

          <div className="relative mt-3">
            <IsoScene scenario={scenario} selected={part} onSelect={pick} interactive className="w-full h-auto" />
            {/* callout chips (desktop) */}
            <div className="hidden md:block">
              {CHIPS.filter(c => has(c.id)).map(c => { const a = partAnchor(c.id); const on = part === c.id; return (
                <button key={c.id} onClick={() => pick(c.id)} aria-pressed={on} style={{ left: a.left, top: a.top }} className={`absolute -translate-x-1/2 -translate-y-full -mt-2 rounded-2xl px-3.5 py-1.5 text-left shadow-md transition-colors ${on ? 'bg-[var(--navy)] text-white' : 'bg-white/95 text-[var(--navy)] hover:bg-white'}`}>
                  <span className="block text-[12.5px] font-semibold leading-tight whitespace-nowrap">{c.label}</span><span className={`block text-[10.5px] leading-tight ${on ? 'text-white/70' : 'text-[var(--muted)]'}`}>{c.en}</span>
                </button>); })}
            </div>
          </div>
          <div className="md:hidden flex flex-wrap gap-2 mt-1" role="group" aria-label="เลือกส่วนประกอบ">
            {CHIPS.filter(c => has(c.id)).map(c => <button key={c.id} onClick={() => pick(c.id)} aria-pressed={part === c.id} className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-medium border ${part === c.id ? 'bg-[var(--navy)] text-white border-[var(--navy)]' : 'bg-white text-[var(--navy)] border-[var(--line2)]'}`}>{c.label}</button>)}
          </div>

          <div className="mt-3 min-h-[86px] rounded-2xl bg-white p-4 text-[14px] leading-relaxed" aria-live="polite">
            {part ? <><div className="font-bold text-[var(--navy)]">{PART_INFO[part].name}</div><p className="mt-1 text-[var(--muted)]">{PART_INFO[part].text(scenario)}</p></>
              : <p className="text-[var(--muted)]">คลิกส่วนประกอบในภาพ (แผง อินเวอร์เตอร์ บ้าน แบตเตอรี่ กริด) เพื่อดูหน้าที่และเส้นทางพลังงานที่เกี่ยวข้อง</p>}
          </div>
        </div>
      </div>

      {/* bottom: how it works */}
      <div className="mt-6 grid lg:grid-cols-[1fr_300px] gap-4">
        <div className="rounded-[24px] bg-white p-5 sm:p-6">
          <div className="flex items-center gap-3"><span className="w-9 h-9 rounded-full bg-[#FBF1D6] text-[#B8860B] flex items-center justify-center"><Sun size={20} /></span><div><div className="font-bold text-[16px] text-[var(--navy)]">การทำงานของระบบ</div><div className="text-[12px] text-[var(--muted)]">ตัวอย่างช่วงกลางวัน</div></div></div>
          <ol className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-y-5">
            {sc.short.map((st, i) => { const Icon = STEP_ICON[st.icon]; return (
              <li key={i} className="relative flex flex-col items-center text-center px-2">
                <span className="w-14 h-14 rounded-full bg-[#EAF2E4] text-[var(--navy)] flex items-center justify-center"><Icon size={26} /></span>
                <span className="mt-2 text-[13px] font-semibold text-[var(--navy)] leading-tight">{st.a}</span><span className="text-[12px] text-[var(--muted)] leading-tight">{st.b}</span>
                {i < sc.short.length - 1 && <span aria-hidden className="hidden sm:block absolute top-7 -right-3 w-6 h-0.5 bg-[#C7D6BE]" />}
              </li>); })}
          </ol>
          <ul className="mt-5 pt-4 border-t border-[var(--line)] flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] text-[var(--muted)]" aria-label="เส้นทางพลังงาน">
            {SCENARIO_FLOWS[scenario].map(k => <li key={k} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: FLOW_LABELS[k].color }} />{FLOW_LABELS[k].label}</li>)}
          </ul>
          {(scenario === 'on-grid' || scenario === 'commercial') && <p className="mt-2 text-[11.5px] text-[var(--muted)]">* การขายไฟคืนขึ้นกับนโยบายและเงื่อนไขของการไฟฟ้า</p>}
        </div>
        <div className="rounded-[24px] bg-white p-5 sm:p-6">
          <div className="font-bold text-[15px] text-[var(--navy)] flex items-center gap-2"><Zap size={17} className="text-[#B8860B]" />แผงผลิตไฟตลอดวัน</div>
          <div className="text-[12px] text-[var(--muted)]">ภาพประกอบลักษณะการผลิตไฟ (ไม่ใช่ข้อมูลจริง)</div>
          <svg viewBox="0 0 260 110" className="mt-3 w-full h-auto" role="img" aria-label="กราฟประกอบ: ผลิตไฟสูงสุดช่วงเที่ยง">
            <defs><linearGradient id="dayg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#72B65A" stopOpacity=".45" /><stop offset="1" stopColor="#72B65A" stopOpacity="0" /></linearGradient></defs>
            <path d="M10 92 C 60 90, 80 20, 130 18 S 200 90, 250 92 L250 92 L10 92Z" fill="url(#dayg)" /><path d="M10 92 C 60 90, 80 20, 130 18 S 200 90, 250 92" fill="none" stroke="#3F8A2F" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="10" y1="92" x2="250" y2="92" stroke="#D8DFD2" />
            {[['06:00', 10], ['12:00', 130], ['18:00', 250]].map(([t, x]) => <text key={t as string} x={x as number} y="106" fontSize="9" fill="#5B685F" textAnchor={x === 10 ? 'start' : x === 250 ? 'end' : 'middle'}>{t}</text>)}
          </svg>
        </div>
      </div>
    </div>
  );
}
