import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import Calculator from '@/components/site/Calculator';
import { Reveal, RevealItem, SectionTitle, Stagger } from '@/components/site/Reveal';
import { SERVICES, SOLUTIONS } from '@/lib/site-data';

export const metadata: Metadata = { title: 'สินค้าและบริการ' };

export default function Solutions() {
  return (
    <div className="max-w-[1200px] mx-auto px-5 pt-16">
      <SectionTitle eyebrow="Solar solutions" title="โซลูชันและบริการ" text="เลือกโซลูชันที่เหมาะกับประเภทอาคารของคุณ เราดูแลตั้งแต่สำรวจ ออกแบบ จัดหาอุปกรณ์ ติดตั้ง จนถึงเอกสารการไฟฟ้า" />
      <Stagger className="grid lg:grid-cols-3 gap-5">
        {SOLUTIONS.map(s => (
          <RevealItem key={s.slug}><section id={s.slug} className="glass rounded-[28px] p-6 h-full">
            <span className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.tone} flex items-center justify-center`}><s.icon size={28} /></span>
            <h2 className="mt-4 text-[20px] font-bold text-[var(--navy)]">{s.title}</h2>
            <p className="mt-2 text-[14.5px] text-[var(--muted)] leading-relaxed">{s.text}</p>
            <ul className="mt-4 space-y-2">{s.points.map(p => <li key={p} className="flex gap-2 text-[14px]"><CheckCircle2 size={17} className="text-emerald-500 shrink-0 mt-0.5" />{p}</li>)}</ul>
          </section></RevealItem>))}
      </Stagger>
      <div className="pt-20"><SectionTitle eyebrow="Services" title="ขั้นตอนการทำงาน" /></div>
      <Stagger className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {SERVICES.map((s, i) => <RevealItem key={s.title}><div className="rounded-3xl bg-white/70 border border-white p-5 h-full"><div className="text-[28px] font-bold text-gradient">{i + 1}</div><h3 className="font-bold text-[15px] text-[var(--navy)] mt-1">{s.title}</h3><p className="text-[13px] text-[var(--muted)] mt-1.5 leading-relaxed">{s.text}</p></div></RevealItem>)}
      </Stagger>
      <div className="pt-20"><Reveal><Calculator /></Reveal></div>
      <Reveal className="mt-12 text-center"><Link href="/quote" className="btn-primary inline-flex px-8 py-3.5 rounded-full font-semibold">ขอใบเสนอราคา</Link></Reveal>
    </div>
  );
}
