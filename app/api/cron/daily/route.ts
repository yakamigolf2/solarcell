import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { JOBS } from '@/lib/auth';
import { runBackup } from '@/lib/backup';
import { recordError } from '@/lib/errors';
import { adminUrl, notifyLine } from '@/lib/notify';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Bangkok date (YYYY-MM-DD) `days` from today. */
const bkkDate = (days = 0) => new Date(Date.now() + 7 * 3600_000 + days * 24 * 3600_000).toISOString().slice(0, 10);

/** Vercel Cron, 08:00 Bangkok: encrypted backup + LINE reminder of tomorrow's appointments. Vercel sends CRON_SECRET as a Bearer token. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const report: Record<string, unknown> = {};
  try {
    const b = await runBackup();
    report.backup = { ok: true, rows: b.rows, bytes: b.bytes, pruned: b.pruned };
  } catch (e) {
    report.backup = { ok: false };
    await recordError({ message: `Daily backup failed: ${e instanceof Error ? e.message : String(e)}`, stack: e instanceof Error ? e.stack : '', source: 'server', url: '/api/cron/daily' });
  }

  try {
    const tomorrow = bkkDate(1);
    const rows = await getDb().select().from(schema.records).where(eq(schema.records.collection, JOBS));
    const appts = rows.map((r) => r.value).filter((v) => v.nextAppt === tomorrow);
    report.appointments = appts.length;
    if (appts.length) {
      const lines = appts.map((v, i) => `${i + 1}. ${v.customer} ${v.phone || ''}\n   ${v.status} • ${String(v.address || '').slice(0, 60)}`);
      await notifyLine(`📅 นัดหมายพรุ่งนี้ (${tomorrow}) ${appts.length} งาน\n${lines.join('\n')}\n${adminUrl()}`);
    }
  } catch (e) {
    await recordError({ message: `Appointment reminder failed: ${e instanceof Error ? e.message : String(e)}`, source: 'server', url: '/api/cron/daily' });
  }
  return NextResponse.json({ data: report });
}
