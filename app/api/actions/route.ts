import bcrypt from 'bcryptjs';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb, schema } from '@/db';
import { NEWS_COLLECTION } from '@/lib/news';
import { PROJECTS_COLLECTION } from '@/lib/projects';
import { PRODUCTS_COLLECTION } from '@/lib/products';
import { CLIENTS_COLLECTION } from '@/lib/clients';
import { can, COMPANY, getSessionUser, JOBS, MIN_PASSWORD, type SessionUser, USERS } from '@/lib/auth';
import { AUDIT, jobChanges, writeAudit } from '@/lib/audit';
import { recordError } from '@/lib/errors';
import { adminUrl, notifyLine } from '@/lib/notify';
import { describeIssue, installmentAmount, jobSchema, PRICE_FIELDS, type Receipt, userSchema } from '@/lib/job';

const r = schema.records;
type Args = Record<string, any>;

const JOB_VIEW = ['customers_view', 'orders_view', 'quotes_view', 'finance_view', 'electric_view', 'photos_view'];
const JOB_WRITE = ['customers_edit', 'orders_edit', 'orders_change_status', 'quotes_edit', 'quotes_approve', 'finance_confirm', 'finance_edit_installments', 'electric_update', 'photos_upload', 'photos_delete'];

class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
const forbid = () => new HttpError(403, 'ไม่มีสิทธิ์ดำเนินการนี้');

function authorize(user: SessionUser, action: string, collection: string) {
  const isWrite = action !== 'records.list';
  if (collection === JOBS) {
    if (!isWrite) return can(user, ...JOB_VIEW);
    if (action === 'records.create') return can(user, 'customers_create');
    if (action === 'records.delete') return can(user, 'orders_delete', 'customers_delete');
    return can(user, ...JOB_WRITE);
  }
  if (collection === USERS) return isWrite ? can(user, 'users_manage') : can(user, 'users_view', 'users_manage');
  if (collection === NEWS_COLLECTION) return can(user, 'news_manage');
  if (collection === 'bge_attachments') return isWrite ? can(user, 'quotes_edit', 'quotes_create') : can(user, 'quotes_view');
  if (collection === 'bge_equipment_sets') return isWrite ? can(user, 'settings_edit', 'quotes_edit') : can(user, 'quotes_view', 'settings_view');
  if (collection === CLIENTS_COLLECTION) return can(user, 'clients_manage');
  if (collection === PRODUCTS_COLLECTION) return can(user, 'products_manage');
  if (collection === PROJECTS_COLLECTION) return can(user, 'projects_manage');
  if (collection === COMPANY) return isWrite ? can(user, 'settings_edit') : true;
  if (collection === AUDIT) return !isWrite && (user.value.role === 'Admin' || can(user, 'users_manage')); // append-only: no client writes
  return false;
}

async function prepareUserValue(value: Args, current?: Args) {
  const next = { ...value };
  if (typeof next.password === 'string' && next.password) {
    if (next.password.length < MIN_PASSWORD) throw new HttpError(400, `รหัสผ่านต้องมีอย่างน้อย ${MIN_PASSWORD} ตัวอักษร`);
    next.password = await bcrypt.hash(next.password, 10);
  } else next.password = current?.password || '';
  // Lockout counters are server-owned; a stale admin form must not reset or forge them.
  next.loginFails = current?.loginFails ?? 0;
  next.lockedUntil = current?.lockedUntil ?? null;
  return next;
}

/** Keep fields the user has no permission to change, so a crafted request can't bypass what the UI hides. */
function guardJobValue(user: SessionUser, current: Args, next: Args) {
  const out = { ...next };
  if (!can(user, 'orders_change_status')) out.status = current.status;
  const curPays: Args[] = Array.isArray(current.payments) ? current.payments : [];
  if (!can(user, 'finance_edit_installments')) {
    const nextPays: Args[] = Array.isArray(out.payments) ? out.payments : [];
    out.payments = curPays.map((p, i) => ({ ...p, ...(nextPays[i] || {}), label: p.label, pct: p.pct, due: p.due }));
  }
  if (!can(user, 'finance_confirm')) {
    const pays: Args[] = Array.isArray(out.payments) ? out.payments : [];
    out.payments = pays.map((p, i) => {
      if (curPays[i]?.status === 'ยืนยันแล้ว') return { ...curPays[i] };
      return p.status === 'ยืนยันแล้ว' ? { ...p, status: curPays[i]?.status || 'รอตรวจสอบ' } : p;
    });
  }
  // Receipts are server-owned (receipt.issue); once issued, that installment can no longer change.
  out.payments = (Array.isArray(out.payments) ? out.payments : []).map((p: Args, i: number) => {
    if (curPays[i]?.receipt) return { ...curPays[i] };
    const { receipt: _ignored, ...rest } = p;
    return rest;
  });
  // Approval is server-owned (set only by the quote.approve action); an approved quotation's price is frozen.
  out.quoteApproval = current.quoteApproval ?? null;
  if (out.quoteApproval) for (const f of PRICE_FIELDS) out[f] = current[f];
  return out;
}

