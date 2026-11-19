import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { fmtThaiDate, getPublishedNewsItem } from '@/lib/news';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const n = await getPublishedNewsItem((await params).id);
  return n ? { title: n.title, description: n.summary } : { title: 'ไม่พบบทความ' };
}

export default async function NewsArticle({ params }: { params: Promise<{ id: string }> }) {
  const n = await getPublishedNewsItem((await params).id);
  if (!n) notFound();
  return (
    <article className="max-w-[760px] mx-auto px-5 pt-14">
      <Link href="/news" className="inline-flex items-center gap-1 text-[14px] font-semibold text-[var(--primary)]"><ArrowLeft size={15} /> ข่าวสารทั้งหมด</Link>
      <div className="mt-5 flex gap-3 text-[13px]"><span className="font-semibold text-[var(--emerald)]">{n.tag}</span><time className="text-[var(--muted)]">{fmtThaiDate(n.date)}</time></div>
      <h1 className="mt-2 text-[30px] sm:text-[38px] font-bold leading-tight text-[var(--navy)]">{n.title}</h1>
      {n.cover && <div className="relative aspect-[16/9] mt-6 rounded-[28px] overflow-hidden"><Image src={n.cover} alt="" fill priority sizes="760px" className="object-cover" /></div>}
      <div className="glass rounded-[28px] p-6 sm:p-8 mt-6 text-[16px] leading-[1.85] text-[var(--navy)] whitespace-pre-line">{n.body || n.summary}</div>
    </article>
  );
}
