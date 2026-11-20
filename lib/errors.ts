import { and, eq, gt, sql } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { adminUrl, notifyLine } from '@/lib/notify';

/** Error log stored in the records table: one row per distinct error per day, with a repeat counter. */
export const ERRORS = 'bge_errors';
const DAILY_CAP = 300;

export type ErrorEntry = { fingerprint: string; message: string; stack: string; source: 'client' | 'server'; url: string; user: string; firstAt: string; lastAt: string; count: number };

const clip = (v: unknown, max: number) => String(v ?? '').slice(0, max);

export function fingerprintOf(message: string, stack: string) {
  const top = stack.split('\n').find((l) => l.includes('at ') || l.includes('@')) || '';
  const s = `${message}|${top.replace(/:\d+:\d+/g, '')}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `e${(h >>> 0).toString(36)}`;
}

/** Records an error; a new kind of error (first time today) also pings LINE. Never throws. */
export async function recordError(input: { message: unknown; stack?: unknown; source: 'client' | 'server'; url?: unknown; user?: unknown }) {
  try {
    const db = getDb();
    const r = schema.records;
    const message = clip(input.message, 500) || 'Unknown error';
    const stack = clip(input.stack, 3000);
    const fp = fingerprintOf(message, stack);
    const since = new Date(Date.now() - 24 * 3600_000);
    const now = new Date().toISOString();
    const bumped = await db.update(r)
      .set({ value: sql`jsonb_set(jsonb_set(${r.value}, '{count}', to_jsonb((${r.value}->>'count')::int + 1)), '{lastAt}', to_jsonb(${now}::text))`, updatedAt: new Date() })
      .where(and(eq(r.collection, ERRORS), gt(r.createdAt, since), sql`${r.value}->>'fingerprint' = ${fp}`))
      .returning({ id: r.id });
    if (bumped.length) return;
    const [{ n }] = (await db.execute(sql`select count(*)::int as n from records where collection = ${ERRORS} and created_at > ${since}`)).rows as { n: number }[];
    if (n >= DAILY_CAP) return;
    const value: ErrorEntry = { fingerprint: fp, message, stack, source: input.source, url: clip(input.url, 300), user: clip(input.user, 100), firstAt: now, lastAt: now, count: 1 };
    await db.insert(r).values({ collection: ERRORS, value });
    await notifyLine(`⚠️ ระบบพบข้อผิดพลาดใหม่ (${input.source})\n${message}\n${value.url}\nดูรายละเอียด: ${adminUrl()} → การใช้งานระบบ`);
  } catch (e) {
    console.error('recordError failed', e);
  }
}
