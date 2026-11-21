import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// Static hero: no scroll parallax / entrance motion (kept off for smooth scrolling).
export default function HeroSection() {
  return (
    <section className="relative -mt-[76px] pt-[140px] pb-28 sm:pb-36 min-h-[680px] overflow-hidden isolate">
      <div aria-hidden className="absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,#000_78%,transparent)]">
        <Image src="/hero-bg.jpg" alt="" fill priority sizes="100vw" className="object-cover object-[70%_center]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#F8F9F6]/90 via-[#F8F9F6]/82 to-[#F8F9F6]/55 sm:bg-gradient-to-r sm:from-[#F8F9F6]/92 sm:via-[#F8F9F6]/60 sm:to-transparent lg:from-[#F8F9F6]/88 lg:via-[#F8F9F6]/50" />
      </div>
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="max-w-[640px]">
          <p className="text-[12px] sm:text-[13px] font-semibold tracking-[.22em] uppercase text-[var(--emerald)]">BGE SolarTech</p>
          <h1 className="mt-4 text-[40px] sm:text-[58px] lg:text-[66px] font-bold leading-[1.06] tracking-tight text-[var(--navy)]">
            Power Your Future with <span className="text-gradient">Intelligent Solar</span> Energy.
          </h1>
          <p className="mt-5 text-[17px] sm:text-[19px] leading-relaxed text-[#2F3B35] max-w-xl">
            Smarter Solar Solutions for Homes, Businesses and Industries.
            <span className="block mt-1 text-[15px] text-[#3E4C45] sm:text-[var(--muted)]">โซลูชันโซลาร์เซลล์ที่ออกแบบเฉพาะหน้างาน สำหรับบ้าน อาคารพาณิชย์ และโรงงาน</span>
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/quote" className="btn-primary inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold">Get Solar Consultation <ArrowRight size={18} /></Link>
            <a href="#experience" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold border border-[var(--navy)]/25 text-[var(--navy)] bg-white/75 hover:bg-white transition-colors">Explore Solar Solutions</a>
          </div>
        </div>
      </div>
    </section>
  );
}
