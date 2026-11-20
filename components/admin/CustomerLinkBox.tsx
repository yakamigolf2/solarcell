'use client';
import { useState } from 'react';
import { Copy, Link2, RefreshCw, Send } from 'lucide-react';
import type { HandoverDoc } from '@/lib/handover-render';

type Handover = { name: string; signedAt: string; signature: string };
type JobForLink = { customer: string; address: string; phone: string; kw: number; panels: number; inverter: string; items?: { name: string; qty: number }[]; installDate?: string; techName?: string; publicToken?: string; handover?: Handover | null; quoteDocNo?: string };

/** Job detail panel: customer tracking link (copy / send via LINE / replace) and the signed handover with its PDF. */
export default function CustomerLinkBox({ id, job, canEdit, seller, onLink, onMessage }: {
  id: string; job: JobForLink; canEdit: boolean; seller: HandoverDoc['seller'];
  onLink: (revoke: boolean) => Promise<void>; onMessage: (m: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const url = job.publicToken && typeof window !== 'undefined' ? `${window.location.origin}/track/${job.publicToken}` : '';
  const run = async (fn: () => Promise<void>) => { setBusy(true); try { await fn(); } finally { setBusy(false); } };

  async function downloadHandover() {
    if (!job.handover) return;
    await run(async () => {
      try {
        const [{ renderHandoverPage }, { buildQuotePdf }] = await Promise.all([import('@/lib/handover-render'), import('@/lib/quote-pdf')]);
        const page = await renderHandoverPage({
          seller, docNo: `HO-${id.slice(-6).toUpperCase()}`,
          customer: { name: job.customer, address: job.address, phone: job.phone },
          system: { kw: job.kw, panels: job.panels, inverter: job.inverter },
          items: job.items || [], installDate: job.installDate || '', techName: job.techName || '',
          signer: job.handover!,
        });
        const { bytes } = await buildQuotePdf([page], []);
        const href = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
        const a = document.createElement('a'); a.href = href; a.download = `BGE-ใบส่งมอบงาน-${job.customer}.pdf`; a.click();
        setTimeout(() => URL.revokeObjectURL(href), 10_000);
      } catch (e) { onMessage('สร้าง PDF ไม่สำเร็จ: ' + (e instanceof Error ? e.message : String(e))); }
    });
  }

  return (
    <div className="sm:col-span-2 rounded-2xl border p-3 space-y-3 text-[13px]">
      <div className="font-bold flex items-center gap-1.5"><Link2 size={16} />ลิงก์ลูกค้า (ติดตามสถานะ / เซ็นรับมอบงาน)</div>
      {url ? <>
        <div className="flex gap-2"><input readOnly value={url} className="flex-1 min-w-0 px-3 py-2 rounded-xl border bg-gray-50 text-[12px]" onFocus={(e) => e.currentTarget.select()} /></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(url); onMessage('คัดลอกลิงก์แล้ว'); } catch { onMessage('คัดลอกไม่สำเร็จ'); } }} className="px-3 py-1.5 rounded-full border font-bold flex items-center gap-1"><Copy size={13} />คัดลอก</button>
          <a href={`https://line.me/R/share?text=${encodeURIComponent(`สวัสดีครับ คุณ${job.customer.replace(/^คุณ\s*/, '')} ติดตามสถานะงานติดตั้งโซลาร์เซลล์ของท่านได้ที่ลิงก์นี้ครับ\n${url}`)}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-full text-white font-bold flex items-center gap-1" style={{ background: '#06C755' }}><Send size={13} />ส่งทาง LINE</a>
          {canEdit && <button type="button" disabled={busy} onClick={() => { if (confirm('สร้างลิงก์ใหม่? ลิงก์เดิมที่ส่งให้ลูกค้าจะใช้ไม่ได้')) void run(() => onLink(true)); }} className="px-3 py-1.5 rounded-full border font-bold flex items-center gap-1 disabled:opacity-50"><RefreshCw size={13} />สร้างลิงก์ใหม่</button>}
        </div>
      </> : canEdit
        ? <button type="button" disabled={busy} onClick={() => void run(() => onLink(false))} className="px-3 py-2 rounded-full bg-[var(--primary)] text-white font-bold disabled:opacity-50">สร้างลิงก์ให้ลูกค้า</button>
        : <p className="text-[var(--muted)]">ยังไม่มีลิงก์</p>}
      <div className="border-t pt-2">
        {job.handover
          ? <div className="flex flex-wrap items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={job.handover.signature} alt={`ลายเซ็น ${job.handover.name}`} className="h-12 bg-white border rounded" />
              <span>เซ็นรับมอบแล้วโดย <b>{job.handover.name}</b> • {new Date(job.handover.signedAt).toLocaleString('th-TH')}</span>
              <button type="button" disabled={busy} onClick={downloadHandover} className="px-3 py-1.5 rounded-full bg-emerald-600 text-white font-bold disabled:opacity-50">ดาวน์โหลดใบส่งมอบงาน (PDF)</button>
            </div>
          : <span className="text-[var(--muted)]">ยังไม่ได้เซ็นรับมอบงาน ลูกค้าเซ็นได้จากลิงก์เมื่อสถานะถึง "ติดตั้งแล้วเสร็จ"</span>}
      </div>
    </div>
  );
}
