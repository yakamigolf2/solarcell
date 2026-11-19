// Client-side renderer for the quotation: draws A4 pages on <canvas> (the browser shapes Thai text correctly),
// laid out after the reference PDF "ใบเสนอราคาโซลาร์เซลล์_ QO-26080007". Units below are PDF points (A4 = 595 x 842).

export type QuoteRow = { name: string; qty: number; price: number; discount: number; vatPct: number; net: number; details: string[] };
export type QuoteData = {
  seller: { name: string; address: string; taxId: string; phone: string; email: string };
  doc: { docNo: string; issueDate: string; acceptDate: string; validUntil: string; ref: string };
  cust: { name: string; address: string; phone: string; taxId: string; attn: string };
  back: { name: string; phone: string; email: string };
  rows: QuoteRow[];
  notes: string[];
  summary: { net: number; vat: number; total: number };
  payments: { label: string; pct: number }[];
  bank: { bank: string; type: string; no: string; name: string };
};

const W = 595, H = 842, M = 32, SCALE = 2;
const ACCENT = '#6B6FE8', BAND = '#E7E8FA', INK = '#1F2430', MUTED = '#6B7280', LINE = '#D5D8DE';

export const fmt2 = (n: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number.isFinite(n) ? n : 0);

export function bahtText(amount: number): string {
  const digits = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const places = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'];
  const readInt = (s: string): string => {
    if (s.length > 6) return readInt(s.slice(0, s.length - 6)) + 'ล้าน' + readInt(s.slice(-6));
    let out = '';
    const n = s.length;
    for (let i = 0; i < n; i++) {
      const d = Number(s[i]); const p = n - i - 1;
      if (d === 0) continue;
      if (p === 0 && d === 1 && n > 1) out += 'เอ็ด';
      else if (p === 1 && d === 2) out += 'ยี่สิบ';
      else if (p === 1 && d === 1) out += 'สิบ';
      else out += digits[d] + places[p];
    }
    return out;
  };
  const rounded = Math.round(Math.abs(amount) * 100);
  const baht = String(Math.floor(rounded / 100)); const satang = rounded % 100;
  if (rounded === 0) return 'ศูนย์บาทถ้วน';
  let t = Number(baht) > 0 ? readInt(baht.replace(/^0+/, '')) + 'บาท' : '';
  t += satang ? readInt(String(satang)) + 'สตางค์' : 'ถ้วน';
  return t;
}

const NO_BREAK_BEFORE = /[ัิ-ฺ็-๎]/;
const NO_BREAK_AFTER = /[เแโใไ]/;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of String(text ?? '').split('\n')) {
    let line = '';
    let lastSpace = -1;
    for (const ch of Array.from(para)) {
      const test = line + ch;
      if (ctx.measureText(test).width <= maxW || line === '') { line = test; if (ch === ' ') lastSpace = line.length; continue; }
      if (NO_BREAK_BEFORE.test(ch) || NO_BREAK_AFTER.test(line.slice(-1))) { line = test; continue; }
      if (ch !== ' ' && lastSpace > 0) { out.push(line.slice(0, lastSpace).trimEnd()); line = line.slice(lastSpace) + ch; }
      else { out.push(line.trimEnd()); line = ch === ' ' ? '' : ch; }
      lastSpace = -1;
    }
    out.push(line.trimEnd());
  }
  return out;
}

async function loadLogo(): Promise<HTMLImageElement | null> {
  try {
    const img = new Image(); img.src = '/BGE_logo.png';
    await img.decode();
    return img;
  } catch { return null; }
}

