import type { Metadata } from 'next';
import NewsCard from '@/components/site/NewsCard';
import { Reveal, RevealItem, Stagger } from '@/components/site/Reveal';
import { getPublishedNews } from '@/lib/news';

export const metadata: Metadata = { title: 'ข่าวสารและบทความ' };
export const dynamic = 'force-dynamic';

export default async function News() {
  const items = await getPublishedNews();
  const [first, ...rest] = items;
  return (
    <div className="max-w-[1200px] mx-auto px-5 pt-16">
      <Reveal className="mb-10">
        <div className="text-[12px] font-semibold tracking-[.18em] uppercase text-[var(--emerald)] mb-2">News &amp; articles</div>
        <h1 className="text-[44px] sm:text-[64px] font-bold leading-[1.05] tracking-tight text-gradient">ข่าวสาร<br className="sm:hidden" />และบทความ</h1>
        <p className="mt-3 text-[17px] text-[var(--muted)] max-w-xl">ความรู้เรื่องโซลาร์เซลล์ การประหยัดพลังงาน และการดูแลระบบ</p>
      </Reveal>
      {!first ? <p className="glass rounded-3xl p-10 text-center text-[var(--muted)]">ยังไม่มีข่าวสาร</p> : (
        <>
          <Reveal><NewsCard n={first} featured /></Reveal>
          {rest.length > 0 && <Stagger className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">{rest.map((n, i) => <RevealItem key={n.id}><NewsCard n={n} index={i + 1} /></RevealItem>)}</Stagger>}
        </>
      )}
    </div>
  );
}
