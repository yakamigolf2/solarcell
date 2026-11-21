import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ClipboardCheck, Gem, Headphones, Mail, MapPin, PencilRuler, Phone, ShieldCheck, Wrench } from 'lucide-react';
import Calculator from '@/components/site/Calculator';
import Faq from '@/components/site/home/Faq';
import HeroSection from '@/components/site/home/HeroSection';
import LazyExperience from '@/components/site/home/LazyExperience';
import ProductsShowcase from '@/components/site/home/ProductsShowcase';
import ProjectCard from '@/components/site/ProjectCard';
import QuoteForm from '@/components/site/QuoteForm';
import { Reveal, RevealItem, SectionTitle, Stagger } from '@/components/site/Reveal';
import { getPublishedProducts } from '@/lib/products';
import { getPublishedClients } from '@/lib/clients';
import { getPublishedProjects } from '@/lib/projects';
import { COMPANY } from '@/lib/site-data';
import { COMPANY_STATS, FAQ, TRUST_FACTS } from '@/lib/solar-copy';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: { absolute: 'BGE SolarTech | โซลาร์เซลล์ครบวงจร สำหรับบ้านและธุรกิจ' },
  description: 'ออกแบบ ติดตั้ง และดูแลระบบโซลาร์เซลล์ครบวงจร On-grid, Hybrid และ Off-grid สำหรับบ้าน อาคารพาณิชย์ และโรงงาน',
  openGraph: { title: 'BGE SolarTech — Intelligent Solar Energy', description: 'Smarter Solar Solutions for Homes, Businesses and Industries.', type: 'website', locale: 'th_TH', images: [{ url: '/hero-bg.jpg', width: 1679, height: 937, alt: 'บ้านที่ติดตั้งโซลาร์เซลล์' }] },
};

const WHY = [
  { icon: Headphones, t: 'Professional consultation', d: 'ฟังการใช้ไฟและเป้าหมายของคุณ แล้วแนะนำระบบที่เหมาะสม ไม่เกินความจำเป็น' },
  { icon: PencilRuler, t: 'System design', d: 'สำรวจหน้างานและออกแบบตามทิศทางแสง โครงสร้างหลังคา และโหลดไฟฟ้าจริง' },
  { icon: Gem, t: 'Quality equipment', d: 'เลือกอุปกรณ์มาตรฐานที่มีการรับประกัน เหมาะกับสภาพการใช้งานของคุณ' },
  { icon: Wrench, t: 'Professional installation', d: 'ติดตั้งตามมาตรฐานความปลอดภัย ทดสอบระบบก่อนส่งมอบ และช่วยยื่นเอกสารการไฟฟ้า' },
  { icon: ClipboardCheck, t: 'After-sales service', d: 'งานบำรุงรักษาและล้างแผงตามเงื่อนไขในใบเสนอราคา' },
  { icon: ShieldCheck, t: 'Warranty support', d: 'การรับประกันอุปกรณ์และงานติดตั้งระบุชัดเจนในใบเสนอราคา' },
];

