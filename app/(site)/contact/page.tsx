import type { Metadata } from 'next';
import { Mail, MapPin, Phone } from 'lucide-react';
import QuoteForm from '@/components/site/QuoteForm';
import { Reveal, SectionTitle } from '@/components/site/Reveal';
import { COMPANY } from '@/lib/site-data';

export const metadata: Metadata = { title: 'ติดต่อเรา' };

export default function Contact() {
  return (
    <div className="max-w-[1100px] mx-auto px-5 pt-16">
      <SectionTitle eyebrow="Contact us" as="h1" title="ติดต่อเรา" text="สอบถามข้อมูลหรือนัดสำรวจหน้างานได้ทุกช่องทาง" />
      <div className="grid lg:grid-cols-5 gap-6">
        <Reveal className="lg:col-span-2 glass rounded-[28px] p-6 space-y-5 self-start">
          <div className="font-bold text-[var(--navy)]">{COMPANY.legal}</div>
          <div className="flex gap-3 text-[14.5px]"><MapPin className="text-[var(--primary)] shrink-0" size={20} />{COMPANY.address}</div>
          <a href={COMPANY.phoneHref} className="flex gap-3 py-1.5 text-[14.5px] hover:underline"><Phone className="text-[var(--primary)] shrink-0" size={20} />{COMPANY.phone}</a>
          <a href={`mailto:${COMPANY.email}`} className="flex gap-3 py-1.5 text-[14.5px] hover:underline break-all"><Mail className="text-[var(--primary)] shrink-0" size={20} />{COMPANY.email}</a>
        </Reveal>
        <Reveal className="lg:col-span-3"><QuoteForm /></Reveal>
      </div>
    </div>
  );
}
