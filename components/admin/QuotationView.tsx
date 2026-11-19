'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Download, FilePlus2, FileText, Loader2, Paperclip, Trash2, Upload, X } from 'lucide-react';
import { renderQuotePages, type QuoteData } from '@/lib/quote-render';
import { buildQuotePdf, type Attachment } from '@/lib/quote-pdf';
import { uploadPdf } from '@/lib/upload';

type LibRec = { id: string; value: { name: string; url: string; size: number } };
const LIB = 'bge_attachments';

async function api(action: string, args: Record<string, unknown>) {
  const res = await fetch('/api/actions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, args }) });
  const json = await res.json().catch(() => ({} as any));
  if (!res.ok || json.error) throw new Error(json.error || `API error ${res.status}`);
  return json.data;
}
const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));
const kb = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default function QuotationView({ data, attachments, onChange, canEdit, fileName, extraActions }: {
  data: QuoteData; attachments: Attachment[]; onChange: (patch: { attachments: Attachment[] }) => void; canEdit: boolean; fileName: string; extraActions?: React.ReactNode;
}) {
  const [previews, setPreviews] = useState<string[] | null>(null);
  const [renderErr, setRenderErr] = useState(false);
  const [lib, setLib] = useState<LibRec[]>([]);
  const [pick, setPick] = useState('');
  const [busy, setBusy] = useState<'pdf' | 'upload' | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const key = useMemo(() => JSON.stringify(data), [data]);
  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      try { const pages = await renderQuotePages(JSON.parse(key)); if (alive) { setPreviews(pages.map(c => c.toDataURL('image/jpeg', 0.86))); setRenderErr(false); } }
      catch { if (alive) { setRenderErr(true); setPreviews([]); } }
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [key]);

  const loadLib = useCallback(async () => {
    try { const d = await api('records.list', { collection: LIB }); setLib((d.records as LibRec[]).slice().reverse()); } catch { /* library is optional */ }
  }, []);
  useEffect(() => { void loadLib(); }, [loadLib]);

  const set = (list: Attachment[]) => onChange({ attachments: list });
  const move = (i: number, d: -1 | 1) => { const a = attachments.slice(); const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; set(a); };
  const available = lib.filter(l => !attachments.some(a => a.url === l.value.url));

  async function onUpload(f: File | undefined) {
    if (!f) return;
    setBusy('upload'); setMsg(null);
    try {
      const url = await uploadPdf(f);
      const value = { name: f.name, url, size: f.size };
      const rec = await api('records.create', { collection: LIB, value, idempotency_key: `att-${Date.now()}` });
      set([...attachments, { id: rec.id, ...value }]);
      await loadLib(); setMsg({ ok: true, text: `เพิ่ม ${f.name} ต่อท้ายใบเสนอราคาแล้ว` });
    } catch (e) { setMsg({ ok: false, text: 'อัปโหลดไม่สำเร็จ: ' + errText(e) }); }
    setBusy(null);
  }
  async function removeFromLibrary(l: LibRec) {
    try { await api('records.delete', { collection: LIB, id: l.id }); await loadLib(); } catch (e) { setMsg({ ok: false, text: 'ลบไม่สำเร็จ: ' + errText(e) }); }
  }

  async function download() {
    setBusy('pdf'); setMsg(null);
    try {
      const pages = await renderQuotePages(data);
      const { bytes, skipped } = await buildQuotePdf(pages, attachments);
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = `${fileName}.pdf`; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setMsg(skipped.length ? { ok: false, text: `ดาวน์โหลดแล้ว แต่ต่อไฟล์เหล่านี้ไม่ได้: ${skipped.join(', ')}` } : { ok: true, text: `ดาวน์โหลด PDF แล้ว (ใบเสนอราคา${attachments.length ? ` + เอกสารแนบ ${attachments.length} ไฟล์` : ''})` });
    } catch (e) { setMsg({ ok: false, text: 'สร้าง PDF ไม่สำเร็จ: ' + errText(e) }); }
    setBusy(null);
  }

  return (
    <div className="bg-[#E9EDF2] p-3 sm:p-4 rounded-[24px]">
      <div className="max-w-[800px] mx-auto mb-3 flex flex-wrap gap-2 items-center">
        <button type="button" onClick={download} disabled={busy !== null || !previews || renderErr} className="btn-primary flex items-center gap-2 px-5 py-3 rounded-full text-[14px] font-bold disabled:opacity-60">
          {busy === 'pdf' ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}ดาวน์โหลด PDF{attachments.length > 0 && ` (+${attachments.length} ไฟล์แนบ)`}
        </button>
        {extraActions}
      </div>
      {msg && <div role="status" className={`max-w-[800px] mx-auto mb-3 px-4 py-3 rounded-2xl text-[13px] font-semibold border ${msg.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>{msg.text}</div>}

      <section className="max-w-[800px] mx-auto mb-4 bg-white rounded-2xl border p-4" aria-label="เอกสารแนบต่อท้าย">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-bold text-[14px] flex items-center gap-1.5"><Paperclip size={16} className="text-[var(--primary)]" /> เอกสารแนบต่อท้ายใบเสนอราคา (PDF)</h4>
          {canEdit && <label className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[13px] font-semibold bg-white ${busy ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:bg-gray-50'}`}>{busy === 'upload' ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}อัปโหลดไฟล์ PDF<input type="file" accept="application/pdf,.pdf" className="hidden" onChange={e => { void onUpload(e.target.files?.[0]); e.target.value = ''; }} /></label>}
        </div>
        <p className="text-[12px] text-[var(--muted)] mt-1">ไฟล์ที่เลือกจะถูกต่อท้ายตามลำดับด้านล่างเมื่อดาวน์โหลด PDF (เช่น BOQ, แบบ, สเปกอุปกรณ์)</p>
        {attachments.length === 0 ? <div className="mt-3 text-[13px] text-[var(--muted)] bg-gray-50 rounded-xl p-3 text-center">ยังไม่ได้เลือกไฟล์แนบ</div> :
          <ol className="mt-3 space-y-2">{attachments.map((a, i) => (
            <li key={a.url} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[12px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <FileText size={16} className="text-rose-500 shrink-0" />
              <a href={a.url} target="_blank" rel="noreferrer" className="flex-1 min-w-0 truncate text-[13px] font-medium hover:underline">{a.name}</a>
              <span className="text-[11px] text-[var(--muted)] shrink-0">{kb(a.size)}</span>
              {canEdit && <>
                <button type="button" aria-label="เลื่อนขึ้น" disabled={i === 0} onClick={() => move(i, -1)} className="p-1.5 rounded-full hover:bg-white disabled:opacity-30"><ArrowUp size={15} /></button>
                <button type="button" aria-label="เลื่อนลง" disabled={i === attachments.length - 1} onClick={() => move(i, 1)} className="p-1.5 rounded-full hover:bg-white disabled:opacity-30"><ArrowDown size={15} /></button>
                <button type="button" aria-label="เอาออกจากใบเสนอราคา" onClick={() => set(attachments.filter((_, k) => k !== i))} className="p-1.5 rounded-full hover:bg-white text-rose-600"><X size={15} /></button>
              </>}
            </li>))}</ol>}
        {canEdit && lib.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select value={pick} onChange={e => setPick(e.target.value)} aria-label="เลือกจากคลังไฟล์" className="flex-1 min-w-[200px] px-3 py-2 rounded-xl border text-[13px] bg-white">
              <option value="">{available.length ? 'เลือกไฟล์จากคลังที่เคยอัปโหลด…' : 'ไม่มีไฟล์เหลือในคลัง'}</option>
              {available.map(l => <option key={l.id} value={l.id}>{l.value.name} ({kb(l.value.size)})</option>)}
            </select>
            <button type="button" disabled={!pick} onClick={() => { const l = lib.find(x => x.id === pick); if (l) set([...attachments, { id: l.id, ...l.value }]); setPick(''); }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--primary)] text-white text-[13px] font-semibold disabled:opacity-40"><FilePlus2 size={15} /> เพิ่มต่อท้าย</button>
            {pick && <button type="button" onClick={() => { const l = lib.find(x => x.id === pick); if (l && window.confirm(`ลบ "${l.value.name}" ออกจากคลังไฟล์? (ใบเสนอราคาที่ใช้ไฟล์นี้อยู่จะยังคงแนบไว้)`)) { void removeFromLibrary(l); setPick(''); } }} className="p-2 rounded-xl border text-rose-600" aria-label="ลบออกจากคลัง"><Trash2 size={15} /></button>}
          </div>)}
      </section>

      <div className="max-w-[800px] mx-auto space-y-4" aria-label="ตัวอย่างใบเสนอราคา">
        {previews === null ? <div className="skeleton h-[560px] w-full" aria-busy="true" /> :
          renderErr ? <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[13px] px-4 py-3 rounded-xl">แสดงตัวอย่างไม่สำเร็จ</div> :
          previews.map((src, i) => <img key={i} src={src} alt={`ใบเสนอราคา หน้า ${i + 1}`} className="w-full bg-white shadow-[0_18px_45px_rgba(15,35,60,0.18)]" />)}
        {attachments.length > 0 && <div className="text-center text-[12px] text-[var(--muted)]">+ เอกสารแนบ {attachments.length} ไฟล์ จะถูกต่อท้ายในไฟล์ PDF</div>}
      </div>
    </div>
  );
}
