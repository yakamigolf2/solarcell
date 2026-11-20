'use client';
import { animate, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

/** Animated number. Shows the final value immediately for reduced-motion users. */
export default function CountUp({ value, format = (n: number) => Math.round(n).toLocaleString('th-TH'), duration = 1.1 }: { value: number; format?: (n: number) => string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  // Always start at 0: the server can't know the reduced-motion setting, so starting at `value` for those users
  // made the first client render differ from the HTML (React hydration error #418). The effect jumps to `value`.
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (reduce) { setShown(value); return; }
    if (!inView) return;
    const c = animate(0, value, { duration, ease: 'easeOut', onUpdate: v => setShown(v) });
    return () => c.stop();
  }, [value, inView, reduce, duration]);
  return <span ref={ref}>{format(shown)}</span>;
}
