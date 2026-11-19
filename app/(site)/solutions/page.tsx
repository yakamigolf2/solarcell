import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Phone } from 'lucide-react';
import Calculator from '@/components/site/Calculator';
import { Reveal, RevealItem, SectionTitle, Stagger } from '@/components/site/Reveal';
import Image from 'next/image';
import { getPublishedProducts } from '@/lib/products';
import { HUES, PRODUCT_ICONS } from '@/lib/product-icons';
import { COMPANY, DESIGN_PRINCIPLES, SERVICES, SYSTEMS } from '@/lib/site-data';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'สินค้าและบริการ', description: 'ระบบโซลาร์เซลล์ อุปกรณ์ และบริการครบวงจร ตั้งแต่ปรึกษา สำรวจ ติดตั้ง จนถึงดูแลหลังการขาย' };

export default async function Solutions() {
  const products = await getPublishedProducts();
  return (
    <div className="max-w-[1200px] mx-auto px-5 pt-16">
      <SectionTitle eyebrow="Products & services" as="h1" title="สินค้าและบริการ" text="เลือกระบบที่เหมาะกับการใช้ไฟของคุณ เราดูแลตั้งแต่ปรึกษา สำรวจ ออกแบบ จัดหาอุปกรณ์ ติดตั้ง จนถึงเอกสารการไฟฟ้าและการดูแลหลังการขาย" />

      <Stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {SYSTEMS.map(s => (
          <RevealItem key={s.title}><div className="lift glass rounded-[28px] p-6 h-full">
            <span className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.tone} flex items-center justify-center`}><s.icon size={28} /></span>
            <h2 className="mt-4 text-[18px] font-bold text-[var(--navy)]">{s.title}</h2>
            <div className="text-[12px] font-semibold text-[var(--emerald)] mt-0.5">{s.range}</div>
            <p className="mt-2 text-[14px] text-[var(--muted)] leading-relaxed">{s.text}</p>
          </div></RevealItem>))}
      </Stagger>

      <div className="pt-20"><SectionTitle eyebrow="Equipment" title="อุปกรณ์คุณภาพในทุกระบบ" text="อุปกรณ์หลักที่เราเลือกใช้ พร้อมเงื่อนไขการรับประกัน (รุ่นและยี่ห้อเลือกได้ตามงบประมาณและหน้างาน)" /></div>
      {products.length === 0 ? <p className="glass rounded-3xl p-10 text-center text-[var(--muted)]">กำลังเตรียมข้อมูลอุปกรณ์</p> : (
      <div className="space-y-6">
        {products.map((p, i) => { const Icon = (PRODUCT_ICONS[p.icon] || PRODUCT_ICONS.package).icon; return (
          <Reveal key={p.id}>
            <section id={p.id} className={`glass rounded-[32px] overflow-hidden grid md:grid-cols-2 ${i % 2 ? 'md:[&>div:first-child]:order-2' : ''}`}>
              <div className={`relative min-h-[240px] bg-gradient-to-br ${HUES[i % HUES.length]} flex items-center justify-center`}>
                {p.cover ? <Image src={p.cover} alt={p.title} fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" /> : <Icon size={84} className="text-white/90 drop-shadow-lg" aria-hidden />}
              </div>
              <div className="p-6 sm:p-8">
                <h3 className="text-[26px] sm:text-[30px] font-bold text-[var(--navy)] leading-tight">{p.title}</h3>
                <div className="mt-2 h-1 w-14 rounded-full bg-[var(--emerald)]" aria-hidden />
                <ul className="mt-5 space-y-3">{p.points.map(pt => <li key={pt} className="flex items-start gap-3 text-[15.5px] text-[var(--navy)]"><span className="mt-0.5 w-6 h-6 rounded-full bg-[var(--emerald)] text-white flex items-center justify-center shrink-0"><Check size={15} strokeWidth={3} /></span>{pt}</li>)}</ul>
                {p.note && <p className="mt-3 text-[12px] text-[var(--muted)]">* {p.note}</p>}
                {p.gallery.length > 0 && <ul className="mt-5 grid grid-cols-4 gap-2">{p.gallery.map((u, k) => <li key={u}><a href={u} target="_blank" rel="noreferrer" className="block relative aspect-[4/3] rounded-xl overflow-hidden border bg-sky-50"><Image src={u} alt={`${p.title} รูปที่ ${k + 1}`} fill sizes="120px" className="object-cover hover:scale-105 transition-transform" /></a></li>)}</ul>}
              </div>
            </section>
          </Reveal>); })}
      </div>)}

      <div className="pt-20"><SectionTitle eyebrow="Our services" title="บริการของเรา" /></div>
      <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {SERVICES.map((s, i) => (
          <RevealItem key={s.title}><div className="lift rounded-[28px] bg-white/70 border border-white p-6 h-full">
            <div className="flex items-center gap-3"><span className="w-12 h-12 rounded-2xl bg-sky-50 text-[var(--primary)] flex items-center justify-center"><s.icon size={24} /></span><span className="text-[13px] font-bold text-[var(--muted)]">0{i + 1}</span></div>
            <h3 className="mt-3 font-bold text-[16px] text-[var(--navy)]">{s.title}</h3><p className="text-[14px] text-[var(--muted)] mt-1.5 leading-relaxed">{s.text}</p>
          </div></RevealItem>))}
      </Stagger>

      <div className="pt-20"><SectionTitle eyebrow="Design principles" title="หลักการออกแบบของเรา" /></div>
      <Stagger className="grid md:grid-cols-3 gap-5">
        {DESIGN_PRINCIPLES.map(d => <RevealItem key={d.title}><div className="glass rounded-[28px] p-6 h-full"><d.icon className="text-[var(--emerald)]" size={28} /><h3 className="mt-3 font-bold text-[var(--navy)]">{d.title}</h3><p className="text-[14px] text-[var(--muted)] mt-1.5 leading-relaxed">{d.text}</p></div></RevealItem>)}
      </Stagger>

      <div className="pt-20"><Reveal><Calculator /></Reveal></div>

      <Reveal className="mt-16">
        <div className="rounded-[32px] bg-gradient-to-br from-[#102A43] to-[#0B4F5C] text-white p-8 sm:p-10 flex flex-wrap items-center justify-between gap-5">
          <div><h2 className="text-[24px] sm:text-[28px] font-bold">พร้อมเริ่มต้นกับระบบโซลาร์แล้วหรือยัง</h2><p className="text-white/75 mt-1">ปรึกษาและนัดสำรวจหน้างานได้ฟรี</p></div>
          <div className="flex flex-wrap gap-3">
            <a href={COMPANY.phoneHref} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 border border-white/30 font-semibold"><Phone size={18} />{COMPANY.phone}</a>
            <Link href="/quote" className="btn-primary inline-flex items-center px-7 py-3 rounded-full font-semibold">ขอใบเสนอราคา</Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
