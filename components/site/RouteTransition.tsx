'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { NAV } from '@/lib/site-data';

const MIN_MS = 300;   // the veil itself only appears after ~160ms, so quick navigations just show the progress bar
const MAX_MS = 5000;  // never get stuck if navigation fails

const LABELS: Record<string, string> = { ...Object.fromEntries(NAV.map(n => [n.href, n.label])), '/quote': 'ขอใบเสนอราคา' };

/** Page-load indicator between clicking an internal link and the new route rendering: top gradient bar, then (if slow) a soft frosted card with the logo. CSS-only motion. */
export default function RouteTransition() {
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
      setTarget(LABELS[url.pathname] || (url.pathname === '/admin' ? 'ระบบหลังบ้าน' : url.pathname.startsWith('/news/') ? 'ข่าวสาร' : 'หน้าถัดไป'));
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
    <div aria-hidden className={`route-tr ${phase === 'leaving' ? 'is-leaving' : ''}`}>
      <div className="route-bar"><span style={{ transform: `scaleX(${pct / 100})` }} /></div>
      <div className="route-veil">
        <div className="route-card">
          <div className="route-mark"><i /><img src="/BGE_logo.png" alt="" /></div>
          <div className="route-label">กำลังเปิด <b>{target}</b></div>
          <div className="route-dots"><span /><span /><span /></div>
        </div>
      </div>
    </div>
  );
}
