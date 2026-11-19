import { and, desc, eq, sql } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { PROJECT_TYPES, PROJECTS as SAMPLE } from '@/lib/site-data';

export const PROJECTS_COLLECTION = 'bge_projects';
export { PROJECT_TYPES };
export type ProjectItem = { id: string; title: string; place: string; type: string; kw: number; text: string; cover: string; status: string; panelBrand: string; inverterBrand: string };

const r = schema.records;
const toItem = (row: { id: string; value: Record<string, any> }): ProjectItem => ({
  id: row.id, title: String(row.value.title || ''), place: String(row.value.place || ''), type: String(row.value.type || ''),
  kw: Number(row.value.kw) || 0, text: String(row.value.text || ''), cover: String(row.value.cover || ''), status: String(row.value.status || 'แบบร่าง'), panelBrand: String(row.value.panelBrand || ''), inverterBrand: String(row.value.inverterBrand || ''),
});

const HUES = ['from-sky-300 to-blue-500', 'from-emerald-300 to-teal-500', 'from-indigo-300 to-violet-500', 'from-cyan-300 to-sky-500', 'from-amber-300 to-orange-500', 'from-fuchsia-300 to-purple-500'];
export const hueFor = (id: string) => HUES[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length];

export async function getPublishedProjects(limit?: number): Promise<ProjectItem[]> {
  try {
    const q = getDb().select().from(r).where(and(eq(r.collection, PROJECTS_COLLECTION), sql`${r.value}->>'status' = 'เผยแพร่'`)).orderBy(desc(r.createdAt));
    const rows = await (limit ? q.limit(limit) : q);
    return rows.map(toItem);
  } catch (e) {
    console.error('getPublishedProjects failed', e);
    const list = SAMPLE.map(p => ({ id: p.id, title: p.title, place: p.place, type: p.type, kw: p.kw, text: p.text, cover: '', status: 'เผยแพร่', panelBrand: '', inverterBrand: '' }));
    return limit ? list.slice(0, limit) : list;
  }
}