function validate(collection: string, value: Args) {
  const schemaFor = collection === JOBS ? jobSchema : collection === USERS ? userSchema : null;
  if (!schemaFor) return value;
  const res = schemaFor.safeParse(value);
  if (!res.success) throw new HttpError(400, describeIssue(res.error));
  return res.data as Args;
}

const stamp = (d: Date) => d.toISOString();
const label = (collection: string, v: Args) => String(collection === USERS ? v.username : v.customer || v.title || v.name || '');
const strip = (collection: string, rec: { id: string; value: Args; updatedAt: Date }) => {
  const updatedAt = stamp(rec.updatedAt);
  if (collection !== USERS) return { id: rec.id, value: rec.value, updatedAt };
  const { loginFails: _f, lockedUntil: _l, ...value } = rec.value;
  return { id: rec.id, value: { ...value, password: '' }, updatedAt };
};

async function run(user: SessionUser, action: string, args: Args) {
  const db = getDb();
  const collection = String(args.collection || '');
  if (!['records.list', 'records.create', 'records.replace', 'records.delete', 'quote.approve', 'receipt.issue'].includes(action)) throw new HttpError(400, 'unknown action');
  if (action === 'quote.approve') return approveQuote(user, args);
  if (action === 'receipt.issue') return issueReceipt(user, args);
  if (!authorize(user, action, collection)) {
    if (action === 'records.list') return { records: [] }; // hide data the user may not see instead of failing the whole screen
    throw forbid();
  }

  if (action === 'records.list') {
    const rows = collection === AUDIT
      ? await db.select().from(r).where(eq(r.collection, AUDIT)).orderBy(desc(r.createdAt)).limit(Math.min(Number(args.limit) || 500, 2000))
      : await db.select().from(r).where(eq(r.collection, collection)).orderBy(asc(r.createdAt));
    return { records: rows.map((x) => strip(collection, x)) };
  }

  if (action === 'records.create') {
    if (!args.value || typeof args.value !== 'object') throw new HttpError(400, 'value required');
    const checked = validate(collection, collection === JOBS ? { ...args.value, quoteApproval: null } : args.value);
    const value = collection === USERS ? await prepareUserValue(checked) : checked;
    const key = typeof args.idempotency_key === 'string' ? args.idempotency_key : null;
    const [row] = await db.insert(r).values({ collection, value, idempotencyKey: key }).onConflictDoNothing().returning();
    if (!row) {
      // Only replay a record from the same collection: a key from another collection (e.g. seed-user-admin) must not leak that record.
      const [existing] = key ? await db.select().from(r).where(and(eq(r.idempotencyKey, key), eq(r.collection, collection))).limit(1) : [];
      if (!existing) throw new HttpError(409, 'idempotency_key ซ้ำ');
      return strip(collection, existing);
    }
    await writeAudit(user, { collection, recordId: row.id, recordLabel: label(collection, value), action: 'create', changes: [] });
    return strip(collection, row);
  }

  const id = String(args.id || '');
  const [current] = await db.select().from(r).where(and(eq(r.id, id), eq(r.collection, collection))).limit(1);
  if (!current) throw new HttpError(404, 'ไม่พบรายการ');

  if (action === 'records.replace') {
    if (!args.value || typeof args.value !== 'object') throw new HttpError(400, 'value required');
    // Optimistic lock: the client sends the updatedAt it loaded; if someone saved since, refuse instead of overwriting their change.
    const expected = typeof args.expected_updated_at === 'string' ? args.expected_updated_at : null;
    if (expected && expected !== stamp(current.updatedAt)) throw conflict();
    const guarded = collection === JOBS ? guardJobValue(user, current.value, args.value) : args.value;
    const checked = validate(collection, guarded);
    const value = collection === USERS ? await prepareUserValue(checked, current.value) : checked;
    const [row] = await db.update(r).set({ value, updatedAt: new Date() }).where(and(eq(r.id, id), eq(r.updatedAt, current.updatedAt))).returning();
    if (!row) throw conflict(); // someone saved between our read and write
    const changes = collection === JOBS ? jobChanges(current.value, value) : [];
    if (collection !== JOBS || changes.length) await writeAudit(user, { collection, recordId: id, recordLabel: label(collection, value), action: 'update', changes });
    const slips = changes.filter((c) => c.field.endsWith(': สลิป') && c.to === 'มีสลิป');
    if (slips.length) await notifyLine(`💰 แนบสลิปแล้ว รอตรวจสอบ\n${value.customer}\n${slips.map((c) => c.field.replace(': สลิป', '')).join(', ')}\nโดย ${user.value.name || user.value.username}\n${adminUrl()}`);
    return strip(collection, row);
  }

  // records.delete
  if (collection === USERS && id === user.id) throw new HttpError(400, 'ไม่สามารถลบบัญชีของตัวเองได้');
  await db.delete(r).where(eq(r.id, id));
  await writeAudit(user, { collection, recordId: id, recordLabel: label(collection, current.value), action: 'delete', changes: [] });
  return { ok: true };
}

