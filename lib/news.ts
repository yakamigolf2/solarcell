import { and, desc, eq, sql } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { NEWS as SAMPLE } from '@/lib/site-data';

export const NEWS_COLLECTION = 'bge_news';
export type Block = { type: 'heading'; text: string } | { type: 'text'; text: string } | { type: 'image'; url: string; caption: string } | { type: 'video'; url: string };
export type NewsItem = { id: string; title: string; tag: string; summary: string; body: string; blocks: Block[]; date: string; cover: string; status: string };

function cleanBlocks(v: unknown): Block[] {
  if (!Array.isArray(v)) return [];
  const out: Block[] = [];
  for (const b of v) {
    if (!b || typeof b !== 'object') continue;
    const t = (b as any).type;
    if ((t === 'heading' || t === 'text') && typeof (b as any).text === 'string' && (b as any).text.trim()) out.push({ type: t as 'heading' | 'text', text: (b as any).text });
    else if (t === 'image' && typeof (b as any).url === 'string' && /^https:\/\//.test((b as any).url)) out.push({ type: 'image', url: (b as any).url, caption: String((b as any).caption || '') });
    else if (t === 'video' && typeof (b as any).url === 'string' && (b as any).url) out.push({ type: 'video', url: (b as any).url });
  }
  return out;
}

const r = schema.records;
const toItem = (row: { id: string; value: Record<string, any> }): NewsItem => ({
  id: row.id, title: String(row.value.title || ''), tag: String(row.value.tag || ''), summary: String(row.value.summary || ''),
  body: String(row.value.body || ''), blocks: cleanBlocks(row.value.blocks), date: String(row.value.date || ''), cover: String(row.value.cover || ''), status: String(row.value.status || 'แบบร่าง'),
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
    return SAMPLE.map(n => ({ id: n.id, title: n.title, tag: n.tag, summary: n.text, body: n.text, blocks: [], date: '', cover: '', status: 'เผยแพร่' }));
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
