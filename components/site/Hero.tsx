'use client';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { ArrowRight, Headphones, Leaf, ShieldCheck, Sun } from 'lucide-react';
import CountUp from '@/components/CountUp';

function SolarScene() {
  // Illustrated house + roof array (no stock photo bundled).
  const panels = Array.from({ length: 12 }, (_, i) => ({ r: Math.floor(i / 4), c: i % 4 }));
  return (
    <svg viewBox="0 0 640 460" className="w-full h-auto drop-shadow-2xl" role="img" aria-label="ภาพประกอบบ้านที่ติดตั้งโซลาร์เซลล์บนหลังคา">
      <defs>
        <linearGradient id="roof" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#334E68" /><stop offset="1" stopColor="#102A43" /></linearGradient>
        <linearGradient id="cell" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3B82F6" /><stop offset="1" stopColor="#1E3A8A" /></linearGradient>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF7ED" /><stop offset="1" stopColor="#FED7AA" /></linearGradient>
        <radialGradient id="sun" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#FEF3C7" /><stop offset="1" stopColor="#FCD34D" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx="500" cy="60" r="90" fill="url(#sun)" />
      <circle cx="500" cy="60" r="26" fill="#FBBF24" />
      <polygon points="90,230 330,70 600,230 600,420 90,420" fill="url(#wall)" />
      <polygon points="40,240 330,40 630,240 590,262 330,92 80,262" fill="url(#roof)" />
      <g transform="translate(210 120) skewY(-6)">
        {panels.map(({ r, c }) => <g key={`${r}-${c}`} transform={`translate(${c * 62 + r * 14} ${r * 34 - c * 6})`}><rect width="58" height="30" rx="3" fill="url(#cell)" stroke="#BFDBFE" strokeWidth="1.5" /><path d="M0 10h58M0 20h58M19 0v30M39 0v30" stroke="#93C5FD" strokeWidth=".8" opacity=".6" /></g>)}
      </g>
      <rect x="150" y="290" width="150" height="130" rx="10" fill="#7DD3FC" opacity=".55" />
      <rect x="340" y="290" width="200" height="130" rx="10" fill="#FDE68A" opacity=".75" />
      <rect x="150" y="290" width="150" height="130" rx="10" fill="none" stroke="#fff" strokeWidth="6" />
      <rect x="340" y="290" width="200" height="130" rx="10" fill="none" stroke="#fff" strokeWidth="6" />
      <rect x="0" y="418" width="640" height="42" fill="#86EFAC" opacity=".55" />
      <circle cx="60" cy="395" r="38" fill="#4ADE80" opacity=".8" /><circle cx="600" cy="385" r="46" fill="#22C55E" opacity=".75" />
    </svg>
  );
}

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const cardY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  return (
    <section ref={ref} className="relative -mt-[76px] pt-[120px] pb-16 overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-br from-[#DBEAFE] via-[#EFF6FF] to-[#CFFAFE] [mask-image:linear-gradient(to_bottom,#000_70%,transparent)]" />
      <div aria-hidden className="blob -z-10 w-[420px] h-[420px] bg-sky-300 -top-24 -left-24" />
      <div aria-hidden className="blob -z-10 w-[380px] h-[380px] bg-emerald-200 top-40 right-0" style={{ animationDelay: '-6s' }} />
      <div className="max-w-[1200px] mx-auto px-5 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-[12px] font-semibold tracking-[.2em] text-[var(--muted)] uppercase">Clean energy for a better tomorrow</motion.div>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }} className="mt-3 text-[34px] sm:text-[48px] font-bold leading-[1.15] text-[var(--navy)]">โซลูชันพลังงานแสงอาทิตย์<br /><span className="text-gradient">สำหรับบ้าน อาคาร และธุรกิจ</span></motion.h1>
          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.16 }} className="mt-4 text-[17px] text-[var(--muted)] leading-relaxed max-w-lg">ออกแบบ ติดตั้ง และดูแลระบบ Solar Cell ครบวงจร ช่วยลดค่าไฟ เพิ่มความคุ้มค่า และเป็นมิตรต่อสิ่งแวดล้อม</motion.p>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.24 }} className="mt-7 flex flex-wrap gap-3">
            <Link href="/quote" className="btn-primary lift inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold">ขอใบเสนอราคา <ArrowRight size={18} /></Link>
            <Link href="/solutions" className="lift inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold border border-[var(--emerald)] text-[var(--emerald)] bg-white/60">ดูโซลูชันของเรา</Link>
          </motion.div>
          <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mt-9 grid grid-cols-3 gap-4 max-w-lg">
            {[{ i: <Leaf size={26} />, t: 'ประหยัดค่าไฟ', s: 'ลดค่าไฟช่วงกลางวัน' }, { i: <ShieldCheck size={26} />, t: 'มั่นใจในคุณภาพ', s: 'อุปกรณ์มาตรฐาน' }, { i: <Headphones size={26} />, t: 'บริการครบวงจร', s: 'ออกแบบ–ติดตั้ง–ดูแล' }].map(x => (
              <li key={x.t} className="text-center"><div className="mx-auto w-12 h-12 rounded-2xl bg-white/70 text-[var(--emerald)] flex items-center justify-center mb-2">{x.i}</div><div className="text-[13px] font-semibold">{x.t}</div><div className="text-[11.5px] text-[var(--muted)]">{x.s}</div></li>))}
          </motion.ul>
        </div>
        <div className="relative">
          <motion.div style={{ y: sceneY }}><SolarScene /></motion.div>
          <motion.div style={{ y: cardY }} className="absolute -top-2 right-0 sm:right-4 animate-float">
            <div className="glass rounded-3xl p-4 w-[210px]">
              <div className="flex items-center gap-2 text-[12px] text-[var(--muted)]"><Sun size={20} className="text-amber-400" /> ตัวอย่างผลิตไฟวันนี้</div>
              <div className="mt-1 text-[28px] font-bold leading-none"><CountUp value={24.8} format={n => n.toFixed(1)} /> <span className="text-[14px] font-medium">kWh</span></div>
              <svg viewBox="0 0 160 40" className="mt-2 w-full" aria-hidden><path d="M0 34 C20 30 30 36 50 24 S85 8 105 16 140 6 160 2" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" /></svg>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