const conflict = () => new HttpError(409, 'ข้อมูลนี้ถูกแก้ไขโดยผู้ใช้อื่นแล้ว ระบบโหลดข้อมูลล่าสุดให้ กรุณาตรวจสอบแล้วแก้ไขอีกครั้ง');

/** Approve (or withdraw approval of) a job's quotation. Who and when are stamped here, never taken from the client. */
async function approveQuote(user: SessionUser, args: Args) {
  if (!can(user, 'quotes_approve')) throw forbid();
  const db = getDb();
  const id = String(args.id || '');
  const [current] = await db.select().from(r).where(and(eq(r.id, id), eq(r.collection, JOBS))).limit(1);
  if (!current) throw new HttpError(404, 'ไม่พบรายการ');
  const approve = args.approve !== false;
  const quoteApproval = approve ? { byId: user.id, by: String(user.value.name || user.value.username || ''), at: new Date().toISOString() } : null;
  const value = { ...current.value, quoteApproval };
  const [row] = await db.update(r).set({ value, updatedAt: new Date() }).where(and(eq(r.id, id), eq(r.updatedAt, current.updatedAt))).returning();
  if (!row) throw conflict();
  await writeAudit(user, { collection: JOBS, recordId: id, recordLabel: label(JOBS, value), action: approve ? 'approve' : 'unapprove', changes: [{ field: 'อนุมัติใบเสนอราคา', from: current.value.quoteApproval ? 'อนุมัติแล้ว' : null, to: approve ? 'อนุมัติแล้ว' : null }] });
  return strip(JOBS, row);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  try {
    const { action, args } = await req.json();
    const data = await run(user, String(action), (args && typeof args === 'object' ? args : {}) as Args);
    return NextResponse.json({ data });
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ error: e.message, code: e.status === 409 ? 'conflict' : undefined }, { status: e.status });
    console.error('actions failed', e);
    await recordError({ message: e instanceof Error ? e.message : String(e), stack: e instanceof Error ? e.stack : '', source: 'server', url: '/api/actions', user: user.value.username });
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' }, { status: 500 });
  }
}

/** Thai local date parts (UTC+7), for document numbers and dates. */
function bangkokNow() {
  const d = new Date(Date.now() + 7 * 3600_000);
  const dd = String(d.getUTCDate()).padStart(2, '0'), mm = String(d.getUTCMonth() + 1).padStart(2, '0'), yyyy = String(d.getUTCFullYear());
  return { dd, mm, yyyy, yy: yyyy.slice(2) };
}

/** Next running number for a prefix (e.g. RC-2611 -> RC-26110001). One UPDATE statement, so two users never get the same number. */
async function nextDocNo(prefix: string) {
  const db = getDb();
  const key = `counter-${prefix}`;
  await db.insert(r).values({ collection: 'bge_counters', value: { key: prefix, n: 0 }, idempotencyKey: key }).onConflictDoNothing();
  const res = await db.execute(sql`update records set value = jsonb_set(value, '{n}', to_jsonb((value->>'n')::int + 1)), updated_at = now() where idempotency_key = ${key} returning (value->>'n')::int as n`);
  const nth = Number((res.rows[0] as Args).n);
  return `${prefix}${String(nth).padStart(4, '0')}`;
}

/** Issue the receipt / tax invoice number for one confirmed installment. Idempotent: a second call returns the same receipt. */
async function issueReceipt(user: SessionUser, args: Args) {
  if (!can(user, 'finance_confirm')) throw forbid();
  const db = getDb();
  const id = String(args.id || '');
  const index = Number(args.index);
  let no: string | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const [current] = await db.select().from(r).where(and(eq(r.id, id), eq(r.collection, JOBS))).limit(1);
    if (!current) throw new HttpError(404, 'ไม่พบรายการ');
    const pays: Args[] = Array.isArray(current.value.payments) ? current.value.payments : [];
    const p = pays[index];
    if (!p) throw new HttpError(404, 'ไม่พบงวดชำระ');
    if (p.receipt) return strip(JOBS, current);
    if (p.status !== 'ยืนยันแล้ว') throw new HttpError(400, 'ต้องยืนยันการโอนก่อนออกใบเสร็จ');
    const t = bangkokNow();
    no = no || await nextDocNo(`RC-${t.yy}${t.mm}`);
    const receipt: Receipt = { no, date: `${t.dd}/${t.mm}/${t.yyyy}`, issuedAt: new Date().toISOString(), by: String(user.value.name || user.value.username || ''), ...installmentAmount(current.value, p.pct) };
    const value = { ...current.value, payments: pays.map((x, i) => (i === index ? { ...x, receipt } : x)) };
    const [row] = await db.update(r).set({ value, updatedAt: new Date() }).where(and(eq(r.id, id), eq(r.updatedAt, current.updatedAt))).returning();
    if (!row) continue; // someone saved in between: re-read and try again with the same number
    await writeAudit(user, { collection: JOBS, recordId: id, recordLabel: label(JOBS, value), action: 'update', changes: [{ field: `${p.label || `งวด ${index + 1}`}: ใบเสร็จ`, from: null, to: `${no} (${receipt.amount.toLocaleString('th-TH')} บาท)` }] });
    return strip(JOBS, row);
  }
  throw conflict();
}
