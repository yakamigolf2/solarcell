'use client';
import React, { useMemo, useState } from 'react';
import { type Receipt } from '@/lib/job';
import { FileText, Pencil, Trash2, Copy } from 'lucide-react';
import GroupsEditor, { type SpecGroup } from '@/components/admin/GroupsEditor';
import Combobox from '@/components/admin/Combobox';
import { SETS_COLLECTION, setsApi } from '@/components/admin/EquipmentSets';
import SetPicker, { type HistoryItem } from '@/components/admin/SetPicker';
import QuotationView from '@/components/admin/QuotationView';
import type { QuoteData } from '@/lib/quote-render';
import { safe, safeNum, Job, Rec, CompanySettings, CatalogItem, paymentAmounts, SPEC_SELLER, SPEC_QUOTE_NOTE1, SPEC_QUOTE_NOTE2, fmtBaht, fmt2, fmtQty, quoteRowNet, quoteSummary, resolveSeller, resolveQuoteDoc, resolveCustomer, resolveContactBack } from './model';

// ---------- Quote preview image: drawn with plain canvas, no external library ----------
export function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  try {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = '';
    words.forEach((word) => {
      if (ctx.measureText(word).width > maxWidth) {
        if (line) { lines.push(line); line = ''; }
        let part = '';
        Array.from(word).forEach((ch) => {
          if (ctx.measureText(part + ch).width > maxWidth && part) { lines.push(part); part = ch; } else part += ch;
        });
        if (part) line = part;
        return;
      }
      const next = line ? line + ' ' + word : word;
      if (ctx.measureText(next).width > maxWidth && line) { lines.push(line); line = word; } else line = next;
    });
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  } catch { return [String(text || '')]; }
}
export function renderQuotePng(job: Job, seller: any, doc: any, cust: any, back: any, pays: any[], qs: any): string {
  const canvas = document.createElement('canvas');
  canvas.width = 794; canvas.height = 1400;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('สร้างรูปไม่สำเร็จ');
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, 794, 1400);
  ctx.fillStyle = '#111111'; ctx.textBaseline = 'top';
  let y = 28;
  ctx.fillStyle = '#0B7DFF'; ctx.fillRect(36, y, 64, 36);
  ctx.fillStyle = '#FFFFFF'; ctx.font = '800 20px system-ui, sans-serif'; ctx.fillText('BGE', 48, y + 8);
  ctx.fillStyle = '#111111'; ctx.font = '800 13px system-ui, sans-serif'; ctx.fillText('BETTER GROUP', 110, y); ctx.fillText('ENGINEERING', 110, y + 17);
  ctx.fillStyle = '#0B7DFF'; ctx.font = '800 36px system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.fillText('ใบเสนอราคา', 758, y - 2); ctx.textAlign = 'left';
  y += 52;
  ctx.fillStyle = '#111111'; ctx.font = '12.5px system-ui, sans-serif';
  const sellerLines = ['ผู้ขาย :', 'ที่อยู่ :', SPEC_SELLER.name, 'เลขที่ 71/2 หมู่ที่ 3 ตำบลลาดหลุมแก้ว', 'อำเภอลาดหลุมแก้ว จังหวัดปทุมธานี', '12140', 'เลขที่ภาษี : ' + SPEC_SELLER.taxId + ' (สำนักงานใหญ่)', SPEC_SELLER.phone, SPEC_SELLER.email];
  sellerLines.forEach((line) => { ctx.fillText(line, 36, y); y += 19; });
  y += 5;
  ctx.fillStyle = '#F2F2F2'; ctx.fillRect(36, y, 722, 88);
  ctx.fillStyle = '#111111'; ctx.font = '12px system-ui, sans-serif';
  const docLines = ['เลขที่เอกสาร: ' + doc.docNo, 'วันที่ออก: ' + doc.issueDate, 'ใช้ได้ถึง: ' + doc.validUntil, 'อ้างอิง: ' + (doc.ref || '')];
  docLines.forEach((line, i) => { ctx.fillText(line, 52, y + 6 + i * 19); });
  y += 104;
  ctx.font = '700 12px system-ui, sans-serif'; ctx.fillText('ลูกค้า: ' + cust.name, 36, y); y += 18;
  ctx.font = '12px system-ui, sans-serif';
  wrapCanvasText(ctx, 'ที่อยู่: ' + (cust.address || ''), 722).forEach((line) => { ctx.fillText(line, 36, y); y += 17; });
  ctx.fillText('เลขภาษี: ' + cust.taxId + '  เรียน: ' + cust.attn + '  เบอร์ลูกค้า ' + cust.phone, 36, y); y += 18;
  ctx.fillText('ติดต่อกลับที่: ' + back.name + ' / ' + back.phone + ' / ' + back.email, 36, y); y += 26;
  ctx.fillStyle = '#EDEDED'; ctx.fillRect(36, y, 722, 28);
  ctx.fillStyle = '#111111'; ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillText('คำอธิบาย', 44, y + 6); ctx.textAlign = 'right'; ctx.fillText('จำนวน', 470, y + 6); ctx.fillText('ราคา', 566, y + 6); ctx.fillText('ส่วนลด', 652, y + 6); ctx.fillText('มูลค่าก่อนภาษี', 750, y + 6); ctx.textAlign = 'left';
  y += 36; ctx.font = '12px system-ui, sans-serif';
  (job.items || []).forEach((it: any, i: number) => {
    if (y > 980) return;
    const rowTop = y;
    ctx.font = '700 12px system-ui, sans-serif';
    wrapCanvasText(ctx, (i + 1) + '. ' + it.name, 400).forEach((line) => { ctx.fillText(line, 36, y); y += 17; });
    ctx.font = '12px system-ui, sans-serif';
    (it.details || []).slice(0, 4).forEach((d: string) => {
      wrapCanvasText(ctx, d, 400).forEach((line) => { if (y <= 1000) { ctx.fillText(line, 52, y); y += 16; } });
    });
    ctx.textAlign = 'right';
    ctx.fillText(fmtQty(it.qty), 470, rowTop); ctx.fillText(fmt2(it.price), 566, rowTop); ctx.fillText(fmt2(it.discount || 0), 652, rowTop); ctx.fillText(fmt2(quoteRowNet(it)), 750, rowTop);
    ctx.textAlign = 'left'; y += 8;
  });
  y += 6;
  wrapCanvasText(ctx, job.quoteNote1 || '', 722).forEach((line) => { ctx.fillText(line, 36, y); y += 17; });
  wrapCanvasText(ctx, job.quoteNote2 || '', 722).forEach((line) => { ctx.fillText(line, 36, y); y += 17; });
  y += 10; ctx.textAlign = 'right';
  ctx.fillText('มูลค่าก่อนภาษี  ' + fmt2(qs.net), 758, y); y += 20;
  ctx.fillText('VAT 7%  ' + fmt2(qs.vat), 758, y); y += 22;
  ctx.font = '800 15px system-ui, sans-serif'; ctx.fillText('ยอดรวมทั้งสิ้น  ' + fmt2(qs.total), 758, y); ctx.textAlign = 'left'; ctx.font = '12px system-ui, sans-serif';
  y += 34; ctx.font = '700 12px system-ui, sans-serif'; ctx.fillText('เงื่อนไขการชำระเงิน', 36, y); y += 20; ctx.font = '12px system-ui, sans-serif';
  pays.forEach((p: any) => { ctx.fillText(p.label + '  ' + p.pct + '%  •  ' + fmtBaht(p.amount) + '  •  ' + p.status, 36, y); y += 18; });
  y += 34; ctx.fillText('ผู้เสนอราคา', 140, y); ctx.fillText('ลูกค้าตกลงจ้าง', 540, y);
  ctx.strokeStyle = '#9CA3AF'; ctx.beginPath(); ctx.moveTo(60, y + 34); ctx.lineTo(300, y + 34); ctx.moveTo(460, y + 34); ctx.lineTo(700, y + 34); ctx.stroke();
  return canvas.toDataURL('image/png');
}
// ---------- Quote: plain HTML only. No canvas export library, no external fonts ----------
export const SOLD_STATUSES = ['ตกลงจ้าง', 'รอยื่นกู้ธนาคาร', 'รอผลกู้ธนาคาร', 'มัดจำแล้ว', 'รอนัดวันติดตั้ง', 'รอติดตั้ง', 'อยู่ระหว่างการติดตั้ง', 'ติดตั้งแล้วเสร็จ', 'กำลังตรวจรับงานติดตั้ง', 'ชำระเงินผู้รับเหมาแล้ว', 'ลูกค้าชำระเงินแล้ว', 'รอยื่นการไฟฟ้า', 'อยู่ระหว่างยื่นการไฟฟ้า', 'ยื่นการไฟฟ้าแล้วเสร็จ'];
/** Packages from other customers' quotations that can be reused as a starting point (items with equipment groups/details). */
export function buildHistory(records: Rec[], excludeId: string): HistoryItem[] {
  const out: HistoryItem[] = [];
  records.forEach(r => {
    if (r.id === excludeId) return;
    (r.value.items || []).forEach((it, i) => {
      if (!(it.groups && it.groups.length) && !(it.details && it.details.length)) return;
      out.push({ key: `${r.id}:${i}`, customer: String(r.value.customer || ''), status: r.value.status, sold: SOLD_STATUSES.includes(r.value.status), item: { name: it.name, qty: it.qty, price: it.price, discount: it.discount || 0, vatPct: it.vatPct, details: it.details || [], groups: it.groups || [] } });
    });
  });
  return out;
}

