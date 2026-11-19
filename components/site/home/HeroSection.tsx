'use client';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import IsoScene from '@/components/site/solar/IsoScene';

export default function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 50]);
  return (
    <section ref={ref} className="relative -mt-[76px] pt-[128px] pb-16 sm:pb-24 overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_30%,#EEF4E8_0%,#F8F9F6_60%)]" />
      <div className="max-w-[1200px] mx-auto px-5 grid lg:grid-cols-[1.05fr_1fr] gap-10 items-center">
        <div>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-[12px] sm:text-[13px] font-semibold tracking-[.22em] uppercase text-[var(--emerald)]">BGE SolarTech</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }} className="mt-4 text-[40px] sm:text-[58px] lg:text-[64px] font-bold leading-[1.06] tracking-tight text-[var(--navy)]">
            Power Your Future with <span className="text-gradient">Intelligent Solar</span> Energy.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.16 }} className="mt-5 text-[17px] sm:text-[19px] leading-relaxed text-[var(--muted)] max-w-xl">
            Smarter Solar Solutions for Homes, Businesses and Industries.
            <span className="block mt-1 text-[15px]">โซลูชันโซลาร์เซลล์ที่ออกแบบเฉพาะหน้างาน สำหรับบ้าน อาคารพาณิชย์ และโรงงาน</span>
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.24 }} className="mt-8 flex flex-wrap gap-3">
            <Link href="/quote" className="btn-primary inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold">Get Solar Consultation <ArrowRight size={18} /></Link>
            <a href="#experience" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold border border-[var(--navy)]/25 text-[var(--navy)] bg-white/70 hover:bg-white transition">Explore Solar Solutions</a>
          </motion.div>
        </div>
        <motion.div style={{ y }} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative">
          <IsoScene scenario="hybrid" className="w-full h-auto" />
          <div className="absolute left-1 bottom-1 sm:left-4 sm:bottom-4 glass rounded-2xl px-4 py-3 text-[12px] leading-snug max-w-[220px]">
            <div className="font-semibold text-[var(--navy)]">แสงอาทิตย์ → ไฟฟ้าในบ้าน</div>
            <div className="text-[var(--muted)]">ภาพจำลองการไหลของพลังงานในระบบ Hybrid</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
