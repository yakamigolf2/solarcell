import Image from 'next/image';
import Link from 'next/link';
import { fmtThaiDate, type NewsItem } from '@/lib/news';

export default function NewsCard({ n }: { n: NewsItem }) {
  return (
    <Link href={`/news/${n.id}`} className="lift glass block rounded-[28px] overflow-hidden h-full">
      {n.cover && <div className="relative aspect-[16/9] bg-sky-100"><Image src={n.cover} alt="" fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover" /></div>}
      <article className="p-6">
        <div className="flex justify-between text-[12px]"><span className="font-semibold text-[var(--emerald)]">{n.tag}</span><time className="text-[var(--muted)]">{fmtThaiDate(n.date)}</time></div>
        <h3 className="mt-2 font-bold text-[17px] text-[var(--navy)] leading-snug">{n.title}</h3>
        <p className="mt-2 text-[14px] text-[var(--muted)] leading-relaxed line-clamp-3">{n.summary}</p>
      </article>
    </Link>
  );
}
