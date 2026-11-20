import { and, eq, gt, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb, schema } from '@/db';
import { JOBS } from '@/lib/auth';
import { recordError } from '@/lib/errors';
import { adminUrl, notifyLine } from '@/lib/notify';

const r = schema.records;
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max) : '');

/** Public "Request a quote" form -> creates a new lead (status ลีดใหม่) visible in the backoffice. No auth by design. */
export async function POST(req: Request) {
  try {
    const b = await req.json().catch(() => null);
    if (!b || typeof b !== 'object') return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
    if (clean(b.website, 50)) return NextResponse.json({ data: { ok: true } }); // honeypot: pretend success to bots
    const name = clean(b.name, 120), phone = clean(b.phone, 30);
    if (name.length < 2 || !/^[0-9+\-\s()]{8,20}$/.test(phone)) return NextResponse.json({ error: 'กรุณากรอกชื่อและเบอร์โทรให้ถูกต้อง' }, { status: 400 });

    // Crude global flood guard: at most 30 website leads per 10 minutes.
    const since = new Date(Date.now() - 10 * 60 * 1000);
    const recent = await getDb().select({ n: sql<number>`count(*)::int` }).from(r).where(and(eq(r.collection, JOBS), gt(r.createdAt, since), sql`${r.value}->>'source' = 'website'`));
    if ((recent[0]?.n ?? 0) >= 30) return NextResponse.json({ error: 'ระบบมีผู้ใช้งานจำนวนมาก กรุณาลองใหม่อีกครั้งในอีกสักครู่' }, { status: 429 });

    const bill = Math.max(0, Math.min(10_000_000, Number(b.bill) || 0));
    const note = clean(b.note, 1000);
    const value = {
      source: 'website', leadSource: 'เว็บไซต์', customer: name, phone, line: clean(b.line, 60), address: clean(b.address, 300), building: clean(b.building, 60) || 'บ้าน', bill,
      items: [], labor: 0, discount: 0, contacts: [], noteHistory: [], sitePhotos: [], status: 'ลีดใหม่', created: new Date().toISOString().slice(0, 10), customerNote: note ? `[จากเว็บไซต์] ${note}` : '[จากเว็บไซต์] ขอใบเสนอราคา',
    };
    await getDb().insert(r).values({ collection: JOBS, value });
    await notifyLine(`🆕 ลีดใหม่จากเว็บไซต์\n${name} ${phone}\n${value.address || ''}\nค่าไฟ ${bill.toLocaleString('th-TH')} บาท/เดือน\n${note ? note.slice(0, 200) + '\n' : ''}${adminUrl()}`);
    return NextResponse.json({ data: { ok: true } });
  } catch (e) {
    console.error('public quote failed', e);
    await recordError({ message: e instanceof Error ? e.message : String(e), stack: e instanceof Error ? e.stack : '', source: 'server', url: '/api/public/quote' });
    return NextResponse.json({ error: 'ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่' }, { status: 500 });
  }
}
