import bcrypt from 'bcryptjs';
import { del } from '@vercel/blob';
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
import { SLIP_STATUS_LABEL, slipOkConfigured, verifySlip } from '@/lib/slipok';
import { newPublicToken } from '@/lib/customer-link';
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
  // The LINE link is set only through LINE Login itself (/api/auth/line/*).
  next.lineUserId = current?.lineUserId; next.lineName = current?.lineName; next.linePicture = current?.linePicture;
  delete next.lineLinked;
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
    const { receipt: _ignored, slipCheck: _check, ...rest } = p;
    // A SlipOK result stays only while the slip it checked is still attached.
    return curPays[i]?.slipCheck && curPays[i]?.slip === rest.slip ? { ...rest, slipCheck: curPays[i].slipCheck } : rest;
  });
  // Removing site photos needs photos_delete: put back any photo the request dropped.
  if (!can(user, 'photos_delete') && Array.isArray(current.sitePhotos)) {
    const kept: Args[] = Array.isArray(out.sitePhotos) ? out.sitePhotos : [];
    const ids = new Set(kept.map((ph) => ph.id));
    out.sitePhotos = [...kept, ...current.sitePhotos.filter((ph: Args) => !ids.has(ph.id))];
  }
  // The customer link (share.link) and the customer's handover signature (public handover route) are server-owned.
  out.publicToken = current.publicToken;
  out.handover = current.handover;
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
// Postgres keeps microseconds but a JS Date only milliseconds, so compare at millisecond precision
// (rows stamped by the database's now(), e.g. every newly created record, would otherwise never match).
const sameVersion = (d: Date) => sql`date_trunc('milliseconds', ${r.updatedAt}) = ${d.toISOString()}::timestamptz`;
const label = (collection: string, v: Args) => String(collection === USERS ? v.username : v.customer || v.title || v.name || '');
const strip = (collection: string, rec: { id: string; value: Args; updatedAt: Date }) => {
  const updatedAt = stamp(rec.updatedAt);
  if (collection !== USERS) return { id: rec.id, value: rec.value, updatedAt };
  const { loginFails: _f, lockedUntil: _l, lineUserId, ...value } = rec.value;
  return { id: rec.id, value: { ...value, password: '', lineLinked: !!lineUserId }, updatedAt };
};

async function run(user: SessionUser, action: string, args: Args) {
  const db = getDb();
  const collection = String(args.collection || '');
  if (!['records.list', 'records.create', 'records.replace', 'records.delete', 'quote.approve', 'receipt.issue', 'slip.verify', 'staff.list', 'share.link'].includes(action)) throw new HttpError(400, 'unknown action');
  if (action === 'quote.approve') return approveQuote(user, args);
  if (action === 'receipt.issue') return issueReceipt(user, args);
  if (action === 'slip.verify') return verifyPaymentSlip(user, args);
  if (action === 'share.link') return shareLink(user, args);
  if (action === 'staff.list') {
    const rows = await db.select().from(r).where(eq(r.collection, USERS)).orderBy(asc(r.createdAt));
    return { staff: rows.filter((x) => x.value.status === 'ใช้งาน').map((x) => ({ id: x.id, name: String(x.value.name || x.value.username), role: String(x.value.role) })) };
  }
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
    const [row] = await db.update(r).set({ value, updatedAt: new Date() }).where(and(eq(r.id, id), sameVersion(current.updatedAt))).returning();
    if (!row) throw conflict(); // someone saved between our read and write
    const changes = collection === JOBS ? jobChanges(current.value, value) : [];
    if (collection !== JOBS || changes.length) await writeAudit(user, { collection, recordId: id, recordLabel: label(collection, value), action: 'update', changes });
    if (collection === JOBS) await deleteRemovedPhotos(current.value, value);
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
  const [row] = await db.update(r).set({ value, updatedAt: new Date() }).where(and(eq(r.id, id), sameVersion(current.updatedAt))).returning();
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
    const [row] = await db.update(r).set({ value, updatedAt: new Date() }).where(and(eq(r.id, id), sameVersion(current.updatedAt))).returning();
    if (!row) continue; // someone saved in between: re-read and try again with the same number
    await writeAudit(user, { collection: JOBS, recordId: id, recordLabel: label(JOBS, value), action: 'update', changes: [{ field: `${p.label || `งวด ${index + 1}`}: ใบเสร็จ`, from: null, to: `${no} (${receipt.amount.toLocaleString('th-TH')} บาท)` }] });
    return strip(JOBS, row);
  }
  throw conflict();
}

/**
 * Check an installment's slip with SlipOK. A slip that SlipOK accepts (real, right amount, paid to the shop account)
 * and that no other installment already used confirms the installment automatically; anything else leaves it for review.
 */
