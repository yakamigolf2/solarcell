import type { Metadata } from 'next';
import NewsCard from '@/components/site/NewsCard';
import { RevealItem, SectionTitle, Stagger } from '@/components/site/Reveal';
import { getPublishedNews } from '@/lib/news';

export const metadata: Metadata = { title: 'ข่าวสารและบทความ' };
export const dynamic = 'force-dynamic';

export default async function News() {
  const items = await getPublishedNews();
  return (
    <div className="max-w-[1100px] mx-auto px-5 pt-16">
      <SectionTitle eyebrow="News & articles" title="ข่าวสารและบทความ" text="ความรู้เรื่องโซลาร์เซลล์ การประหยัดพลังงาน และการดูแลระบบ" />
      {items.length === 0 ? <p className="glass rounded-3xl p-10 text-center text-[var(--muted)]">ยังไม่มีข่าวสาร</p> :
        <Stagger className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{items.map(n => <RevealItem key={n.id}><NewsCard n={n} /></RevealItem>)}</Stagger>}
    </div>
  );
}
