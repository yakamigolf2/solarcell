import type { Metadata } from 'next';
import { RevealItem, SectionTitle, Stagger } from '@/components/site/Reveal';
import { NEWS } from '@/lib/site-data';

export const metadata: Metadata = { title: 'ข่าวสารและบทความ' };

export default function News() {
  return (
    <div className="max-w-[900px] mx-auto px-5 pt-16">
      <SectionTitle eyebrow="News & articles" title="ข่าวสารและบทความ" text="ความรู้เรื่องโซลาร์เซลล์ การประหยัดพลังงาน และการดูแลระบบ" />
      <Stagger className="space-y-4">
        {NEWS.map(n => <RevealItem key={n.id}><article className="lift glass rounded-[28px] p-6"><div className="flex justify-between text-[12px]"><span className="font-semibold text-[var(--emerald)]">{n.tag}</span><time className="text-[var(--muted)]">{n.date}</time></div><h2 className="mt-2 font-bold text-[20px] text-[var(--navy)]">{n.title}</h2><p className="mt-2 text-[15px] text-[var(--muted)] leading-relaxed">{n.text}</p></article></RevealItem>)}
      </Stagger>
    </div>
  );
}
