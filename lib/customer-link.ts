import { randomBytes } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { JOBS } from '@/lib/auth';
import { installmentAmount, type Status } from '@/lib/job';

/** Customer-facing job link: /track/<token>. The token is the only key; staff can revoke it (a new one breaks old links). */
export const newPublicToken = () => randomBytes(18).toString('base64url');
export const TOKEN_RE = /^[A-Za-z0-9_-]{20,40}$/;

export async function jobByToken(token: string) {
  if (!TOKEN_RE.test(token)) return null;
  const [row] = await getDb().select().from(schema.records).where(and(eq(schema.records.collection, JOBS), sql`${schema.records.value}->>'publicToken' = ${token}`)).limit(1);
  return row || null;
}

/** The customer sees six milestones, not the 23 internal statuses. */
export const MILESTONES = ['รับเรื่องแล้ว', 'เสนอราคา', 'ตกลงจ้าง', 'ติดตั้ง', 'ตรวจรับและชำระเงิน', 'ยื่นการไฟฟ้า'] as const;
const STEP: Record<string, number> = {
  'ลีดใหม่': 0, 'ให้ติดต่อใหม่/ติดต่อไม่ได้': 0, 'รอใบเสนอราคาเบื้องต้น': 1, 'สำรวจหน้างาน': 1, 'รอใบเสนอราคาสุดท้าย': 1, 'รอแก้ไขใบเสนอราคา': 1, 'เสนอราคาแล้ว': 1,
  'ตกลงจ้าง': 2, 'รอยื่นกู้ธนาคาร': 2, 'รอผลกู้ธนาคาร': 2, 'มัดจำแล้ว': 2,
  'รอนัดวันติดตั้ง': 3, 'รอติดตั้ง': 3, 'อยู่ระหว่างการติดตั้ง': 3,
  'ติดตั้งแล้วเสร็จ': 4, 'กำลังตรวจรับงานติดตั้ง': 4, 'ชำระเงินผู้รับเหมาแล้ว': 4, 'ลูกค้าชำระเงินแล้ว': 4,
  'รอยื่นการไฟฟ้า': 5, 'อยู่ระหว่างยื่นการไฟฟ้า': 5, 'ยื่นการไฟฟ้าแล้วเสร็จ': 6,
};
export const milestoneOf = (status: string) => STEP[status] ?? 0;

/** Statuses at which the customer may sign the handover. */
export const HANDOVER_FROM: Status[] = ['ติดตั้งแล้วเสร็จ', 'กำลังตรวจรับงานติดตั้ง', 'ชำระเงินผู้รับเหมาแล้ว', 'ลูกค้าชำระเงินแล้ว', 'รอยื่นการไฟฟ้า', 'อยู่ระหว่างยื่นการไฟฟ้า', 'ยื่นการไฟฟ้าแล้วเสร็จ'];

export type Handover = { name: string; signedAt: string; signature: string; ip: string };

/** What the public page may show: no phone, no address, no internal notes. */
export function publicView(v: Record<string, any>) {
  const firstName = String(v.customer || '').trim().split(/\s+/).slice(0, 2).join(' ');
  return {
    customer: firstName,
    status: String(v.status || ''),
    step: milestoneOf(String(v.status || '')),
    kw: Number(v.kw) || 0, panels: Number(v.panels) || 0, inverter: String(v.inverter || ''),
    installDate: String(v.installDate || ''), installDays: Number(v.installDays) || 1, nextAppt: String(v.nextAppt || ''),
    payments: (Array.isArray(v.payments) ? v.payments : []).map((p: Record<string, any>) => ({ label: String(p.label || ''), pct: Number(p.pct) || 0, amount: p.receipt?.amount ?? installmentAmount(v, p.pct).amount, paid: p.status === 'ยืนยันแล้ว', receiptNo: p.receipt?.no || '' })),
    items: (Array.isArray(v.items) ? v.items : []).map((it: Record<string, any>) => ({ name: String(it.name || ''), qty: Number(it.qty) || 0 })),
    canSign: HANDOVER_FROM.includes(v.status) && !v.handover,
    handover: v.handover ? { name: String(v.handover.name), signedAt: String(v.handover.signedAt) } : null,
  };
}
