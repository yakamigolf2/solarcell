import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb, schema } from '@/db';
import { findUserByUsername, publicUser, startSession } from '@/lib/auth';

const BAD = 'Username หรือ Password ไม่ถูกต้อง';
// Hash compared when the user does not exist, so response time doesn't reveal valid usernames.
const DUMMY = bcrypt.hashSync('not-a-real-password', 10);

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json().catch(() => ({}));
    if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) return NextResponse.json({ error: 'กรุณากรอก Username และ Password' }, { status: 400 });
    const row = await findUserByUsername(username.trim());
    const ok = await bcrypt.compare(password, row?.value.password || DUMMY);
    if (!row || !ok) return NextResponse.json({ error: BAD }, { status: 401 });
    if (row.value.status !== 'ใช้งาน') return NextResponse.json({ error: 'บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ' }, { status: 403 });
    const now = new Date();
    const stamp = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const value = { ...row.value, lastLogin: stamp };
    await getDb().update(schema.records).set({ value, updatedAt: now }).where(eq(schema.records.id, row.id));
    await startSession(row.id);
    return NextResponse.json({ data: { user: publicUser({ id: row.id, value }) } });
  } catch (e) {
    console.error('login failed', e);
    return NextResponse.json({ error: 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง' }, { status: 500 });
  }
}
