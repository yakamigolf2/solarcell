'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check } from 'lucide-react';
import IsoScene, { FLOW_LABELS, SCENARIO_FLOWS, type PartId, type Scenario } from '@/components/site/solar/IsoScene';
import { PART_INFO, SCENARIOS } from '@/lib/solar-copy';

const PARTS: { id: PartId; label: string }[] = [{ id: 'solar', label: 'แผงโซลาร์' }, { id: 'inverter', label: 'อินเวอร์เตอร์' }, { id: 'battery', label: 'แบตเตอรี่' }, { id: 'home', label: 'บ้าน/เครื่องใช้ไฟฟ้า' }, { id: 'grid', label: 'กริด' }];

export default function ExperienceSection() {
  const [scenario, setScenario] = useState<Scenario>('hybrid');
  const [part, setPart] = useState<PartId | null>('inverter');
  const sc = SCENARIOS.find(s => s.id === scenario)!;

  // "Learn more" buttons on the solution cards select a scenario via this event.
  useEffect(() => {
    const on = (e: Event) => { const id = (e as CustomEvent<Scenario>).detail; if (id) { setScenario(id); setPart(null); } };
    window.addEventListener('solar-scenario', on);
    return () => window.removeEventListener('solar-scenario', on);
  }, []);

  const pick = (p: PartId) => setPart(prev => (prev === p ? null : p));
  return (
    <div>
      <div role="tablist" aria-label="ประเภทระบบ" className="inline-flex p-1 rounded-full bg-white border border-[var(--line)] shadow-sm">
        {SCENARIOS.map(s => (
          <button key={s.id} role="tab" aria-selected={scenario === s.id} onClick={() => { setScenario(s.id); setPart(null); }} className={`px-5 sm:px-7 py-2.5 rounded-full text-[13px] sm:text-[14px] font-semibold tracking-wide transition ${scenario === s.id ? 'bg-[var(--navy)] text-white shadow' : 'text-[var(--navy)] hover:bg-[var(--primary-soft)]'}`}>{s.name}</button>
        ))}
      </div>

      <div className="mt-6 grid lg:grid-cols-[1.35fr_1fr] gap-6 items-start">
        <div className="glass rounded-[32px] p-3 sm:p-5">
          <IsoScene scenario={scenario} selected={part} onSelect={pick} interactive className="w-full h-auto" />
          <div className="flex flex-wrap gap-2 mt-2" role="group" aria-label="เลือกส่วนประกอบ">
            {PARTS.map(p => {
              const off = (p.id === 'battery' && scenario === 'on-grid') || (p.id === 'grid' && scenario === 'off-grid');
              return <button key={p.id} onClick={() => pick(p.id)} aria-pressed={part === p.id} className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-medium border transition ${part === p.id ? 'bg-[var(--navy)] text-white border-[var(--navy)]' : off ? 'bg-white/60 text-[var(--muted)] border-dashed' : 'bg-white text-[var(--navy)] border-[var(--line2)] hover:border-[var(--energy)]'}`}>{p.label}{off ? ' (ไม่มี)' : ''}</button>;
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-[28px] p-6" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.div key={`${scenario}-${part ?? 'none'}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
                {part ? (
                  <>
                    <div className="text-[12px] font-semibold tracking-[.14em] uppercase text-[var(--emerald)]">{sc.name}</div>
                    <h3 className="mt-1 text-[22px] font-bold text-[var(--navy)] leading-snug">{PART_INFO[part].name}</h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">{PART_INFO[part].text(scenario)}</p>
                  </>
                ) : (
                  <>
                    <div className="text-[12px] font-semibold tracking-[.14em] uppercase text-[var(--emerald)]">{sc.tag}</div>
                    <h3 className="mt-1 text-[22px] font-bold text-[var(--navy)]">ระบบ {sc.name}</h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">{sc.summary}</p>
                    <p className="mt-3 text-[13px] text-[var(--muted)]">คลิกส่วนประกอบในภาพเพื่อดูรายละเอียดและเส้นทางพลังงานที่เกี่ยวข้อง</p>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="rounded-[28px] bg-[var(--navy)] text-white p-6">
            <div className="text-[12px] font-semibold tracking-[.14em] uppercase text-[var(--energy)]">Energy flow</div>
            <div className="mt-1 font-semibold text-[15px]">{sc.flowText}</div>
            <ol className="mt-4 space-y-2.5">
              {sc.steps.map((st, i) => <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-white/85"><span className="mt-0.5 w-5 h-5 rounded-full bg-[var(--energy)] text-[var(--navy)] text-[11px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>{st}</li>)}
            </ol>
            <ul className="mt-4 pt-4 border-t border-white/15 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-white/70" aria-label="เส้นทางพลังงาน">
              {SCENARIO_FLOWS[scenario].map(k => <li key={k} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: FLOW_LABELS[k].color }} />{FLOW_LABELS[k].label}</li>)}
            </ul>
          </div>
          <ul className="grid gap-1.5 text-[13.5px]">{sc.benefits.map(b => <li key={b} className="flex gap-2"><Check size={16} className="text-[var(--emerald)] mt-0.5 shrink-0" />{b}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}
