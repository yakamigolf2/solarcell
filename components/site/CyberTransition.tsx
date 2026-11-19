'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { NAV } from '@/lib/site-data';

const MIN_MS = 650;   // keep the effect visible long enough to read
const MAX_MS = 5000;  // never get stuck if navigation fails

const LABELS: Record<string, string> = { ...Object.fromEntries(NAV.map(n => [n.href, n.label])), '/quote': 'ขอใบเสนอราคา' };

/** Cyber-style page-load overlay shown between clicking an internal link and the new route rendering. CSS-only motion (transform/opacity). */
export default function CyberTransition() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<'idle' | 'loading' | 'leaving'>('idle');
  const [target, setTarget] = useState('');
  const [pct, setPct] = useState(0);
  const startedAt = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  // 1) start on internal link clicks
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      clear();
      startedAt.current = Date.now();
      setTarget(LABELS[url.pathname] || (url.pathname === '/admin' ? 'BACKOFFICE' : 'BGE SOLARTECH'));
      setPct(8); setPhase('loading');
      timers.current.push(setTimeout(() => { setPhase('leaving'); timers.current.push(setTimeout(() => setPhase('idle'), 260)); }, MAX_MS));
    };
    document.addEventListener('click', onClick, true);
    return () => { document.removeEventListener('click', onClick, true); clear(); };
  }, []);

  // 2) fake-but-smooth progress while loading
  useEffect(() => {
    if (phase !== 'loading') return;
    const id = setInterval(() => setPct(p => (p < 92 ? p + Math.max(1, Math.round((95 - p) / 9)) : p)), 70);
    return () => clearInterval(id);
  }, [phase]);

  // 3) route rendered -> finish after the minimum display time
  useEffect(() => {
    if (phaseRef.current !== 'loading') return;
    const wait = Math.max(0, MIN_MS - (Date.now() - startedAt.current));
    clear();
    timers.current.push(setTimeout(() => {
      setPct(100); setPhase('leaving');
      timers.current.push(setTimeout(() => setPhase('idle'), 280));
    }, wait));
  }, [pathname]);

  if (phase === 'idle') return null;
  return (
    <div aria-hidden className={`cyber-tr ${phase === 'leaving' ? 'is-leaving' : ''}`}>
      <div className="cyber-bar-top"><span style={{ transform: `scaleX(${pct / 100})` }} /></div>
      <div className="cyber-screen">
        <div className="cyber-grid" />
        <div className="cyber-scan" />
        <span className="cyber-corner tl" /><span className="cyber-corner tr" /><span className="cyber-corner bl" /><span className="cyber-corner br" />
        <div className="cyber-hud">
          <div className="cyber-ring"><i /><i /><b>{Math.min(pct, 100)}</b></div>
          <div className="cyber-glitch" data-text="LOADING">LOADING</div>
          <div className="cyber-mono">&gt; BGE SOLARTECH // <em>{target}</em><span className="cyber-caret">_</span></div>
          <div className="cyber-meter"><span style={{ transform: `scaleX(${pct / 100})` }} /></div>
          <div className="cyber-mono dim">SYS.LINK ESTABLISHED · {String(Math.min(pct, 100)).padStart(3, '0')}%</div>
        </div>
      </div>
    </div>
  );
}
