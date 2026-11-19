import bcrypt from 'bcryptjs';
import { and, asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb, schema } from '@/db';
import { can, COMPANY, getSessionUser, JOBS, type SessionUser, USERS } from '@/lib/auth';

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
  if (collection === COMPANY) return isWrite ? can(user, 'settings_edit') : true;
  return false;
}

async function prepareUserValue(value: Args, existingHash?: string) {
  const next = { ...value };
  if (typeof next.password === 'string' && next.password) next.password = await bcrypt.hash(next.password, 10);
  else next.password = existingHash || '';
  return next;
}
const strip = (collection: string, rec: { id: string; value: Args }) => (collection === USERS ? { id: rec.id, value: { ...rec.value, password: '' } } : { id: rec.id, value: rec.value });

async function run(user: SessionUser, action: string, args: Args) {
  const db = getDb();
  const collection = String(args.collection || '');
  if (!['records.list', 'records.create', 'records.replace', 'records.delete'].includes(action)) throw new HttpError(400, 'unknown action');
  if (!authorize(user, action, collection)) {
    if (action === 'records.list') return { records: [] }; // hide data the user may not see instead of failing the whole screen
    throw forbid();
  }

  if (action === 'records.list') {
    const rows = await db.select().from(r).where(eq(r.collection, collection)).orderBy(asc(r.createdAt));
    return { records: rows.map((x) => strip(collection, x)) };
  }

  if (action === 'records.create') {
    if (!args.value || typeof args.value !== 'object') throw new HttpError(400, 'value required');
    const value = collection === USERS ? await prepareUserValue(args.value) : args.value;
    const key = typeof args.idempotency_key === 'string' ? args.idempotency_key : null;
    const [row] = await db.insert(r).values({ collection, value, idempotencyKey: key }).onConflictDoNothing().returning();
    if (!row) {
      const [existing] = await db.select().from(r).where(eq(r.idempotencyKey, key!)).limit(1);
      return strip(collection, existing);
    }
    return strip(collection, row);
  }

  const id = String(args.id || '');
  const [current] = await db.select().from(r).where(and(eq(r.id, id), eq(r.collection, collection))).limit(1);
  if (!current) throw new HttpError(404, 'ไม่พบรายการ');

  if (action === 'records.replace') {
    if (!args.value || typeof args.value !== 'object') throw new HttpError(400, 'value required');
    const value = collection === USERS ? await prepareUserValue(args.value, current.value.password) : args.value;
    const [row] = await db.update(r).set({ value, updatedAt: new Date() }).where(eq(r.id, id)).returning();
    return strip(collection, row);
  }

  // records.delete
  if (collection === USERS && id === user.id) throw new HttpError(400, 'ไม่สามารถลบบัญชีของตัวเองได้');
  await db.delete(r).where(eq(r.id, id));
  return { ok: true };
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  try {
    const { action, args } = await req.json();
    const data = await run(user, String(action), (args && typeof args === 'object' ? args : {}) as Args);
    return NextResponse.json({ data });
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('actions failed', e);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' }, { status: 500 });
  }
}
