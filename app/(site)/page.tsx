import Link from 'next/link';
import { ArrowRight, Quote, Star } from 'lucide-react';
import Hero from '@/components/site/Hero';
import Calculator from '@/components/site/Calculator';
import QuoteForm from '@/components/site/QuoteForm';
import { Reveal, RevealItem, SectionTitle, Stagger } from '@/components/site/Reveal';
import { NEWS, PROJECTS, SOLUTIONS, TESTIMONIALS, WHY } from '@/lib/site-data';

export default function Home() {
  return (
    <>
      <Hero />

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
        <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PROJECTS.slice(0, 3).map(p => (
            <RevealItem key={p.id}><article className="lift glass rounded-[28px] overflow-hidden">
              <div className={`h-44 bg-gradient-to-br ${p.hue} relative`} aria-hidden><span className="absolute bottom-3 left-4 text-white/90 text-[13px] font-semibold bg-black/20 rounded-full px-3 py-1">{p.kw} kWp</span></div>
              <div className="p-5"><div className="text-[12px] text-[var(--emerald)] font-semibold">{p.type} • {p.place}</div><h3 className="mt-1 font-bold text-[16px] text-[var(--navy)] leading-snug">{p.title}</h3></div>
            </article></RevealItem>))}
        </Stagger>
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
        <Stagger className="grid md:grid-cols-3 gap-5">
          {NEWS.map(n => <RevealItem key={n.id}><article className="lift rounded-[28px] bg-white/70 border border-white p-6 h-full"><div className="flex justify-between text-[12px]"><span className="font-semibold text-[var(--emerald)]">{n.tag}</span><span className="text-[var(--muted)]">{n.date}</span></div><h3 className="mt-2 font-bold text-[17px] text-[var(--navy)] leading-snug">{n.title}</h3><p className="mt-2 text-[14px] text-[var(--muted)] leading-relaxed">{n.text}</p></article></RevealItem>)}
        </Stagger>
      </section>

      <section id="quote" className="max-w-[1000px] mx-auto px-5 pt-24">
        <SectionTitle eyebrow="Request a quote" title="ขอใบเสนอราคา" text="กรอกข้อมูลเบื้องต้น ทีมงานจะติดต่อกลับเพื่อนัดสำรวจหน้างาน" />
        <Reveal><QuoteForm /></Reveal>
      </section>
    </>
  );
}