export async function renderQuotePages(d: QuoteData): Promise<HTMLCanvasElement[]> {
  const fam = (typeof document !== 'undefined' && getComputedStyle(document.body).fontFamily) || 'sans-serif';
  try { await Promise.all(['400', '500', '600', '700'].map(w => document.fonts.load(`${w} 14px ${fam}`, 'กขค'))); await document.fonts.ready; } catch { /* fall back to whatever is loaded */ }
  const logo = await loadLogo();
  const pages: HTMLCanvasElement[] = [];
  let ctx!: CanvasRenderingContext2D;
  let y = 0;
  const font = (size: number, weight: 400 | 500 | 600 | 700 = 400) => { ctx.font = `${weight} ${size}px ${fam}`; };
  const text = (s: string, x: number, yy: number, o: { size?: number; weight?: 400 | 500 | 600 | 700; color?: string; align?: CanvasTextAlign } = {}) => {
    font(o.size ?? 10, o.weight ?? 400); ctx.fillStyle = o.color ?? INK; ctx.textAlign = o.align ?? 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, yy);
  };
  const hline = (yy: number, x1 = M, x2 = W - M, color = LINE) => { ctx.strokeStyle = color; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x1, yy); ctx.lineTo(x2, yy); ctx.stroke(); };
  const rrect = (x: number, yy: number, w: number, h: number, r: number, fill: string) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, yy, w, h, r); ctx.fill(); };
  const lines = (s: string, x: number, yy: number, maxW: number, o: { size?: number; weight?: 400 | 500 | 600 | 700; color?: string; lh?: number } = {}) => {
    font(o.size ?? 10, o.weight ?? 400);
    const ls = wrap(ctx, s, maxW); const lh = o.lh ?? 14;
    ls.forEach((l, i) => text(l, x, yy + i * lh, o));
    return ls.length * lh;
  };

  function newPage() {
    const c = document.createElement('canvas'); c.width = W * SCALE; c.height = H * SCALE;
    ctx = c.getContext('2d')!; ctx.scale(SCALE, SCALE); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    pages.push(c);
    if (logo) { const s = 74; ctx.drawImage(logo, M - 8, 8, s, s); }
    text('ใบเสนอราคา', W - M, 78, { size: 34, weight: 600, color: ACCENT, align: 'right' });
    // seller / customer block
    let yy = 102;
    const labelX = M, valX = M + 44;
    font(10, 700); text('ผู้ขาย :', labelX, yy, { weight: 700 });
    let h = lines(d.seller.name, valX, yy, 180, { weight: 700 }); yy += Math.max(h, 14);
    text('ที่อยู่ :', labelX, yy, { weight: 700 }); h = lines(d.seller.address, valX, yy, 190, { color: '#374151' }); yy += Math.max(h, 14);
    text('เลขที่ภาษี :', labelX, yy, { weight: 700 }); text(`${d.seller.taxId} (สำนักงานใหญ่)`, valX + 26, yy, { color: '#374151' }); yy += 10;
    text('โทร', 278, 102, { color: MUTED, size: 9 }); text(d.seller.phone, 300, 102, { color: '#374151', size: 9.5 });
    text('อีเมล', 278, 118, { color: MUTED, size: 9 }); text(d.seller.email, 300, 118, { color: '#374151', size: 9.5 });
    hline(yy, M, 365); yy += 16;
    const cy0 = yy;
    text('ลูกค้า :', labelX, yy, { weight: 700 }); h = lines(d.cust.name, valX, yy, 190, { weight: 700 }); yy += Math.max(h, 14);
    text('ที่อยู่ :', labelX, yy, { weight: 700 }); h = lines(d.cust.address, valX, yy, 190, { color: '#374151' }); yy += Math.max(h, 14);
    text('เลขที่ภาษี :', labelX, yy, { weight: 700 }); text(d.cust.taxId || '-', valX + 26, yy, { color: '#374151' }); yy += 14;
    text('เรียน :', labelX, yy, { weight: 700 }); text(d.cust.attn || '-', valX, yy, { color: '#374151' }); yy += 6;
    text('โทร', 278, cy0, { color: MUTED, size: 9 }); text(d.cust.phone || '-', 300, cy0, { color: '#374151', size: 9.5 });
    // right column: meta box + back contact
    rrect(412, 96, W - M - 412, 82, 8, BAND);
    const meta: [string, string][] = [['เลขที่เอกสาร :', d.doc.docNo], ['วันที่ออก :', d.doc.issueDate], ['วันที่ตอบรับ :', d.doc.acceptDate || '-'], ['ใช้ได้ถึง :', d.doc.validUntil], ['อ้างอิง :', d.doc.ref || '-']];
    meta.forEach(([k, v], i) => { text(k, 420, 112 + i * 14.5, { weight: 700, size: 9 }); text(v, 482, 112 + i * 14.5, { size: 9 }); });
    text('ติดต่อกลับที่ :', 412, 200, { weight: 700, size: 9.5 });
    text(d.back.name || '-', 412, 215, { size: 9.5 }); text(d.back.phone || '-', 412, 229, { size: 9.5 }); text(d.back.email || '-', 412, 243, { size: 9.5 });
    y = Math.max(yy, 252) + 10;
  }

  const BODY_BOTTOM = H - 36;
  const FOOTER_H = 372;
  const colR = { qty: 338, price: 394, disc: 446, vat: 478, net: W - M };
  function tableHeader() {
    rrect(M, y, W - 2 * M, 24, 6, BAND);
    text('คำอธิบาย', M + 8, y + 16, { weight: 600, size: 10 });
    text('จำนวน', colR.qty, y + 16, { weight: 600, size: 9, align: 'right' }); text('ราคา', colR.price, y + 16, { weight: 600, size: 9, align: 'right' });
    text('ส่วนลด', colR.disc, y + 16, { weight: 600, size: 9, align: 'right' }); text('VAT', colR.vat, y + 16, { weight: 600, size: 9, align: 'right' });
    text('มูลค่าก่อนภาษี', colR.net - 2, y + 16, { weight: 600, size: 9, align: 'right' });
    y += 32;
  }
  const ensure = (h: number) => { if (y + h > BODY_BOTTOM) { newPage(); tableHeader(); } };

  newPage(); tableHeader();
  d.rows.forEach((r, i) => {
    font(10, 400);
    const nameLines = wrap(ctx, `${i + 1}.  ${r.name}`, 262);
    ensure(nameLines.length * 14 + 12);
    nameLines.forEach((l, k) => text(l, M + 8, y + 10 + k * 14, { size: 10 }));
    text(fmt2(r.qty), colR.qty, y + 10, { align: 'right' }); text(fmt2(r.price), colR.price, y + 10, { align: 'right' });
    text(fmt2(r.discount), colR.disc, y + 10, { align: 'right' }); text(`${r.vatPct}%`, colR.vat, y + 10, { align: 'right' }); text(fmt2(r.net), colR.net - 2, y + 10, { align: 'right' });
    y += nameLines.length * 14 + 10; hline(y); y += 10;
    r.details.forEach((dt, di) => {
      font(9.5, 400); const ls = wrap(ctx, `${di + 1}. ${dt}`, 300);
      ensure(ls.length * 13 + 2);
      ls.forEach((l, k) => text(l, M + 16, y + 9 + k * 13, { size: 9.5 })); y += ls.length * 13 + 1;
    });
    if (r.details.length) { y += 6; hline(y); y += 10; }
  });
  d.notes.filter(Boolean).forEach(n => { font(9.5, 400); const ls = wrap(ctx, n, 330); ensure(ls.length * 13 + 8); ls.forEach((l, k) => text(l, M + 16, y + 9 + k * 13, { size: 9.5 })); y += ls.length * 13 + 8; });

  // footer block anchored to the bottom of the last page
  if (y > H - 36 - FOOTER_H) newPage();
  let fy = H - 30 - FOOTER_H;
  hline(fy); fy += 16;
  text('สรุป', M + 4, fy + 4, { weight: 700 });
  const sumRows: [string, string][] = [['มูลค่าที่คำนวณภาษี 7%', `${fmt2(d.summary.net)} บาท`], ['ภาษีมูลค่าเพิ่ม 7%', `${fmt2(d.summary.vat)} บาท`]];
  sumRows.forEach(([k, v], i) => { text(k, 92, fy + 4 + i * 17, { weight: 600 }); text(v, 335, fy + 4 + i * 17, { align: 'right', color: '#374151' }); });
  text('จำนวนเงินทั้งสิ้น', 92, fy + 4 + 34, { weight: 600 }); text(bahtText(d.summary.total), 335, fy + 4 + 34, { align: 'right', color: '#374151', size: 9.5 });
  rrect(352, fy - 8, W - M - 352, 40, 8, BAND);
  text('จำนวนเงินทั้งสิ้น', 362, fy + 16, { weight: 600, size: 9 });
  font(16, 700); ctx.fillStyle = '#3B3F9E'; ctx.textAlign = 'right'; ctx.fillText(fmt2(d.summary.total), W - M - 36, fy + 18); text('บาท', W - M - 10, fy + 18, { size: 9.5, color: '#3B3F9E', align: 'right' });
  text('จำนวนเงินที่ถูกหัก ณ ที่จ่าย', 470, fy + 48, { weight: 600, align: 'right', size: 9.5 }); text('0.00 บาท', W - M - 4, fy + 48, { align: 'right', size: 9.5 });
  text('จำนวนเงินที่ชำระ', 470, fy + 64, { weight: 600, align: 'right', size: 9.5 }); text(`${fmt2(d.summary.total)} บาท`, W - M - 4, fy + 64, { align: 'right', size: 9.5 });
  fy += 86; hline(fy); fy += 16;
  text('ชำระเงิน', M + 4, fy + 4, { weight: 700 });
  text(`${d.bank.bank}`, 92, fy + 4, { color: '#374151' }); text(`${d.bank.type} ${d.bank.no}`, 92, fy + 20, { weight: 700 }); text(d.bank.name, 92, fy + 36, { color: '#374151' });
  fy += 52; hline(fy); fy += 16;
  text('หมายเหตุ', M + 4, fy + 4, { weight: 700 });
  text('เงื่อนไขการชำระเงิน', 92, fy + 4, { color: '#374151' });
  d.payments.forEach((p, i) => text(`(${i + 1}) ${p.label} ชำระ ${p.pct}%`, 92, fy + 20 + i * 14, { color: '#374151' }));
  fy += 28 + d.payments.length * 14; hline(fy); fy += 16;
  text('รับรอง', M + 4, fy + 4, { weight: 700 });
  const cols = [{ t: 'ผู้ออกเอกสาร (ผู้ขาย)', x: 130 }, { t: 'ผู้อนุมัติเอกสาร (ผู้ขาย)', x: 232 }, { t: 'ตราประทับ (ผู้ขาย)', x: 338 }, { t: 'ผู้รับเอกสาร (ลูกค้า)', x: 428 }];
  cols.forEach(c => text(c.t, c.x, fy + 4, { weight: 600, size: 8.5 }));
  const sigY = fy + 70;
  [130, 232, 428].forEach(x => { ctx.setLineDash([3, 2]); hline(sigY, x, x + 86, '#9CA3AF'); ctx.setLineDash([]); });
  text(d.doc.issueDate, 173, sigY + 13, { size: 9, align: 'center' }); text(d.doc.issueDate, 275, sigY + 13, { size: 9, align: 'center' });
  text(d.cust.name, 471, sigY + 13, { size: 9, align: 'center' });
  if (logo) ctx.drawImage(logo, 338, fy + 12, 62, 62);
  ctx.setLineDash([3, 2]); ctx.strokeStyle = '#9CA3AF'; ctx.strokeRect(524, fy + 12, 38, 62); ctx.setLineDash([]);
  text('ตราประทับ', 543, fy + 46, { size: 7, color: MUTED, align: 'center' });

  // page numbers (now that the total is known)
  pages.forEach((c, i) => {
    const g = c.getContext('2d')!; g.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    g.fillStyle = INK; g.textAlign = 'right'; g.font = `600 10px ${fam}`; g.fillText(`หน้า ${i + 1}/${pages.length}`, W - M, 30);
    g.font = `400 10px ${fam}`; g.fillText('(ต้นฉบับ)', W - M, 45);
  });
  return pages;
}
