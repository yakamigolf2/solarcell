import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toEmbedUrl } from '@/lib/embed';
import { fmtThaiDate, getPublishedNewsItem, type Block } from '@/lib/news';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const n = await getPublishedNewsItem((await params).id);
  return n ? { title: n.title, description: n.summary, openGraph: n.cover ? { images: [n.cover] } : undefined } : { title: 'ไม่พบบทความ' };
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="mt-8 space-y-6">
      {blocks.map((b, i) => {
        if (b.type === 'heading') return <h2 key={i} className="pt-4 text-[26px] sm:text-[30px] font-bold leading-snug text-[var(--navy)]">{b.text}</h2>;
        if (b.type === 'text') return <p key={i} className="text-[17px] leading-[1.9] text-[#243B53] whitespace-pre-line">{b.text}</p>;
        if (b.type === 'image') return (
          <figure key={i}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.url} alt={b.caption || ''} loading="lazy" className="w-full rounded-[24px] shadow-[var(--shadow-soft)]" />
            {b.caption && <figcaption className="mt-2 text-center text-[13px] text-[var(--muted)]">{b.caption}</figcaption>}
          </figure>);
        const src = toEmbedUrl(b.url);
        return src ? <div key={i} className="aspect-video rounded-[24px] overflow-hidden shadow-[var(--shadow-soft)] bg-black"><iframe src={src} title="วิดีโอประกอบบทความ" className="w-full h-full" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div> : null;
      })}
    </div>
  );
}

export default async function NewsArticle({ params }: { params: Promise<{ id: string }> }) {
  const n = await getPublishedNewsItem((await params).id);
  if (!n) notFound();
  return (
    <article className="max-w-[780px] mx-auto px-5 pt-14">
      <Link href="/news" className="inline-flex items-center gap-1 text-[14px] font-semibold text-[var(--primary)]"><ArrowLeft size={15} /> ข่าวสารทั้งหมด</Link>
      <div className="mt-6 flex gap-3 text-[13px]"><span className="font-bold tracking-[.12em] uppercase text-[var(--emerald)]">{n.tag}</span><time className="text-[var(--muted)]">{fmtThaiDate(n.date)}</time></div>
      <h1 className="mt-2 text-[34px] sm:text-[48px] font-bold leading-[1.12] tracking-tight text-[var(--navy)]">{n.title}</h1>
      <p className="mt-4 text-[18px] leading-relaxed text-[var(--muted)]">{n.summary}</p>
      {n.cover && <div className="relative aspect-[16/9] mt-8 rounded-[32px] overflow-hidden shadow-[var(--shadow-lift)]"><Image src={n.cover} alt="" fill priority sizes="780px" className="object-cover" /></div>}
      {n.blocks.length > 0 ? <Blocks blocks={n.blocks} /> : n.body && n.body !== n.summary && <p className="mt-8 text-[17px] leading-[1.9] whitespace-pre-line">{n.body}</p>}
    </article>
  );
}
