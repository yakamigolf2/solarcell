import { and, eq, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getDb, schema } from '@/db';
import { writeAudit } from '@/lib/audit';
import { getSessionUser, startSession, USERS } from '@/lib/auth';
import { recordError } from '@/lib/errors';
import { LINE_STATE_COOKIE, lineProfileFromCode } from '@/lib/line-login';

const r = schema.records;

/** LINE redirects here. Outcome is reported to the admin page as ?line=<result>. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const back = (result: string) => {
    const res = NextResponse.redirect(new URL(`/admin?line=${result}`, url.origin));
    res.cookies.delete({ name: LINE_STATE_COOKIE, path: '/api/auth/line' });
    return res;
  };

  let saved: { state?: string; nonce?: string; mode?: string } = {};
  try { saved = JSON.parse((await cookies()).get(LINE_STATE_COOKIE)?.value || '{}'); } catch { /* treated as missing */ }
  const state = url.searchParams.get('state'), code = url.searchParams.get('code');
  if (url.searchParams.get('error')) return back('cancelled');
  if (!code || !state || !saved.state || state !== saved.state || !saved.nonce) return back('error');

  try {
    const profile = await lineProfileFromCode(code, url.origin, saved.nonce);
    const db = getDb();
    const [owner] = await db.select().from(r).where(and(eq(r.collection, USERS), sql`${r.value}->>'lineUserId' = ${profile.sub}`)).limit(1);

    if (saved.mode === 'link') {
      const me = await getSessionUser();
      if (!me) return back('error');
      if (owner && owner.id !== me.id) return back('taken');
      const value = { ...me.value, lineUserId: profile.sub, lineName: profile.name, linePicture: profile.picture };
      await db.update(r).set({ value, updatedAt: new Date() }).where(eq(r.id, me.id));
      await writeAudit(me, { collection: USERS, recordId: me.id, recordLabel: String(me.value.username), action: 'update', changes: [{ field: 'บัญชี LINE', from: null, to: profile.name || 'เชื่อมแล้ว' }] });
      return back('linked');
    }

    if (!owner) return back('notlinked');
    if (owner.value.status !== 'ใช้งาน') return back('disabled-user');
    const now = new Date();
    const stamp = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    await db.update(r).set({ value: { ...owner.value, lastLogin: stamp, lineName: profile.name, linePicture: profile.picture }, updatedAt: now }).where(eq(r.id, owner.id));
    await startSession(owner.id, owner.value.password);
    return back('ok');
  } catch (e) {
    await recordError({ message: `LINE login failed: ${e instanceof Error ? e.message : String(e)}`, source: 'server', url: '/api/auth/line/callback' });
    return back('error');
  }
}
