import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { fmtThaiDate, type NewsItem } from '@/lib/news';

const FALLBACK = ['from-sky-300 to-blue-600', 'from-emerald-300 to-teal-600', 'from-amber-300 to-orange-500', 'from-indigo-300 to-violet-600'];

/** Magazine-style card: cover on top, expressive headline. `featured` = large hero card for the newest story. */
export default function NewsCard({ n, featured = false, index = 0 }: { n: NewsItem; featured?: boolean; index?: number }) {
  const cover = (
    <div className={`relative overflow-hidden bg-gradient-to-br ${FALLBACK[index % FALLBACK.length]} ${featured ? 'min-h-[260px] md:min-h-full' : 'aspect-[16/10]'}`}>
      {n.cover && <Image src={n.cover} alt="" fill sizes={featured ? '(min-width:768px) 55vw, 100vw' : '(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw'} className="object-cover transition-transform duration-500 group-hover:scale-105" priority={featured} />}
      <span className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold tracking-[.12em] uppercase text-[var(--emerald)]">{n.tag}</span>
    </div>
  );
  return (
    <Link href={`/news/${n.id}`} className={`group lift glass block rounded-[32px] overflow-hidden h-full ${featured ? 'md:grid md:grid-cols-[1.15fr_1fr]' : ''}`}>
      {cover}
      <article className={`flex flex-col ${featured ? 'p-7 sm:p-10 justify-center' : 'p-6'}`}>
        <time className="text-[12px] font-medium tracking-wide text-[var(--muted)]">{fmtThaiDate(n.date)}</time>
        <h3 className={`mt-2 font-bold leading-[1.2] tracking-tight text-[var(--navy)] ${featured ? 'text-[30px] sm:text-[42px]' : 'text-[22px]'}`}>{n.title}</h3>
        <p className={`mt-3 text-[var(--muted)] leading-relaxed ${featured ? 'text-[16px] line-clamp-4' : 'text-[14px] line-clamp-3'}`}>{n.summary}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-[14px] font-semibold text-[var(--primary)]">อ่านต่อ <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
      </article>
    </Link>
  );
}
