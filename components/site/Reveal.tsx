// Section helpers. Scroll-triggered motion was removed on purpose: dozens of observers + transforms made scrolling janky.
export function Reveal({ children, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function Stagger({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function RevealItem({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function SectionTitle({ eyebrow, title, text }: { eyebrow?: string; title: string; text?: string }) {
  return (
    <div className="max-w-2xl mb-10">
      {eyebrow && <div className="text-[12px] font-semibold tracking-[.18em] uppercase text-[var(--emerald)] mb-2">{eyebrow}</div>}
      <h2 className="text-[28px] sm:text-[36px] font-bold leading-tight text-[var(--navy)]">{title}</h2>
      {text && <p className="mt-3 text-[16px] text-[var(--muted)] leading-relaxed">{text}</p>}
    </div>
  );
}
