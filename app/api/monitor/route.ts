import { list } from '@vercel/blob';
import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getSessionUser } from '@/lib/auth';
import { listBackups } from '@/lib/backup';
import { ERRORS, type ErrorEntry } from '@/lib/errors';
import { lineConfigured } from '@/lib/notify';
import { slipOkConfigured, slipOkQuota } from '@/lib/slipok';

export const dynamic = 'force-dynamic';

const GB = 1024 ** 3;
// Plan limits; override in Vercel env when the plan changes. Defaults: Neon Free + Vercel Blob Hobby.
const num = (v: string | undefined, d: number) => (Number(v) > 0 ? Number(v) : d);
const LIMITS = {
  dbBytes: num(process.env.MONITOR_DB_LIMIT_GB, 0.5) * GB,
  computeHours: num(process.env.MONITOR_COMPUTE_LIMIT_HOURS, 100),
  blobBytes: num(process.env.MONITOR_BLOB_LIMIT_GB, 1) * GB,
};

async function database() {
  const db = getDb();
  const [size] = (await db.execute(sql`select pg_database_size(current_database())::bigint as bytes`)).rows as any[];
  const tables = (await db.execute(sql`select collection, count(*)::int as rows, coalesce(sum(pg_column_size(value)),0)::bigint as bytes from records group by collection order by 3 desc`)).rows as any[];
  const [conn] = (await db.execute(sql`select count(*)::int as n from pg_stat_activity where datname = current_database()`)).rows as any[];
  const [cache] = (await db.execute(sql`select round(100.0 * sum(blks_hit) / nullif(sum(blks_hit) + sum(blks_read), 0), 1)::float as pct from pg_stat_database where datname = current_database()`)).rows as any[];
  return {
    bytes: Number(size.bytes), limitBytes: LIMITS.dbBytes, connections: conn.n, cacheHitPct: cache.pct,
    collections: tables.map((t) => ({ name: t.collection, rows: t.rows, bytes: Number(t.bytes) })),
  };
}

/** CPU / compute usage needs the Neon API (Postgres itself can't see the compute's CPU). */
async function compute() {
  const key = process.env.NEON_API_KEY, project = process.env.NEON_PROJECT_ID;
  if (!key || !project) return { available: false as const, reason: 'ยังไม่ได้ตั้งค่า NEON_API_KEY ใน Vercel' };
  const res = await fetch(`https://console.neon.tech/api/v2/projects/${project}`, { headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(8000) });
  if (!res.ok) return { available: false as const, reason: `Neon API ตอบกลับ ${res.status}` };
  const p = (await res.json()).project;
  return {
    available: true as const,
    cpuSeconds: Number(p.cpu_used_sec) || 0,
    computeHours: (Number(p.compute_time_seconds) || 0) / 3600,
    activeHours: (Number(p.active_time_seconds) || 0) / 3600,
    limitHours: LIMITS.computeHours,
    storageBytes: Number(p.synthetic_storage_size) || null,
    periodStart: p.consumption_period_start || null,
    periodEnd: p.consumption_period_end || null,
  };
}

async function blob() {
  const byFolder: Record<string, { files: number; bytes: number }> = {};
  let bytes = 0, files = 0, cursor: string | undefined;
  do {
    const page = await list({ cursor, limit: 1000 });
    for (const b of page.blobs) {
      bytes += b.size; files += 1;
      const folder = b.pathname.includes('/') ? b.pathname.split('/')[0] : '(root)';
      byFolder[folder] = { files: (byFolder[folder]?.files || 0) + 1, bytes: (byFolder[folder]?.bytes || 0) + b.size };
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return { bytes, files, limitBytes: LIMITS.blobBytes, folders: Object.entries(byFolder).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.bytes - a.bytes) };
}

async function errors() {
  const rows = (await getDb().execute(sql`select value from records where collection = ${ERRORS} order by updated_at desc limit 30`)).rows as { value: ErrorEntry }[];
  const [{ n }] = (await getDb().execute(sql`select coalesce(sum((value->>'count')::int), 0)::int as n from records where collection = ${ERRORS} and updated_at > now() - interval '24 hours'`)).rows as { n: number }[];
  return { last24h: n, items: rows.map((r) => r.value) };
}

async function backups() {
  const all = await listBackups();
  return {
    configured: !!process.env.BACKUP_KEY, cron: !!process.env.CRON_SECRET, line: lineConfigured(),
    slipOk: slipOkConfigured(), slipOkQuota: await slipOkQuota(),
    count: all.length, latest: all[0] ? { at: all[0].uploadedAt, size: all[0].size } : null,
    items: all.slice(0, 10).map((b) => ({ at: b.uploadedAt, size: b.size, pathname: b.pathname })),
  };
}

const settle = async <T,>(f: () => Promise<T>) => { try { return { ok: true as const, data: await f() }; } catch (e) { console.error('monitor', e); return { ok: false as const, error: 'ดึงข้อมูลไม่สำเร็จ' }; } };

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.value.role !== 'Admin') return NextResponse.json({ error: 'เฉพาะผู้ดูแลระบบ' }, { status: 403 });
  const [db, cpu, files, errs, bk] = await Promise.all([settle(database), settle(compute), settle(blob), settle(errors), settle(backups)]);
  return NextResponse.json({ data: { checkedAt: new Date().toISOString(), db, cpu, blob: files, errors: errs, backups: bk } });
}
