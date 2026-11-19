import { and, desc, eq, sql } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { NEWS as SAMPLE } from '@/lib/site-data';

export const NEWS_COLLECTION = 'bge_news';
export type NewsItem = { id: string; title: string; tag: string; summary: string; body: string; date: string; cover: string; status: string };

const r = schema.records;
const toItem = (row: { id: string; value: Record<string, any> }): NewsItem => ({
  id: row.id, title: String(row.value.title || ''), tag: String(row.value.tag || ''), summary: String(row.value.summary || ''),
  body: String(row.value.body || ''), date: String(row.value.date || ''), cover: String(row.value.cover || ''), status: String(row.value.status || 'แบบร่าง'),
});

export const fmtThaiDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** Published news for the public site, newest first. Falls back to the bundled samples only if the DB is unreachable. */
export async function getPublishedNews(limit?: number): Promise<NewsItem[]> {
  try {
    const q = getDb().select().from(r).where(and(eq(r.collection, NEWS_COLLECTION), sql`${r.value}->>'status' = 'เผยแพร่'`)).orderBy(sql`${r.value}->>'date' desc`, desc(r.createdAt));
    const rows = await (limit ? q.limit(limit) : q);
    return rows.map(toItem);
  } catch (e) {
    console.error('getPublishedNews failed', e);
    return SAMPLE.map(n => ({ id: n.id, title: n.title, tag: n.tag, summary: n.text, body: n.text, date: '', cover: '', status: 'เผยแพร่' }));
  }
}

export async function getPublishedNewsItem(id: string): Promise<NewsItem | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  try {
    const rows = await getDb().select().from(r).where(and(eq(r.id, id), eq(r.collection, NEWS_COLLECTION))).limit(1);
    const item = rows[0] ? toItem(rows[0]) : null;
    return item && item.status === 'เผยแพร่' ? item : null;
  } catch { return null; }
}
