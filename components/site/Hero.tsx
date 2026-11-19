'use client';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { ArrowRight, Headphones, Leaf, ShieldCheck, Sun } from 'lucide-react';
import CountUp from '@/components/CountUp';

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const cardY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  return (
    <section ref={ref} className="relative -mt-[76px] pt-[120px] pb-24 overflow-hidden min-h-[640px]">
      <div aria-hidden className="absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,#000_72%,transparent)]">
        <motion.div style={{ y: sceneY }} className="absolute inset-x-0 -top-10 -bottom-16"><Image src="/hero-bg.jpg" alt="" fill priority sizes="100vw" className="object-cover object-[70%_center]" /></motion.div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/45 to-transparent lg:from-white/80 lg:via-white/30" />
      </div>
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
          <div className="hidden lg:block h-[380px]" aria-hidden />
          <motion.div style={{ y: cardY }} className="lg:absolute lg:top-6 lg:right-4 mt-6 lg:mt-0 animate-float w-fit">
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