export default async function Home() {
  const [products, projects, clients] = await Promise.all([getPublishedProducts(), getPublishedProjects(3), getPublishedClients()]);
  const stats = COMPANY_STATS.filter(s => s.value);
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', name: COMPANY.brand, legalName: COMPANY.legal, telephone: COMPANY.phone, email: COMPANY.email, address: { '@type': 'PostalAddress', streetAddress: COMPANY.address, addressCountry: 'TH' } },
      { '@type': 'FAQPage', mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <HeroSection />

      {/* 2 — Trust: only verified facts (warranty terms from the company's quotation, customer logos). Unknown statistics are hidden. */}
      <section aria-labelledby="trust-title" className="max-w-[1200px] mx-auto px-5 pt-6">
        <h2 id="trust-title" className="sr-only">ความน่าเชื่อถือและการรับประกัน</h2>
        <Reveal>
          <div className="rounded-[28px] bg-white border border-[var(--line)] p-6 sm:p-8">
            {stats.length > 0 && <dl className="grid grid-cols-2 sm:grid-cols-3 gap-6 pb-6 mb-6 border-b border-[var(--line)]">{stats.map(s => <div key={s.label}><dd className="text-[32px] font-bold text-[var(--navy)] leading-none">{s.value}</dd><dt className="mt-1 text-[13px] text-[var(--muted)]">{s.label}</dt></div>)}</dl>}
            <div className="text-[12px] font-semibold tracking-[.16em] uppercase text-[var(--emerald)]">Warranty &amp; service</div>
            <dl className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-5">
              {TRUST_FACTS.map(f => <div key={f.label}><dd className="text-[30px] sm:text-[34px] font-bold text-[var(--navy)] leading-none tracking-tight">{f.value}</dd><dt className="mt-2 text-[13px] font-medium text-[var(--navy)] leading-snug">{f.label}</dt>{f.note && <p className="mt-0.5 text-[11.5px] text-[var(--muted)]">{f.note}</p>}</div>)}
            </dl>
            <p className="mt-5 text-[11.5px] text-[var(--muted)]">เงื่อนไขการรับประกันเป็นไปตามที่ระบุในใบเสนอราคาและอาจต่างกันตามรุ่นอุปกรณ์</p>
          </div>
        </Reveal>
        {clients.length > 0 && <Reveal className="mt-10">
          <h3 className="text-center text-[13px] font-semibold tracking-[.18em] uppercase text-[var(--muted)]">ลูกค้าของเรา</h3>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {clients.map(c => <li key={c.id} className="transition-transform duration-300 hover:-translate-y-1 hover:scale-105 motion-reduce:transform-none"><Image src={c.logo} alt={c.name} width={200} height={70} className="h-[70px] w-auto max-w-[200px] object-contain" /></li>)}
          </ul>
        </Reveal>}
      </section>

      {/* 4 — Interactive explorer (lazy-loaded) */}
      <section id="experience" className="max-w-[1200px] mx-auto px-5 pt-24 scroll-mt-24" aria-label="ระบบโซลาร์เซลล์ของเรา">
        <Reveal><LazyExperience /></Reveal>
      </section>

      {/* 5 — Products */}
      {products.length > 0 && (
        <section id="products" className="max-w-[1200px] mx-auto px-5 pt-28">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionTitle eyebrow="Products" title="อุปกรณ์คุณภาพในทุกระบบ" text="แผงโซลาร์ อินเวอร์เตอร์ แบตเตอรี่ และอุปกรณ์ประกอบ เลือกรุ่นให้เหมาะกับงบประมาณและหน้างาน" />
            <Link href="/solutions" className="mb-10 inline-block py-2 text-[14px] font-semibold text-[var(--navy)] hover:text-[var(--emerald)]">ดูรายละเอียดทั้งหมด →</Link>
          </div>
          <Reveal><ProductsShowcase items={products} /></Reveal>
        </section>)}

      {/* 6 — Calculator */}
      <section id="calculator" className="max-w-[1200px] mx-auto px-5 pt-28">
        <SectionTitle eyebrow="Savings calculator" title="ประเมินการประหยัดไฟเบื้องต้น" />
        <Reveal><Calculator /></Reveal>
      </section>

      {/* 7 — Real projects (hidden until verified projects are published in the backoffice) */}
      {projects.length > 0 && (
        <section id="projects" className="max-w-[1200px] mx-auto px-5 pt-28">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionTitle eyebrow="Installation projects" title="ผลงานการติดตั้งจริง" />
            <Link href="/projects" className="mb-10 text-[14px] font-semibold text-[var(--navy)] hover:text-[var(--emerald)]">ดูผลงานทั้งหมด →</Link>
          </div>
          <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{projects.map(p => <RevealItem key={p.id}><ProjectCard p={p} /></RevealItem>)}</Stagger>
        </section>)}

      {/* 8 — Why */}
      <section id="why" className="max-w-[1200px] mx-auto px-5 pt-28">
        <SectionTitle eyebrow="Why BGE SolarTech" title="ทำไมต้อง BGE SolarTech" />
        <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
          {WHY.map(w => <RevealItem key={w.t}><div className="flex gap-4"><span className="w-12 h-12 rounded-2xl bg-[var(--primary-soft)] text-[var(--navy)] flex items-center justify-center shrink-0"><w.icon size={22} /></span><div><h3 className="font-bold text-[var(--navy)] text-[16px]">{w.t}</h3><p className="mt-1 text-[14px] text-[var(--muted)] leading-relaxed">{w.d}</p></div></div></RevealItem>)}
        </Stagger>
      </section>

      {/* 9 — FAQ */}
      <section id="faq" className="max-w-[860px] mx-auto px-5 pt-28">
        <SectionTitle eyebrow="FAQ" title="คำถามที่พบบ่อย" />
        <Reveal><Faq /></Reveal>
      </section>

      {/* 10 — Final CTA */}
      <section id="contact" className="mt-28 -mb-24 relative overflow-hidden isolate">
        <Image src="/hero-bg.jpg" alt="" fill sizes="100vw" className="object-cover -z-20" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[#123C32]/90" />
        <div className="max-w-[1100px] mx-auto px-5 py-20 sm:py-28 grid lg:grid-cols-[1fr_1.1fr] gap-12 items-start text-white">
          <Reveal>
            <p className="text-[12px] font-semibold tracking-[.2em] uppercase text-[var(--energy)]">Free consultation</p>
            <h2 className="mt-3 text-[34px] sm:text-[46px] font-bold leading-[1.1] tracking-tight">Let&apos;s Build a Smarter Energy Future.</h2>
            <p className="mt-4 text-white/75 text-[16px] leading-relaxed">Get Your Free Solar Consultation — ทีมงานจะติดต่อกลับเพื่อนัดสำรวจหน้างานและเสนอราคาที่เหมาะสม</p>
            <ul className="mt-8 space-y-3 text-[15px]">
              <li><a href={COMPANY.phoneHref} className="flex items-center gap-3 py-1.5 hover:text-[var(--energy)]"><Phone size={18} />{COMPANY.phone}</a></li>
              <li><a href={`mailto:${COMPANY.email}`} className="flex items-center gap-3 py-1.5 hover:text-[var(--energy)] break-all"><Mail size={18} className="shrink-0" />{COMPANY.email}</a></li>
              <li className="flex gap-3 text-white/80"><MapPin size={18} className="shrink-0 mt-0.5" />{COMPANY.address}</li>
            </ul>
          </Reveal>
          <Reveal delay={0.1}><div className="text-[var(--ink)]"><QuoteForm /></div></Reveal>
        </div>
      </section>
    </>
  );
}
