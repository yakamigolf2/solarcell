import { z } from 'zod';

/** Job pipeline, in display order. Shared by the backoffice UI and the API. */
export const STATUSES = ['ลีดใหม่', 'ให้ติดต่อใหม่/ติดต่อไม่ได้', 'รอใบเสนอราคาเบื้องต้น', 'สำรวจหน้างาน', 'รอใบเสนอราคาสุดท้าย', 'รอแก้ไขใบเสนอราคา', 'เสนอราคาแล้ว', 'ตกลงจ้าง', 'ปฏิเสธการจ้าง', 'รอยื่นกู้ธนาคาร', 'รอผลกู้ธนาคาร', 'ยื่นกู้ไม่ผ่าน', 'มัดจำแล้ว', 'รอนัดวันติดตั้ง', 'รอติดตั้ง', 'อยู่ระหว่างการติดตั้ง', 'ติดตั้งแล้วเสร็จ', 'กำลังตรวจรับงานติดตั้ง', 'ชำระเงินผู้รับเหมาแล้ว', 'ลูกค้าชำระเงินแล้ว', 'รอยื่นการไฟฟ้า', 'อยู่ระหว่างยื่นการไฟฟ้า', 'ยื่นการไฟฟ้าแล้วเสร็จ'] as const;
export type Status = (typeof STATUSES)[number];

/** Statuses from the old 11-stage flow, mapped onto the 23-stage flow so saved jobs still land in a column. */
export const LEGACY_STATUS: Record<string, Status> = { 'ติดต่อแล้ว': 'รอใบเสนอราคาเบื้องต้น', 'รอเสนอราคา': 'รอใบเสนอราคาสุดท้าย', 'ติดตั้งแล้ว': 'ติดตั้งแล้วเสร็จ', 'ยื่นการไฟฟ้า': 'อยู่ระหว่างยื่นการไฟฟ้า', 'ส่งมอบงาน': 'ยื่นการไฟฟ้าแล้วเสร็จ' };

/** Filter groups for the status chips: pick a group first, then narrow to one status. Every status is in exactly one group. */
export const STATUS_GROUPS: { name: string; statuses: Status[] }[] = [
  { name: 'ขาย / เสนอราคา', statuses: ['ลีดใหม่', 'ให้ติดต่อใหม่/ติดต่อไม่ได้', 'รอใบเสนอราคาเบื้องต้น', 'สำรวจหน้างาน', 'รอใบเสนอราคาสุดท้าย', 'รอแก้ไขใบเสนอราคา', 'เสนอราคาแล้ว'] },
  { name: 'ตกลงจ้าง / สินเชื่อ', statuses: ['ตกลงจ้าง', 'รอยื่นกู้ธนาคาร', 'รอผลกู้ธนาคาร', 'มัดจำแล้ว'] },
  { name: 'ติดตั้ง', statuses: ['รอนัดวันติดตั้ง', 'รอติดตั้ง', 'อยู่ระหว่างการติดตั้ง', 'ติดตั้งแล้วเสร็จ', 'กำลังตรวจรับงานติดตั้ง'] },
  { name: 'ชำระเงิน', statuses: ['ชำระเงินผู้รับเหมาแล้ว', 'ลูกค้าชำระเงินแล้ว'] },
  { name: 'การไฟฟ้า', statuses: ['รอยื่นการไฟฟ้า', 'อยู่ระหว่างยื่นการไฟฟ้า', 'ยื่นการไฟฟ้าแล้วเสร็จ'] },
  { name: 'ไม่สำเร็จ', statuses: ['ปฏิเสธการจ้าง', 'ยื่นกู้ไม่ผ่าน'] },
];

/** Jobs that are finished or lost; hidden by default in lists. */
export const CLOSED_STATUSES: Status[] = ['ยื่นการไฟฟ้าแล้วเสร็จ', 'ปฏิเสธการจ้าง', 'ยื่นกู้ไม่ผ่าน'];

/** Where a lead came from, for the lead-source report. Website-form leads are tagged automatically. */
export const LEAD_SOURCES = ['เว็บไซต์', 'Facebook', 'LINE', 'แนะนำต่อ', 'โทรเข้า', 'Walk-in / หน้าร้าน', 'อื่นๆ'] as const;
export const leadSourceOf = (v: { leadSource?: unknown; source?: unknown }) => String(v.leadSource || (v.source === 'website' ? 'เว็บไซต์' : '') || 'ไม่ระบุ');

export const PAYMENT_STATUSES = ['ยังไม่โอน', 'โอนแล้ว', 'รอตรวจสอบ', 'ยืนยันแล้ว'] as const;

