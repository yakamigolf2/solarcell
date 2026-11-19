'use client';
import { ArrowRight, Check } from 'lucide-react';
import { SCENARIOS } from '@/lib/solar-copy';
import type { Scenario } from '@/components/site/solar/IsoScene';

// Compact flow diagrams (inline SVG, no images to load).
function MiniFlow({ id }: { id: Scenario }) {
  const node = (x: number, y: number, label: string, on = true) => (
    <g opacity={on ? 1 : 0.25}><rect x={x - 26} y={y - 14} width="52" height="28" rx="9" fill="#fff" stroke="#D8DFD2" /><text x={x} y={y + 4} textAnchor="middle" fontSize="10.5" fill="#123C32" fontWeight="600">{label}</text></g>
  );
  const arrow = (x1: number, y1: number, x2: number, y2: number, c = '#E8BD65') => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="2.5" strokeDasharray="5 5" className="iso-flow" strokeLinecap="round" />;
  return (
    <svg viewBox="0 0 300 120" className="w-full h-auto" aria-hidden>
      {node(34, 30, 'แผง')}{node(120, 30, 'Inverter')}{node(212, 30, 'บ้าน')}
      {arrow(60, 30, 94, 30)}{arrow(146, 30, 186, 30)}
      {id !== 'off-grid' ? <>{node(262, 30, 'กริด')}{arrow(238, 30, 236, 30, '#4C8FD6')}</> : null}
      {id !== 'on-grid' && <>{node(120, 92, 'แบตเตอรี่')}{arrow(120, 46, 120, 76, '#72B65A')}{id === 'off-grid' && arrow(146, 92, 200, 50, '#72B65A')}</>}
      {id === 'hybrid' && arrow(146, 90, 198, 50, '#72B65A')}
    </svg>
  );
}

export default function SolutionCards() {
  const go = (id: Scenario) => { window.dispatchEvent(new CustomEvent('solar-scenario', { detail: id })); document.getElementById('experience')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  return (
    <div className="grid md:grid-cols-3 gap-5">
      {SCENARIOS.map(s => (
        <article key={s.id} className="lift glass rounded-[24px] p-6 flex flex-col">
          <div className="rounded-2xl bg-[#F3F6EF] p-3"><MiniFlow id={s.id} /></div>
          <div className="mt-5 text-[12px] font-semibold tracking-[.16em] uppercase text-[var(--emerald)]">{s.tag}</div>
          <h3 className="mt-1 text-[24px] font-bold text-[var(--navy)] tracking-tight">{s.name}</h3>
          <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--muted)]">{s.summary}</p>
          <ul className="mt-4 space-y-2 flex-1">{s.benefits.map(b => <li key={b} className="flex gap-2 text-[13.5px]"><Check size={16} className="text-[var(--emerald)] shrink-0 mt-0.5" />{b}</li>)}</ul>
          <button onClick={() => go(s.id)} className="mt-6 inline-flex items-center gap-1.5 self-start text-[14px] font-semibold text-[var(--navy)] hover:text-[var(--emerald)] transition">Learn More <ArrowRight size={16} /></button>
        </article>))}
    </div>
  );
}
