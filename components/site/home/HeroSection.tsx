'use client';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';

export default function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 60]);
  return (
    <section ref={ref} className="relative -mt-[76px] pt-[140px] pb-28 sm:pb-36 min-h-[680px] overflow-hidden isolate">
      <div aria-hidden className="absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,#000_78%,transparent)]">
        <motion.div style={{ y }} className="absolute inset-x-0 -top-10 -bottom-16"><Image src="/hero-bg.jpg" alt="" fill priority sizes="100vw" className="object-cover object-[70%_center]" /></motion.div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#F8F9F6]/92 via-[#F8F9F6]/60 to-transparent lg:from-[#F8F9F6]/88 lg:via-[#F8F9F6]/50" />
      </div>
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="max-w-[640px]">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-[12px] sm:text-[13px] font-semibold tracking-[.22em] uppercase text-[var(--emerald)]">BGE SolarTech</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }} className="mt-4 text-[40px] sm:text-[58px] lg:text-[66px] font-bold leading-[1.06] tracking-tight text-[var(--navy)]">
            Power Your Future with <span className="text-gradient">Intelligent Solar</span> Energy.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.16 }} className="mt-5 text-[17px] sm:text-[19px] leading-relaxed text-[#2F3B35] max-w-xl">
            Smarter Solar Solutions for Homes, Businesses and Industries.
            <span className="block mt-1 text-[15px] text-[var(--muted)]">โซลูชันโซลาร์เซลล์ที่ออกแบบเฉพาะหน้างาน สำหรับบ้าน อาคารพาณิชย์ และโรงงาน</span>
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.24 }} className="mt-8 flex flex-wrap gap-3">
            <Link href="/quote" className="btn-primary inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold">Get Solar Consultation <ArrowRight size={18} /></Link>
            <a href="#experience" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold border border-[var(--navy)]/25 text-[var(--navy)] bg-white/75 hover:bg-white transition">Explore Solar Solutions</a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