/** Fields that make up the quoted price; locked once the quotation is approved. */
export const PRICE_FIELDS = ['items', 'discount', 'labor'] as const;

export type QuoteApproval = { byId: string; by: string; at: string };
export type Receipt = { no: string; date: string; issuedAt: string; by: string; amount: number; net: number; vat: number };

const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const r2 = (x: number) => Math.round(x * 100) / 100;

/** Quotation totals (items − item discounts + labour − job discount, then 7% VAT). The one formula for quote, finance and receipts. */
export function quoteTotals(v: { items?: unknown; labor?: unknown; discount?: unknown }) {
  const items = Array.isArray(v.items) ? (v.items as Record<string, unknown>[]) : [];
  const gross = items.reduce((s, i) => s + n(i.qty) * n(i.price), 0) + n(v.labor);
  const totalDiscount = items.reduce((s, i) => s + n(i.discount), 0) + n(v.discount);
  const net = Math.max(0, gross - totalDiscount);
  const vat = r2(net * 0.07);
  return { gross, totalDiscount, net, vat, total: r2(net + vat) };
}

/** Amount due for installment `pct` of the job total, split into pre-VAT and VAT for the tax invoice. */
export function installmentAmount(v: Parameters<typeof quoteTotals>[0], pct: unknown) {
  const amount = r2(quoteTotals(v).total * n(pct) / 100);
  const net = r2(amount / 1.07);
  return { amount, net, vat: r2(amount - net) };
}

const money = z.number().finite().min(-1e9).max(1e9);
const amount = z.number().finite().min(0).max(1e9);
const text = (max: number) => z.string().max(max);

const item = z.looseObject({
  name: text(500),
  qty: amount,
  price: money,
  discount: amount.optional(),
  vatPct: z.number().finite().min(0).max(100).optional(),
});

const payment = z.looseObject({
  label: text(200),
  pct: z.number().finite().min(0).max(100),
  status: z.enum(PAYMENT_STATUSES),
  slip: text(2000),
  due: text(40),
});

/** What the API accepts for a job. Unknown extra fields are kept (the UI stores many optional ones); known fields must have the right shape. */
export const jobSchema = z.looseObject({
  customer: z.string().trim().min(1, 'กรุณากรอกชื่อลูกค้า').max(200),
  phone: text(50),
  status: z.preprocess((v) => (typeof v === 'string' && LEGACY_STATUS[v]) || v, z.enum(STATUSES)),
  line: text(100).optional(),
  address: text(1000).optional(),
  mapUrl: text(2000).optional(),
  building: text(100).optional(),
  customerNote: text(10000).optional(),
  surveyNote: text(10000).optional(),
  bill: amount.optional(),
  roofArea: amount.optional(),
  kw: amount.optional(),
  panels: amount.optional(),
  cable: amount.optional(),
  discount: amount.optional(),
  labor: amount.optional(),
  items: z.array(item).max(300).optional(),
  payments: z.array(payment).max(24).optional(),
  quoteApproval: z.looseObject({ byId: z.string(), by: z.string(), at: z.string() }).nullable().optional(),
  saleId: text(64).optional(), saleName: text(200).optional(),
  techId: text(64).optional(), techName: text(200).optional(),
  installDate: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'วันติดตั้งไม่ถูกต้อง')]).optional(),
  installDays: z.number().int().min(1).max(60).optional(),
  leadSource: z.union([z.literal(''), z.enum(LEAD_SOURCES)]).optional(),
});

export const userSchema = z.looseObject({
  name: z.string().trim().min(1, 'กรุณากรอกชื่อ').max(200),
  username: z.string().trim().regex(/^[A-Za-z0-9._-]{3,40}$/, 'Username ใช้ได้เฉพาะ a-z 0-9 . _ - (3-40 ตัว)'),
  role: z.enum(['Admin', 'Sale', 'Technician', 'Accountant']),
  status: z.enum(['ใช้งาน', 'ปิดใช้งาน']),
  email: text(200).optional(),
  phone: text(50).optional(),
  permissions: z.record(z.string(), z.boolean()).optional(),
});

/** First validation problem as a short Thai message, e.g. "ข้อมูลไม่ถูกต้อง (payments.0.pct)". */
export function describeIssue(error: z.ZodError) {
  const i = error.issues[0];
  const path = i.path.join('.');
  return i.message && !i.message.startsWith('Invalid') && !i.message.startsWith('Too') ? i.message : `ข้อมูลไม่ถูกต้อง${path ? ` (${path})` : ''}`;
}
