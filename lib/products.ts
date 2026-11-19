import { and, asc, eq, sql } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { PRODUCTS as SAMPLE } from '@/lib/site-data';

export const PRODUCTS_COLLECTION = 'bge_products';
export type ProductItem = { id: string; title: string; icon: string; points: string[]; note: string; cover: string; gallery: string[]; order: number; status: string; brand: string; model: string; capacity: string; warranty: string; price: string };

const r = schema.records;
const toItem = (row: { id: string; value: Record<string, any> }): ProductItem => ({
  id: row.id, title: String(row.value.title || ''), icon: String(row.value.icon || 'package'),
  points: Array.isArray(row.value.points) ? row.value.points.map(String).filter(Boolean) : [], note: String(row.value.note || ''),
  cover: String(row.value.cover || ''), gallery: Array.isArray(row.value.gallery) ? row.value.gallery.map(String).filter(Boolean) : [],
  order: Number(row.value.order) || 0, status: String(row.value.status || 'แบบร่าง'),
  brand: String(row.value.brand || ''), model: String(row.value.model || ''), capacity: String(row.value.capacity || ''), warranty: String(row.value.warranty || ''), price: String(row.value.price || ''),
});

export async function getPublishedProducts(): Promise<ProductItem[]> {
  try {
    const rows = await getDb().select().from(r).where(and(eq(r.collection, PRODUCTS_COLLECTION), sql`${r.value}->>'status' = 'เผยแพร่'`)).orderBy(sql`(${r.value}->>'order')::int`, asc(r.createdAt));
    return rows.map(toItem);
  } catch (e) {
    console.error('getPublishedProducts failed', e);
    return SAMPLE.map((p, i) => ({ id: p.slug, title: p.title, icon: p.slug === 'panel' ? 'sun' : p.slug === 'inverter' ? 'cpu' : p.slug === 'battery' ? 'battery' : p.slug === 'protection' ? 'shield' : p.slug === 'cable' ? 'cable' : 'bird', points: p.points, note: p.note || '', cover: '', gallery: [], order: i + 1, status: 'เผยแพร่', brand: '', model: '', capacity: '', warranty: '', price: '' }));
  }
}
