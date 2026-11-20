import type { SessionUser } from '@/lib/auth';
import { getDb, schema } from '@/db';

/** Append-only change log, stored in the records table. The API never lets clients write to this collection. */
export const AUDIT = 'bge_audit';

export type AuditChange = { field: string; from: unknown; to: unknown };
export type AuditEntry = {
  at: string; userId: string; userName: string;
  collection: string; recordId: string; recordLabel: string;
  action: 'create' | 'update' | 'delete' | 'approve' | 'unapprove';
  changes: AuditChange[];
};

type V = Record<string, any>;
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/** Items + labour − discounts, before VAT: enough to see that a price changed and by how much. */
export function jobSubtotal(v: V) {
  const items = Array.isArray(v.items) ? v.items : [];
  return items.reduce((s: number, it: V) => s + num(it.qty) * num(it.price) - num(it.discount), 0) + num(v.labor) - num(v.discount);
}

/** The changes worth auditing on a job: status, price, payments, approval, and who the customer is. */
export function jobChanges(before: V, after: V): AuditChange[] {
  const out: AuditChange[] = [];
  const diff = (field: string, a: unknown, b: unknown) => { if (JSON.stringify(a ?? null) !== JSON.stringify(b ?? null)) out.push({ field, from: a ?? null, to: b ?? null }); };
  diff('สถานะ', before.status, after.status);
  diff('ชื่อลูกค้า', before.customer, after.customer);
  diff('เบอร์โทร', before.phone, after.phone);
  diff('เซลล์ผู้ดูแล', before.saleName || null, after.saleName || null);
  diff('ทีมช่าง', before.techName || null, after.techName || null);
  diff('วันติดตั้ง', before.installDate || null, after.installDate || null);
  const s0 = jobSubtotal(before), s1 = jobSubtotal(after);
  if (s0 !== s1) out.push({ field: 'ยอดก่อน VAT', from: s0, to: s1 });
  const p0: V[] = Array.isArray(before.payments) ? before.payments : [];
  const p1: V[] = Array.isArray(after.payments) ? after.payments : [];
  for (let i = 0; i < Math.max(p0.length, p1.length); i++) {
    const label = p1[i]?.label || p0[i]?.label || `งวด ${i + 1}`;
    diff(`${label}: สถานะ`, p0[i]?.status, p1[i]?.status);
    diff(`${label}: %`, p0[i]?.pct, p1[i]?.pct);
    diff(`${label}: สลิป`, p0[i]?.slip ? 'มีสลิป' : null, p1[i]?.slip ? 'มีสลิป' : null);
  }
  return out;
}

export async function writeAudit(user: SessionUser, e: Omit<AuditEntry, 'at' | 'userId' | 'userName'>) {
  const value: AuditEntry = { at: new Date().toISOString(), userId: user.id, userName: String(user.value.name || user.value.username || ''), ...e };
  try { await getDb().insert(schema.records).values({ collection: AUDIT, value }); }
  catch (err) { console.error('audit write failed', err); } // never block the user's save on the log
}
