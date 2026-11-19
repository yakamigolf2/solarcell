'use client';
import { motion } from 'motion/react';

/** Scroll-triggered fade + slide-up. `stagger` children get `RevealItem`. */
export function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return <motion.div className={className} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.55, delay, ease: 'easeOut' }}>{children}</motion.div>;
}

export function Stagger({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <motion.div className={className} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}>{children}</motion.div>;
}

export function RevealItem({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <motion.div className={className} variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } }}>{children}</motion.div>;
}

export function SectionTitle({ eyebrow, title, text }: { eyebrow?: string; title: string; text?: string }) {
  return (
    <Reveal className="max-w-2xl mb-10">
      {eyebrow && <div className="text-[12px] font-semibold tracking-[.18em] uppercase text-[var(--emerald)] mb-2">{eyebrow}</div>}
      <h2 className="text-[28px] sm:text-[36px] font-bold leading-tight text-[var(--navy)]">{title}</h2>
      {text && <p className="mt-3 text-[16px] text-[var(--muted)] leading-relaxed">{text}</p>}
    </Reveal>
  );
}
