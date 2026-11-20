'use client';
import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { isShortMapLink, mapEmbedSrc, mapQuery } from '@/lib/maps';

/** Shows the customer location from a Google Maps link (full or maps.app.goo.gl short link). */
export default function MapPreview({ url, className = '' }: { url?: string; className?: string }) {
  const link = (url || '').trim();
  const [resolved, setResolved] = useState<{ from: string; to: string | null }>({ from: '', to: null });
  const short = isShortMapLink(link);

  useEffect(() => {
    if (!short) return;
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/maps/resolve?url=${encodeURIComponent(link)}`);
        const json = await res.json();
        if (alive) setResolved({ from: link, to: res.ok ? json.data.url : null });
      } catch { if (alive) setResolved({ from: link, to: null }); }
    }, 400);
    return () => { alive = false; clearTimeout(t); };
  }, [link, short]);

  if (!link) return null;
  const full = short ? (resolved.from === link ? resolved.to : undefined) : link;
  const q = full ? mapQuery(full) : null;

  let body: React.ReactNode;
  if (full === undefined) body = <div className="h-full grid place-items-center text-[13px] text-gray-500">กำลังโหลดแผนที่…</div>;
  else if (!q) body = <div className="h-full grid place-items-center text-[13px] text-red-500 px-4 text-center">อ่านตำแหน่งจากลิงก์นี้ไม่ได้ กรุณาใช้ลิงก์ที่คัดลอกจาก Google Maps (ปุ่ม แชร์)</div>;
  else body = <iframe title="แผนที่ตำแหน่งลูกค้า" src={mapEmbedSrc(q)} className="w-full h-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />;

  return (
    <div className={className}>
      <div className="h-[240px] rounded-2xl overflow-hidden border bg-gray-50">{body}</div>
      <a href={link} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--primary)]"><MapPin size={14} /> เปิดใน Google Maps</a>
    </div>
  );
}