export function QuoteWorkspace({ job, company, quoteNo, onChange, canEdit, catalog, initialTab, history }: { job: Job; company: CompanySettings; quoteNo: string; onChange: (patch: Partial<Job>) => void; canEdit: boolean; catalog: CatalogItem[]; initialTab: 'edit' | 'pdf'; history: HistoryItem[] }) {
  const [tab, setTab] = useState<'edit' | 'pdf'>(initialTab);
  const total = quoteSummary(job).total;
  const tabs: { id: 'edit' | 'pdf'; label: string; icon: React.ReactNode }[] = [{ id: 'edit', label: 'แก้ไขข้อมูล', icon: <Pencil size={15} /> }, { id: 'pdf', label: 'ตัวอย่าง PDF', icon: <FileText size={15} /> }];
  return (
    <div>
      <div className="sticky top-0 z-10 -mx-1 px-1 py-2 bg-white/95 flex flex-wrap items-center gap-2 border-b mb-3">
        <div role="tablist" aria-label="มุมมองใบเสนอราคา" className="inline-flex p-1 rounded-full bg-gray-100">
          {tabs.map(t => <button key={t.id} role="tab" id={`qtab-${t.id}`} aria-selected={tab === t.id} aria-controls={`qpanel-${t.id}`} onClick={() => setTab(t.id)} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold transition-colors ${tab === t.id ? 'bg-[var(--primary)] text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}>{t.icon}{t.label}</button>)}
        </div>
        <div className="ml-auto text-[13px] text-gray-500">ยอดรวม <b className="text-[16px] text-gray-900">{fmtBaht(total)}</b> <span className="text-[11px]">รวม VAT</span></div>
      </div>
      {tab === 'edit'
        ? <div role="tabpanel" id="qpanel-edit" aria-labelledby="qtab-edit"><QuoteEditor job={job} onChange={onChange} onOpenQuote={() => setTab('pdf')} catalog={catalog} canEdit={canEdit} history={history} /></div>
        : <div role="tabpanel" id="qpanel-pdf" aria-labelledby="qtab-pdf"><QuotePaper job={job} company={company} quoteNo={quoteNo} onChange={onChange} canEdit={canEdit} />{canEdit && <button type="button" onClick={() => setTab('edit')} className="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full border font-bold text-[13px] bg-white hover:bg-gray-50"><Pencil size={15} /> กลับไปแก้ไขข้อมูล</button>}</div>}
    </div>
  );
}

export const SPEC_BANK = { bank: 'ธ.กสิกรไทย สาขา ซีคอน บางแค', type: 'ออมทรัพย์', no: '0583538348', name: 'เบทเทอร์ กรุ๊ป เอ็นจิเนียร์ริ่ง' };

export function QuotePaper({ job, company, quoteNo, onChange, canEdit }: { job: Job; company: CompanySettings; quoteNo: string; onChange: (patch: Partial<Job>) => void; canEdit: boolean }) {
  const [msg, setMsg] = useState<string | null>(null);
  const qs = quoteSummary(job);
  const seller = resolveSeller(company);
  const doc = resolveQuoteDoc(job, quoteNo);
  const cust = resolveCustomer(job);
  const back = resolveContactBack(job);
  const pays = paymentAmounts(job);
  const data: QuoteData = useMemo(() => ({
    seller: { name: seller.name, address: seller.address, taxId: seller.taxId, phone: seller.phone, email: seller.email },
    doc: { docNo: doc.docNo, issueDate: doc.issueDate, acceptDate: doc.acceptDate, validUntil: doc.validUntil, ref: doc.ref },
    cust, back,
    rows: [
      ...(job.items || []).map(it => ({ name: it.name, qty: safeNum(it.qty), price: safeNum(it.price), discount: safeNum(it.discount), vatPct: it.vatPct ?? 7, net: quoteRowNet(it), details: (it.details || []).filter(d => String(d).trim()), groups: (it.groups || []).map(g => ({ title: g.title, lines: g.lines.filter(l => l.trim()), warranty: g.warranty || '' })).filter(g => g.title.trim() || g.lines.length || g.warranty) })),
      ...(job.labor > 0 ? [{ name: 'ค่าแรงติดตั้ง', qty: 1, price: safeNum(job.labor), discount: 0, vatPct: 7, net: safeNum(job.labor), details: [] as string[], groups: [] as SpecGroup[] }] : []),
    ],
    notes: [job.quoteNote1 ?? SPEC_QUOTE_NOTE1, job.quoteNote2 ?? SPEC_QUOTE_NOTE2],
    remark: job.quoteRemark || '',
    summary: { net: qs.net, vat: qs.vat, total: qs.total },
    payments: pays.map(p => ({ label: String(p.label).split('•')[0].trim() + (String(p.label).includes('•') ? ' ' + String(p.label).split('•')[1].trim() : ''), pct: p.pct })),
    bank: SPEC_BANK,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [JSON.stringify([job.items, job.labor, job.discount, job.quoteNote1, job.quoteNote2, job.quoteRemark, job.payments, doc, cust, back, seller])]);
  const quoteText = safe(() => {
    const lines: string[] = [`ใบเสนอราคา เลขที่ ${doc.docNo} วันที่ออก ${doc.issueDate} ใช้ได้ถึง ${doc.validUntil}`, `ลูกค้า ${cust.name} ที่อยู่ ${cust.address} เบอร์ ${cust.phone}`];
    (job.items || []).forEach((it, i) => { lines.push(`${i + 1}. ${it.name} จำนวน ${fmtQty(it.qty)} ราคา ${fmt2(it.price)} ส่วนลด ${fmt2(it.discount || 0)} มูลค่าก่อนภาษี ${fmt2(quoteRowNet(it))}`); (it.details || []).forEach((d, di) => lines.push(`  ${di + 1}. ${d}`)); });
    lines.push(`มูลค่าก่อนภาษี ${fmt2(qs.net)} VAT 7% ${fmt2(qs.vat)} ยอดรวมทั้งสิ้น ${fmt2(qs.total)}`);
    return lines.join('\n');
  }, 'BGE ใบเสนอราคา');
  async function handleCopyQuote() {
    try { await navigator.clipboard.writeText(quoteText); setMsg('คัดลอกข้อความใบเสนอราคาแล้ว — วางใน LINE / แชทได้เลย'); } catch { setMsg('คัดลอกไม่สำเร็จ'); }
  }
  const safeName = String(cust.name || 'ลูกค้า').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'ลูกค้า';
  const safeNo = String(doc.docNo || '').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'QO';
  return (
    <>
      {msg && <div role="status" className="mb-2 px-4 py-3 rounded-2xl text-[13px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800">{msg}</div>}
      <QuotationView data={data} attachments={job.attachments || []} onChange={onChange} canEdit={canEdit} fileName={`BGE-ใบเสนอราคา-${safeName}-${safeNo}`}
        extraActions={<button type="button" onClick={handleCopyQuote} className="bg-white border-2 border-[#0B7DFF] text-[#0B7DFF] px-4 py-2.5 rounded-full text-[13px] font-bold flex items-center gap-1.5"><Copy size={15} />คัดลอกข้อความ</button>} />
    </>
  );
}

// ---------- Equipment picker: plain <select> + simple text filter input ----------
export function QuoteEditor({ job, onChange, onOpenQuote, catalog, canEdit, history }: { job: Job; onChange: (p: Partial<Job>) => void; onOpenQuote: () => void; catalog: CatalogItem[]; canEdit: boolean; history: HistoryItem[] }) {
  const [filter, setFilter] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [qty, setQty] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [addedMsg, setAddedMsg] = useState<string | null>(null);
  const filteredCatalog = safe(() => { const q = filter.toLowerCase().trim(); if (!q) return catalog; return catalog.filter(c => `${c.name} ${c.code} ${c.category}`.toLowerCase().includes(q)); }, catalog);
  function handleSelect(name: string) {
    try {
      setSelectedName(name); setAddedMsg(null);
      const found = catalog.find(c => c.name === name);
      if (found) setUnitPrice(found.price);
    } catch { /* ignore */ }
  }
  function handleAdd() {
    try {
      if (!canEdit) return;
      const name = selectedName.trim();
      if (!name) { setAddedMsg('เลือกอุปกรณ์จากช่องเลือกก่อน'); return; }
      const qtySafe = Math.max(1, Number(qty) || 1);
      onChange({ items: [...(job.items || []), { name, qty: qtySafe, price: Number(unitPrice) || 0 }] });
      setAddedMsg(`เพิ่ม “${name}” × ${qtySafe} ลงใบเสนอราคาแล้ว`);
      setSelectedName(''); setUnitPrice(0); setQty(1);
    } catch { setAddedMsg('เพิ่มอุปกรณ์ไม่สำเร็จ'); }
  }
  const inputE = "w-full px-3 py-2.5 border rounded-xl mt-1 text-[14px] bg-white disabled:bg-gray-100";
  const labelE = "text-[12px] font-semibold text-gray-500";
  const docE = resolveQuoteDoc(job, '');
  return <div>
    <div className="border rounded-2xl p-3 mb-3 bg-white"><div className="font-bold text-[14px] mb-2">หัวเอกสารใบเสนอราคา</div><div className="grid sm:grid-cols-2 gap-3"><div><label className={labelE}>เลขที่เอกสาร</label><input disabled={!canEdit} value={docE.docNo} onChange={e => onChange({ quoteDocNo: e.target.value })} className={inputE} /></div><div><label className={labelE}>วันที่ออก</label><input disabled={!canEdit} value={docE.issueDate} onChange={e => onChange({ quoteIssueDate: e.target.value })} className={inputE} placeholder="17/08/2026" /></div><div><label className={labelE}>วันที่ครบรับ</label><input disabled={!canEdit} value={docE.acceptDate} onChange={e => onChange({ quoteAcceptDate: e.target.value })} className={inputE} /></div><div><label className={labelE}>ใช้ได้ถึง</label><input disabled={!canEdit} value={docE.validUntil} onChange={e => onChange({ quoteValidUntil: e.target.value })} className={inputE} /></div><div className="sm:col-span-2"><label className={labelE}>อ้างอิง</label><input disabled={!canEdit} value={docE.ref} onChange={e => onChange({ quoteRef: e.target.value })} className={inputE} /></div></div></div>
    <SetPicker canEdit={canEdit} history={history} onAdd={(lines, name) => { onChange({ items: [...(job.items || []), ...lines] }); setAddedMsg(`เพิ่ม “${name}” (${lines.length} รายการ) ลงใบเสนอราคาแล้ว`); }} />
    <div className="border rounded-2xl p-3 mb-3 bg-blue-50"><div className="font-bold text-[14px] mb-2">เพิ่มอุปกรณ์ลงใบเสนอราคา</div>
      <div><label className={labelE} htmlFor="equip-combo">เลือก / ค้นหาอุปกรณ์</label>
        <Combobox allowCustom ariaLabel="เลือกหรือค้นหาอุปกรณ์" className="mt-1" value={selectedName} onChange={handleSelect} options={catalog.map(c => ({ value: c.name, label: c.name, hint: fmtBaht(c.price), search: `${c.code} ${c.category} ${c.keywords || ''}` }))} placeholder="พิมพ์เพื่อค้นหา หรือพิมพ์ชื่อรายการเองได้เลย (ไม่ต้องมีในรายการ)" /></div>
      <div className="grid grid-cols-2 gap-3 mt-2"><div><label className={labelE}>จำนวน</label><input type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value))} className={inputE} /></div><div><label className={labelE}>ราคาต่อหน่วย</label><input type="number" value={unitPrice} onChange={e => setUnitPrice(Number(e.target.value))} className={inputE} /></div></div>
      {addedMsg && <p className="text-[13px] text-emerald-700 mt-2">{addedMsg}</p>}
      <button type="button" disabled={!canEdit} onClick={handleAdd} className="mt-3 w-full sm:w-auto bg-[var(--primary)] text-white px-5 py-2.5 rounded-full font-bold text-[13px] disabled:opacity-50">+ เพิ่มลงใบเสนอราคา</button>
    </div>
    <div className="space-y-2">{(job.items || []).map((it, i) => <div key={i} className="flex flex-wrap gap-2 items-center bg-gray-50 rounded-2xl p-3"><div className="flex-1 min-w-[180px]"><input disabled={!canEdit} value={it.name} onChange={e => { const n = [...job.items]; n[i] = { ...n[i], name: e.target.value }; onChange({ items: n }); }} className="w-full px-2 py-1.5 border rounded-lg text-[13px] bg-white disabled:bg-gray-100" />{(it.details || []).length > 0 && <p className="text-[11px] text-gray-500 mt-1">มีรายละเอียด {(it.details || []).length} ข้อ</p>}</div><input type="number" disabled={!canEdit} value={it.qty} onChange={e => { const n = [...job.items]; n[i] = { ...n[i], qty: Number(e.target.value) }; onChange({ items: n }); }} className="w-[70px] px-2 py-1.5 border rounded-lg text-[13px] bg-white disabled:bg-gray-100" /><input type="number" disabled={!canEdit} value={it.price} onChange={e => { const n = [...job.items]; n[i] = { ...n[i], price: Number(e.target.value) }; onChange({ items: n }); }} className="w-[120px] px-2 py-1.5 border rounded-lg text-[13px] bg-white disabled:bg-gray-100" /><input type="number" disabled={!canEdit} value={it.discount || 0} onChange={e => { const n = [...job.items]; n[i] = { ...n[i], discount: Number(e.target.value) }; onChange({ items: n }); }} className="w-[110px] px-2 py-1.5 border rounded-lg text-[13px] bg-white disabled:bg-gray-100" placeholder="ส่วนลด" />{canEdit && <button type="button" onClick={() => { try { onChange({ items: job.items.filter((_, x) => x !== i) }); } catch { /* ignore */ } }} className="p-2 rounded-full bg-red-50 text-red-600" aria-label="ลบรายการ"><Trash2 size={15} /></button>}<details className="basis-full w-full" open={(it.groups || []).length > 0}><summary className="cursor-pointer text-[12px] font-semibold text-[var(--primary)] select-none">รายละเอียดอุปกรณ์ในชุด (Package Includes){(it.groups || []).length > 0 ? ` — ${(it.groups || []).length} รายการ` : ''}</summary><div className="mt-2"><GroupsEditor disabled={!canEdit} groups={it.groups || []} onChange={g => { const n = [...job.items]; n[i] = { ...n[i], groups: g }; onChange({ items: n }); }} />{canEdit && <button type="button" onClick={async () => { try { await setsApi('records.create', { collection: SETS_COLLECTION, value: { name: it.name, note: 'บันทึกจากใบเสนอราคา', items: [{ name: it.name, qty: it.qty, price: it.price, discount: it.discount || 0, details: it.details || [], groups: it.groups || [] }] }, idempotency_key: `set-q-${Date.now()}` }); setAddedMsg(`บันทึก “${it.name}” เป็นเซ็ตต้นแบบแล้ว — ใช้ซ้ำได้ในกล่อง “เพิ่มเป็นเซ็ตอุปกรณ์”`); } catch (e) { setAddedMsg('บันทึกเซ็ตไม่สำเร็จ: ' + (e instanceof Error ? e.message : String(e))); } }} className="mt-2 px-3 py-2 rounded-xl border bg-white text-[12.5px] font-semibold hover:bg-gray-50">บันทึกรายการนี้เป็นเซ็ตต้นแบบ</button>}</div></details></div>)}
    </div>
    <div className="mt-3"><label className={labelE} htmlFor="q-remark">หมายเหตุท้ายใบเสนอราคา (เขียนอิสระ)</label><textarea id="q-remark" disabled={!canEdit} rows={3} value={job.quoteRemark || ''} onChange={e => onChange({ quoteRemark: e.target.value })} className={inputE} placeholder="เช่น เงื่อนไขการรับประกัน การเปลี่ยนอุปกรณ์ หรือข้อตกลงอื่น ๆ" /></div>
    <div className="grid sm:grid-cols-2 gap-3 mt-3"><div><label className={labelE}>ค่าแรงติดตั้ง</label><input type="number" disabled={!canEdit} value={job.labor} onChange={e => onChange({ labor: Number(e.target.value) })} className={inputE} /></div><div><label className={labelE}>ส่วนลดรวม</label><input type="number" disabled={!canEdit} value={job.discount} onChange={e => onChange({ discount: Number(e.target.value) })} className={inputE} /></div></div>
    <button type="button" onClick={onOpenQuote} className="w-full mt-4 bg-[var(--dark)] text-white py-3 rounded-full font-bold text-[13px]">ดูตัวอย่าง PDF</button>
  </div>;
}

// ---------- Receipt / tax invoice for one confirmed installment (same A4 renderer as the quotation) ----------
export function ReceiptButton({ job, index, company, quoteRef, canIssue, onIssue, onMessage }: { job: Job; index: number; company: CompanySettings; quoteRef: string; canIssue: boolean; onIssue: () => Promise<Receipt | null>; onMessage: (m: string) => void }) {
  const [busy, setBusy] = useState(false);
  const p = job.payments?.[index];
  if (!p || (p.status !== 'ยืนยันแล้ว' && !p.receipt)) return null;
  if (!p.receipt && !canIssue) return null;

  async function download(rc: Receipt) {
    const [{ renderQuotePages, fmt2 }, { buildQuotePdf }] = await Promise.all([import('@/lib/quote-render'), import('@/lib/quote-pdf')]);
    const seller = resolveSeller(company);
    const data: QuoteData = {
      seller: { name: seller.name, address: seller.address, taxId: seller.taxId, phone: seller.phone, email: seller.email },
      doc: { docNo: rc.no, issueDate: rc.date, acceptDate: '', validUntil: '', ref: quoteRef },
      cust: resolveCustomer(job), back: resolveContactBack(job),
      rows: [{ name: `ค่างวด ${p!.label} (${p!.pct}% ของมูลค่างานตามใบเสนอราคา ${quoteRef})`, qty: 1, price: rc.net, discount: 0, vatPct: 7, net: rc.net, details: [job.kw ? `งานติดตั้งระบบโซลาร์เซลล์ ${job.kw} kW` : 'งานติดตั้งระบบโซลาร์เซลล์'], groups: [] }],
      notes: [], payments: [], bank: SPEC_BANK,
      summary: { net: rc.net, vat: rc.vat, total: rc.amount },
      title: 'ใบเสร็จรับเงิน / ใบกำกับภาษี',
      meta: [['เลขที่ :', rc.no], ['วันที่ :', rc.date], ['อ้างอิง :', quoteRef], ['งวด :', p!.label.split('•')[0].trim()], ['ผู้รับเงิน :', rc.by]],
      paidLines: [`ได้รับชำระเงินแล้ว ${fmt2(rc.amount)} บาท`, `โอนเข้าบัญชี ${SPEC_BANK.bank} ${SPEC_BANK.no}`, SPEC_BANK.name],
      signatures: ['ผู้รับเงิน', 'ผู้มีอำนาจลงนาม', 'ตราประทับ (ผู้ขาย)', 'ผู้ชำระเงิน (ลูกค้า)'],
    };
    const { bytes } = await buildQuotePdf(await renderQuotePages(data), []);
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
    const a = document.createElement('a'); a.href = url; a.download = `BGE-ใบเสร็จ-${rc.no}.pdf`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  async function click() {
    setBusy(true);
    try {
      const rc = p!.receipt || await onIssue();
      if (rc) { await download(rc); onMessage(`ดาวน์โหลดใบเสร็จ ${rc.no} แล้ว`); }
    } catch (e) { onMessage('สร้าง PDF ไม่สำเร็จ: ' + (e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  }

  return (
    <button type="button" onClick={click} disabled={busy} title={p.receipt ? `ใบเสร็จ ${p.receipt.no} ออกเมื่อ ${p.receipt.date} โดย ${p.receipt.by}` : 'ออกเลขที่ใบเสร็จและดาวน์โหลด PDF'} className={`px-3 py-1.5 rounded-full text-[12px] font-bold flex items-center gap-1 disabled:opacity-50 ${p.receipt ? 'bg-white border border-emerald-600 text-emerald-700' : 'bg-emerald-600 text-white'}`}>
      <FileText size={13} />{busy ? 'กำลังสร้าง…' : p.receipt ? p.receipt.no : 'ออกใบเสร็จ / ใบกำกับภาษี'}
    </button>
  );
}
