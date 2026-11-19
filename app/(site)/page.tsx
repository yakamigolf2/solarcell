import Link from 'next/link';
import { ArrowRight, Quote, Star } from 'lucide-react';
import Hero from '@/components/site/Hero';
import Calculator from '@/components/site/Calculator';
import QuoteForm from '@/components/site/QuoteForm';
import { Reveal, RevealItem, SectionTitle, Stagger } from '@/components/site/Reveal';
import NewsCard from '@/components/site/NewsCard';
import ProjectCard from '@/components/site/ProjectCard';
import { getPublishedNews } from '@/lib/news';
import { getPublishedProjects } from '@/lib/projects';
import Image from 'next/image';
import { CLIENTS, SOLUTIONS, TESTIMONIALS, WHY } from '@/lib/site-data';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [news, projects] = await Promise.all([getPublishedNews(3), getPublishedProjects(3)]);
  return (
    <>
      <Hero />

      <section className="max-w-[1200px] mx-auto px-5 pt-14" aria-labelledby="clients-title">
        <Reveal className="text-center">
          <h2 id="clients-title" className="inline-block rounded-full bg-white/90 border border-[var(--line)] shadow-sm px-8 py-2.5 text-[22px] sm:text-[26px] font-medium text-[#3B1A7A]">ลูกค้าของเรา</h2>
        </Reveal>
        <Stagger className="mt-9 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8 items-center justify-items-center">
          {CLIENTS.map(c => (
            <RevealItem key={c.name}><div className="lift h-[110px] flex items-center justify-center"><Image src={c.src} alt={c.name} width={c.w} height={c.h} className="max-h-[96px] w-auto object-contain" /></div></RevealItem>))}
        </Stagger>
      </section>

      <section className="max-w-[1200px] mx-auto px-5 pt-20">
        <SectionTitle eyebrow="Our solutions" title="โซลูชันที่ออกแบบให้เหมาะกับคุณ" text="ไม่ว่าจะเป็นบ้าน อาคาร หรือโรงงาน เราออกแบบระบบตามการใช้ไฟและพื้นที่หลังคาจริง" />
        <Stagger className="grid md:grid-cols-3 gap-5">
          {SOLUTIONS.map(s => (
            <RevealItem key={s.slug}><Link href="/solutions" className="lift glass block rounded-[28px] p-6 h-full">
              <span className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.tone} flex items-center justify-center`}><s.icon size={28} /></span>
              <h3 className="mt-4 text-[19px] font-bold text-[var(--navy)]">{s.title}</h3>
              <p className="mt-2 text-[14.5px] text-[var(--muted)] leading-relaxed">{s.text}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[14px] font-semibold text-[var(--primary)]">ดูรายละเอียด <ArrowRight size={15} /></span>
            </Link></RevealItem>))}
        </Stagger>
      </section>

      <section className="max-w-[1200px] mx-auto px-5 pt-24">
        <SectionTitle eyebrow="Why choose us" title="ทำไมต้อง BGE SolarTech" />
        <Stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {WHY.map((w, i) => <RevealItem key={w.title}><div className="lift rounded-[28px] bg-white/70 border border-white p-6 h-full"><div className="text-[34px] font-bold text-gradient">0{i + 1}</div><h3 className="mt-2 font-bold text-[17px] text-[var(--navy)]">{w.title}</h3><p className="mt-1.5 text-[14px] text-[var(--muted)] leading-relaxed">{w.text}</p></div></RevealItem>)}
        </Stagger>
      </section>

      <section className="max-w-[1200px] mx-auto px-5 pt-24">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionTitle eyebrow="Featured projects" title="ผลงานการติดตั้งของเรา" />
          <Link href="/projects" className="mb-10 inline-flex items-center gap-1 font-semibold text-[var(--primary)]">ดูผลงานทั้งหมด <ArrowRight size={16} /></Link>
        </div>
        {projects.length === 0 ? <p className="glass rounded-3xl p-8 text-center text-[var(--muted)]">ยังไม่มีผลงาน</p> : <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{projects.map(p => <RevealItem key={p.id}><ProjectCard p={p} /></RevealItem>)}</Stagger>}
      </section>

      <section className="max-w-[1200px] mx-auto px-5 pt-24"><Reveal><Calculator /></Reveal></section>

      <section className="max-w-[1200px] mx-auto px-5 pt-24">
        <SectionTitle eyebrow="Testimonials" title="เสียงจากลูกค้า" />
        <Stagger className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map(t => (
            <RevealItem key={t.name}><figure className="glass rounded-[28px] p-6 h-full flex flex-col">
              <Quote className="text-sky-300" size={28} />
              <div className="flex gap-0.5 mt-2 text-amber-400" aria-label="5 ดาว">{[0, 1, 2, 3, 4].map(i => <Star key={i} size={15} fill="currentColor" />)}</div>
              <blockquote className="mt-3 text-[15px] leading-relaxed text-[var(--navy)] flex-1">“{t.text}”</blockquote>
              <figcaption className="mt-4 text-[13px]"><b>{t.name}</b> <span className="text-[var(--muted)]">• {t.role}</span></figcaption>
            </figure></RevealItem>))}
        </Stagger>
      </section>

      <section className="max-w-[1200px] mx-auto px-5 pt-24">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionTitle eyebrow="Latest news" title="ข่าวสารและบทความล่าสุด" />
          <Link href="/news" className="mb-10 inline-flex items-center gap-1 font-semibold text-[var(--primary)]">ดูทั้งหมด <ArrowRight size={16} /></Link>
        </div>
        {news.length === 0 ? <p className="glass rounded-3xl p-8 text-center text-[var(--muted)]">ยังไม่มีข่าวสาร</p> : <Stagger className="grid md:grid-cols-3 gap-5">{news.map(n => <RevealItem key={n.id}><NewsCard n={n} /></RevealItem>)}</Stagger>}
      </section>

      <section id="quote" className="max-w-[1000px] mx-auto px-5 pt-24">
        <SectionTitle eyebrow="Request a quote" title="ขอใบเสนอราคา" text="กรอกข้อมูลเบื้องต้น ทีมงานจะติดต่อกลับเพื่อนัดสำรวจหน้างาน" />
        <Reveal><QuoteForm /></Reveal>
      </section>
    </>
  );
}
