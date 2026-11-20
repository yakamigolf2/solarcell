import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb, schema } from '@/db';
import { getSessionUser, MIN_PASSWORD, startSession } from '@/lib/auth';

export async function POST(req: Request) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  const { current, next } = await req.json().catch(() => ({}));
  if (typeof current !== 'string' || typeof next !== 'string') return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
  if (next.length < MIN_PASSWORD) return NextResponse.json({ error: `รหัสผ่านใหม่ต้องมีอย่างน้อย ${MIN_PASSWORD} ตัวอักษร` }, { status: 400 });
  if (!(await bcrypt.compare(current, me.value.password || ''))) return NextResponse.json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 400 });
  const value = { ...me.value, password: await bcrypt.hash(next, 10) };
  await getDb().update(schema.records).set({ value, updatedAt: new Date() }).where(eq(schema.records.id, me.id));
  await startSession(me.id, value.password); // old sessions (other devices) end; this one continues
  return NextResponse.json({ data: { ok: true } });
}
