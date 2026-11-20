// Installation handover certificate (ใบส่งมอบงาน) drawn on an A4 canvas like the quotation, with the customer's signature.
export type HandoverDoc = {
  seller: { name: string; address: string; phone: string };
  docNo: string;
  customer: { name: string; address: string; phone: string };
  system: { kw: number; panels: number; inverter: string };
  items: { name: string; qty: number }[];
  installDate: string; techName: string;
  signer: { name: string; signedAt: string; signature: string };
};

const W = 595, H = 842, M = 40, SCALE = 2, INK = '#1F2430', MUTED = '#6B7280', ACCENT = '#0F766E', LINE = '#D5D8DE';

const loadImage = (src: string) => new Promise<HTMLImageElement | null>((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

export async function renderHandoverPage(d: HandoverDoc): Promise<HTMLCanvasElement> {
  const fam = getComputedStyle(document.body).fontFamily || 'sans-serif';
  try { await document.fonts.ready; } catch { /* draw with what is loaded */ }
  const [logo, sig] = await Promise.all([loadImage('/BGE_logo.png'), loadImage(d.signer.signature)]);
  const c = document.createElement('canvas'); c.width = W * SCALE; c.height = H * SCALE;
  const ctx = c.getContext('2d')!; ctx.scale(SCALE, SCALE); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  const text = (s: string, x: number, y: number, o: { size?: number; weight?: number; color?: string; align?: CanvasTextAlign } = {}) => { ctx.font = `${o.weight ?? 400} ${o.size ?? 10.5}px ${fam}`; ctx.fillStyle = o.color ?? INK; ctx.textAlign = o.align ?? 'left'; ctx.fillText(s, x, y); };
  const hline = (y: number) => { ctx.strokeStyle = LINE; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(M, y); ctx.lineTo(W - M, y); ctx.stroke(); };
  const wrap = (s: string, maxW: number, size = 10.5) => { ctx.font = `400 ${size}px ${fam}`; const out: string[] = []; let line = ''; for (const ch of Array.from(s)) { if (ctx.measureText(line + ch).width > maxW && line) { out.push(line); line = ch; } else line += ch; } if (line) out.push(line); return out; };

  if (logo) ctx.drawImage(logo, M - 6, 18, 66, 66);
  text('ใบส่งมอบงานติดตั้ง', W - M, 52, { size: 24, weight: 700, color: ACCENT, align: 'right' });
  text(`เลขที่ ${d.docNo}`, W - M, 72, { size: 10, color: MUTED, align: 'right' });
  let y = 108;
  text(d.seller.name, M, y, { weight: 700 }); y += 15;
  for (const l of wrap(d.seller.address, W - 2 * M, 9.5)) { text(l, M, y, { size: 9.5, color: MUTED }); y += 13; }
  text(`โทร ${d.seller.phone}`, M, y, { size: 9.5, color: MUTED }); y += 14; hline(y); y += 22;

  const row = (k: string, v: string) => { text(k, M, y, { weight: 700 }); const ls = wrap(v || '-', W - 2 * M - 120); ls.forEach((l, i) => text(l, M + 120, y + i * 14)); y += Math.max(1, ls.length) * 14 + 4; };
  row('ลูกค้า', d.customer.name);
  row('สถานที่ติดตั้ง', d.customer.address);
  row('โทร', d.customer.phone);
  row('ระบบ', [d.system.kw ? `${d.system.kw} kW` : '', d.system.panels ? `แผง ${d.system.panels} แผ่น` : '', d.system.inverter].filter(Boolean).join(' • '));
  row('วันที่ติดตั้ง', d.installDate || '-');
  row('ทีมช่าง', d.techName || '-');
  y += 4; hline(y); y += 20;

  text('รายการที่ส่งมอบ', M, y, { weight: 700 }); y += 16;
  d.items.slice(0, 18).forEach((it, i) => { const ls = wrap(`${i + 1}. ${it.name}${it.qty ? `  จำนวน ${it.qty}` : ''}`, W - 2 * M - 16, 10); ls.forEach((l) => { text(l, M + 12, y, { size: 10 }); y += 13.5; }); });
  y += 10; hline(y); y += 20;

  const statement = 'ข้าพเจ้าได้ตรวจรับงานติดตั้งระบบโซลาร์เซลล์ตามรายการข้างต้นครบถ้วน ระบบทำงานปกติ และได้รับคำแนะนำการใช้งานแล้ว';
  for (const l of wrap(statement, W - 2 * M)) { text(l, M, y); y += 15; }

  // signatures: customer (with image) and company
  const sy = Math.max(y + 30, H - 210);
  const box = (x: number, title: string, name: string, date: string) => {
    ctx.setLineDash([3, 2]); ctx.strokeStyle = '#9CA3AF'; ctx.beginPath(); ctx.moveTo(x, sy + 70); ctx.lineTo(x + 200, sy + 70); ctx.stroke(); ctx.setLineDash([]);
    text(title, x + 100, sy, { weight: 700, align: 'center' });
    text(`( ${name || '................................'} )`, x + 100, sy + 88, { align: 'center' });
    text(date ? `วันที่ ${date}` : 'วันที่ ......../......../........', x + 100, sy + 104, { size: 9.5, color: MUTED, align: 'center' });
  };
  const signedDate = new Date(d.signer.signedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  box(M + 10, 'ผู้รับมอบงาน (ลูกค้า)', d.signer.name, signedDate);
  box(W - M - 210, 'ผู้ส่งมอบงาน (บริษัท)', '', '');
  if (sig) { const h = 58, w = Math.min(190, (sig.width / sig.height) * h); ctx.drawImage(sig, M + 10 + 100 - w / 2, sy + 10, w, h); }
  text(`เซ็นอิเล็กทรอนิกส์ผ่านลิงก์ลูกค้า ${new Date(d.signer.signedAt).toLocaleString('th-TH')}`, M, H - 30, { size: 8.5, color: MUTED });
  return c;
}
