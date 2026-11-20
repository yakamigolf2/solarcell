import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb, schema } from '@/db';
import { writeAudit } from '@/lib/audit';
import { getSessionUser, USERS } from '@/lib/auth';

/** Removes the LINE link from the signed-in user. */
export async function POST() {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  const { lineUserId: _id, lineName, linePicture: _pic, ...value } = me.value;
  await getDb().update(schema.records).set({ value, updatedAt: new Date() }).where(eq(schema.records.id, me.id));
  await writeAudit(me, { collection: USERS, recordId: me.id, recordLabel: String(me.value.username), action: 'update', changes: [{ field: 'บัญชี LINE', from: lineName || 'เชื่อมแล้ว', to: null }] });
  return NextResponse.json({ data: { ok: true } });
}
