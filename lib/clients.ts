import { and, asc, eq, sql } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { CLIENTS as FALLBACK } from '@/lib/site-data';

export const CLIENTS_COLLECTION = 'bge_clients';
export type ClientItem = { id: string; name: string; logo: string; order: number; status: string };

const r = schema.records;
const toItem = (row: { id: string; value: Record<string, any> }): ClientItem => ({ id: row.id, name: String(row.value.name || ''), logo: String(row.value.logo || ''), order: Number(row.value.order) || 0, status: String(row.value.status || 'แสดง') });

/** Customer logos for the public site. Falls back to the bundled four only if the database is unreachable. */
export async function getPublishedClients(): Promise<ClientItem[]> {
  try {
    const rows = await getDb().select().from(r).where(and(eq(r.collection, CLIENTS_COLLECTION), sql`coalesce(${r.value}->>'status','แสดง') = 'แสดง'`)).orderBy(sql`(${r.value}->>'order')::int`, asc(r.createdAt));
    return rows.map(toItem).filter(c => c.logo);
  } catch (e) {
    console.error('getPublishedClients failed', e);
    return FALLBACK.map((c, i) => ({ id: c.name, name: c.name, logo: c.src, order: i + 1, status: 'แสดง' }));
  }
}
