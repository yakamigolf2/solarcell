'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { FAQ } from '@/lib/solar-copy';

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-[var(--line)] rounded-[24px] bg-white border border-[var(--line)] overflow-hidden">
      {FAQ.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q}>
            <h3><button id={`faq-b-${i}`} aria-expanded={isOpen} aria-controls={`faq-p-${i}`} onClick={() => setOpen(isOpen ? null : i)} className="w-full flex items-center justify-between gap-4 text-left px-6 py-5 text-[16px] sm:text-[17px] font-semibold text-[var(--navy)] hover:bg-[var(--primary-soft)]/50 transition">
              {f.q}<Plus size={20} className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-45 text-[var(--emerald)]' : ''}`} />
            </button></h3>
            <div id={`faq-p-${i}`} role="region" aria-labelledby={`faq-b-${i}`} className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
              <div className="overflow-hidden"><p className="px-6 pb-6 text-[15px] leading-[1.8] text-[var(--muted)]">{f.a}</p></div>
            </div>
          </div>);
      })}
    </div>
  );
}