async function verifyPaymentSlip(user: SessionUser, args: Args) {
  if (!can(user, 'finance_edit_installments', 'finance_confirm')) throw forbid();
  if (!slipOkConfigured()) throw new HttpError(400, 'ยังไม่ได้ตั้งค่า SlipOK (SLIPOK_BRANCH_ID, SLIPOK_API_KEY)');
  const db = getDb();
  const id = String(args.id || '');
  const index = Number(args.index);
  const [first] = await db.select().from(r).where(and(eq(r.id, id), eq(r.collection, JOBS))).limit(1);
  if (!first) throw new HttpError(404, 'ไม่พบรายการ');
  const p0: Args | undefined = (first.value.payments || [])[index];
  if (!p0) throw new HttpError(404, 'ไม่พบงวดชำระ');
  if (p0.receipt) throw new HttpError(400, 'งวดนี้ออกใบเสร็จแล้ว');
  if (!/^https?:\/\//.test(String(p0.slip || ''))) throw new HttpError(400, 'ยังไม่ได้แนบสลิป');

  const by = String(user.value.name || user.value.username || '');
  const check = await verifySlip(String(p0.slip), installmentAmount(first.value, p0.pct).amount, by);
  if (check.status === 'ok' && check.transRef) {
    // Our own duplicate check across every job, on top of SlipOK's log.
    const used = await db.select({ id: r.id, value: r.value }).from(r).where(and(eq(r.collection, JOBS), sql`exists (select 1 from jsonb_array_elements(coalesce(${r.value}->'payments', '[]'::jsonb)) as pay where pay->'slipCheck'->>'transRef' = ${check.transRef} and pay->'slipCheck'->>'status' = 'ok')`));
    const other = used.find((u) => u.id !== id || (u.value.payments || []).findIndex((x: Args) => x?.slipCheck?.transRef === check.transRef) !== index);
    if (other) Object.assign(check, { status: 'duplicate', code: 'local', message: `สลิปนี้ใช้กับงาน ${other.value.customer || ''} แล้ว` });
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    const [current] = attempt === 0 ? [first] : await db.select().from(r).where(and(eq(r.id, id), eq(r.collection, JOBS))).limit(1);
    const pays: Args[] = Array.isArray(current.value.payments) ? current.value.payments : [];
    const p = pays[index];
    if (!p || p.slip !== p0.slip || p.receipt) throw conflict();
    const nextStatus = check.status === 'ok' ? 'ยืนยันแล้ว' : p.status === 'ยืนยันแล้ว' ? p.status : 'รอตรวจสอบ';
    const value: Args = { ...current.value, payments: pays.map((x, i) => (i === index ? { ...x, slipCheck: check, status: nextStatus } : x)) };
    const [row] = await db.update(r).set({ value, updatedAt: new Date() }).where(and(eq(r.id, id), sameVersion(current.updatedAt))).returning();
    if (!row) continue;
    const label = p.label || `งวด ${index + 1}`;
    const changes = [{ field: `${label}: ตรวจสลิป (SlipOK)`, from: null, to: `${SLIP_STATUS_LABEL[check.status]}${check.amount !== null ? ` ${check.amount.toLocaleString('th-TH')} บาท` : ''}${check.transRef ? ` • ${check.transRef}` : ''}` }];
    if (nextStatus !== p.status) changes.push({ field: `${label}: สถานะ`, from: p.status, to: nextStatus });
    await writeAudit(user, { collection: JOBS, recordId: id, recordLabel: String(value.customer || ''), action: 'update', changes });
    await notifyLine(check.status === 'ok'
      ? `✅ สลิปถูกต้อง ยืนยันการโอนอัตโนมัติ\n${value.customer}\n${label} ${check.amount?.toLocaleString('th-TH')} บาท\nจาก ${check.sender}\n${adminUrl()}`
      : `⚠️ ตรวจสลิปไม่ผ่าน: ${SLIP_STATUS_LABEL[check.status]}\n${value.customer}\n${label}\n${check.message}\n${adminUrl()}`);
    return strip(JOBS, row);
  }
  throw conflict();
}

/** Create (or, with revoke: true, replace) the customer's tracking / handover link token. */
async function shareLink(user: SessionUser, args: Args) {
  if (!can(user, 'customers_edit', 'orders_edit')) throw forbid();
  const db = getDb();
  const id = String(args.id || '');
  const [current] = await db.select().from(r).where(and(eq(r.id, id), eq(r.collection, JOBS))).limit(1);
  if (!current) throw new HttpError(404, 'ไม่พบรายการ');
  if (current.value.publicToken && !args.revoke) return strip(JOBS, current);
  const value: Args = { ...current.value, publicToken: newPublicToken() };
  const [row] = await db.update(r).set({ value, updatedAt: new Date() }).where(and(eq(r.id, id), sameVersion(current.updatedAt))).returning();
  if (!row) throw conflict();
  await writeAudit(user, { collection: JOBS, recordId: id, recordLabel: String(value.customer || ''), action: 'update', changes: [{ field: 'ลิงก์ลูกค้า', from: current.value.publicToken ? 'มีลิงก์เดิม' : null, to: args.revoke ? 'สร้างลิงก์ใหม่ (ลิงก์เดิมใช้ไม่ได้)' : 'สร้างลิงก์' }] });
  return strip(JOBS, row);
}

/** Site photos removed from a job are deleted from Blob storage too (only files in our Blob store; never blocks the save). */
async function deleteRemovedPhotos(before: Args, after: Args) {
  const urls = (v: Args) => (Array.isArray(v.sitePhotos) ? v.sitePhotos : []).map((p: Args) => String(p?.url || ''));
  const kept = new Set(urls(after));
  const gone = urls(before).filter((u: string) => u && !kept.has(u) && /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//.test(u));
  if (!gone.length) return;
  try { await del(gone); } catch (e) { await recordError({ message: `Blob delete failed: ${e instanceof Error ? e.message : String(e)}`, source: 'server', url: '/api/actions' }); }
}
