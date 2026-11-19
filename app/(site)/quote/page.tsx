import type { Metadata } from 'next';
import QuoteForm from '@/components/site/QuoteForm';
import { Reveal, SectionTitle } from '@/components/site/Reveal';

export const metadata: Metadata = { title: 'ขอใบเสนอราคา' };

export default function Quote() {
  return (
    <div className="max-w-[900px] mx-auto px-5 pt-16">
      <SectionTitle eyebrow="Request a quote" as="h1" title="ขอใบเสนอราคา" text="กรอกข้อมูลเบื้องต้น ทีมงานจะติดต่อกลับเพื่อนัดสำรวจหน้างานและเสนอราคาที่เหมาะสม" />
      <Reveal><QuoteForm /></Reveal>
    </div>
  );
}
