import { installmentAmount, quoteTotals, type Receipt } from '@/lib/job';

type Pay = { label: string; pct: number; status: string; due: string; receipt?: Receipt };
export type ExportJob = { customer: string; phone: string; status: string; created: string; kw?: number; payments?: Pay[]; quoteApproval?: { by: string; at: string } | null; items?: unknown; labor?: unknown; discount?: unknown };

/** Sales report as .xlsx: one sheet per job, one per installment. Loaded on demand (exceljs is large). */
export async function exportSalesExcel(jobs: ExportJob[], soldStatuses: string[]) {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'BGE SolarTech';
  wb.created = new Date();
  const money = '#,##0.00';
  const head = (ws: import('exceljs').Worksheet) => {
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } };
  };

  const sales = wb.addWorksheet('ยอดขาย');
  sales.columns = [
    { header: 'ลูกค้า', key: 'customer', width: 28 }, { header: 'เบอร์โทร', key: 'phone', width: 14 },
    { header: 'สถานะ', key: 'status', width: 24 }, { header: 'ขายแล้ว', key: 'sold', width: 9 },
    { header: 'วันที่สร้าง', key: 'created', width: 12 }, { header: 'kW', key: 'kw', width: 8 },
    { header: 'มูลค่าก่อน VAT', key: 'net', width: 15, style: { numFmt: money } }, { header: 'VAT 7%', key: 'vat', width: 13, style: { numFmt: money } },
    { header: 'ยอดรวม', key: 'total', width: 15, style: { numFmt: money } }, { header: 'ชำระแล้ว (ยืนยัน)', key: 'paid', width: 16, style: { numFmt: money } },
    { header: 'ค้างชำระ', key: 'due', width: 14, style: { numFmt: money } }, { header: 'อนุมัติใบเสนอราคา', key: 'approved', width: 26 },
  ];
  const pays = wb.addWorksheet('งวดชำระ');
  pays.columns = [
    { header: 'ลูกค้า', key: 'customer', width: 28 }, { header: 'งวด', key: 'label', width: 22 }, { header: '%', key: 'pct', width: 6 },
    { header: 'ยอด', key: 'amount', width: 14, style: { numFmt: money } }, { header: 'สถานะ', key: 'status', width: 12 },
    { header: 'กำหนดชำระ', key: 'due', width: 12 }, { header: 'เลขที่ใบเสร็จ', key: 'receiptNo', width: 16 }, { header: 'วันที่ใบเสร็จ', key: 'receiptDate', width: 13 },
  ];

  for (const j of jobs) {
    const t = quoteTotals(j);
    const rows = (j.payments || []).map(p => ({ p, amount: p.receipt ? p.receipt.amount : installmentAmount(j, p.pct).amount }));
    const paid = rows.filter(x => x.p.status === 'ยืนยันแล้ว').reduce((s, x) => s + x.amount, 0);
    sales.addRow({
      customer: j.customer, phone: j.phone, status: j.status, sold: soldStatuses.includes(j.status) ? 'ใช่' : '', created: j.created, kw: j.kw || '',
      net: t.net, vat: t.vat, total: t.total, paid, due: Math.max(0, t.total - paid),
      approved: j.quoteApproval ? `${j.quoteApproval.by} ${new Date(j.quoteApproval.at).toLocaleDateString('th-TH')}` : '',
    });
    for (const { p, amount } of rows) pays.addRow({ customer: j.customer, label: p.label, pct: p.pct, amount, status: p.status, due: p.due, receiptNo: p.receipt?.no || '', receiptDate: p.receipt?.date || '' });
  }
  const sum = sales.addRow({ customer: 'รวม', net: { formula: `SUM(G2:G${jobs.length + 1})` }, vat: { formula: `SUM(H2:H${jobs.length + 1})` }, total: { formula: `SUM(I2:I${jobs.length + 1})` }, paid: { formula: `SUM(J2:J${jobs.length + 1})` }, due: { formula: `SUM(K2:K${jobs.length + 1})` } });
  sum.font = { bold: true };
  head(sales); head(pays);

  const buf = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const a = document.createElement('a');
  a.href = url; a.download = `BGE-รายงานยอดขาย-${new Date().toISOString().slice(0, 10)}.xlsx`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
