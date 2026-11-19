import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Reveal, RevealItem, SectionTitle, Stagger } from '@/components/site/Reveal';
import { COMPANY, SERVICES, WHY } from '@/lib/site-data';

export const metadata: Metadata = { title: 'เกี่ยวกับเรา' };

export default function About() {
  return (
    <div className="max-w-[1100px] mx-auto px-5 pt-16">
      <SectionTitle eyebrow="About us" title={COMPANY.legal} text="เราให้บริการออกแบบ ติดตั้ง และดูแลระบบพลังงานแสงอาทิตย์ครบวงจร โดยเน้นการสำรวจหน้างานจริง ราคาโปร่งใส และการสื่อสารที่ชัดเจนตลอดโครงการ" />
      <Reveal className="glass rounded-[28px] p-6 sm:p-8 grid sm:grid-cols-2 gap-6 text-[14.5px]">
        <div><div className="text-[12px] text-[var(--muted)]">ชื่อบริษัท (อังกฤษ)</div><div className="font-semibold">{COMPANY.legalEn}</div></div>
        <div><div className="text-[12px] text-[var(--muted)]">เลขประจำตัวผู้เสียภาษี</div><div className="font-semibold">{COMPANY.taxId}</div></div>
        <div className="sm:col-span-2"><div className="text-[12px] text-[var(--muted)]">ที่อยู่</div><div className="font-semibold">{COMPANY.address}</div></div>
      </Reveal>
      <div className="pt-16"><SectionTitle eyebrow="What we do" title="บริการของเรา" /></div>
      <Stagger className="grid sm:grid-cols-2 gap-4">
        {SERVICES.map(s => <RevealItem key={s.title}><div className="rounded-3xl bg-white/70 border border-white p-5 flex gap-3"><CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" /><div><h3 className="font-bold text-[var(--navy)]">{s.title}</h3><p className="text-[14px] text-[var(--muted)] mt-1">{s.text}</p></div></div></RevealItem>)}
      </Stagger>
      <div className="pt-16"><SectionTitle eyebrow="Our principles" title="สิ่งที่เรายึดถือ" /></div>
      <Stagger className="grid sm:grid-cols-2 gap-4">
        {WHY.map(w => <RevealItem key={w.title}><div className="glass rounded-3xl p-5"><h3 className="font-bold text-[var(--navy)]">{w.title}</h3><p className="text-[14px] text-[var(--muted)] mt-1">{w.text}</p></div></RevealItem>)}
      </Stagger>
      <Reveal className="mt-14 text-center"><Link href="/quote" className="btn-primary inline-flex px-8 py-3.5 rounded-full font-semibold">ขอใบเสนอราคา</Link></Reveal>
    </div>
  );
}
