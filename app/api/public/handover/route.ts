import { and, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb, schema } from '@/db';
import { writeAudit } from '@/lib/audit';
import { JOBS } from '@/lib/auth';
import { HANDOVER_FROM, jobByToken, type Handover } from '@/lib/customer-link';
import { adminUrl, notifyLine } from '@/lib/notify';

const MAX_SIGNATURE = 150_000; // data URL chars (~110 KB PNG)

/** Customer signs the installation handover from their phone (no login; the job link token is the key). One signature per job. */
export async function POST(req: Request) {
  const b = await req.json().catch(() => null) as { token?: unknown; name?: unknown; signature?: unknown; accept?: unknown } | null;
  const token = String(b?.token || ''), name = String(b?.name || '').trim().slice(0, 120), signature = String(b?.signature || '');
  if (!b?.accept) return NextResponse.json({ error: 'กรุณายืนยันว่าได้รับงานครบถ้วน' }, { status: 400 });
  if (name.length < 2) return NextResponse.json({ error: 'กรุณากรอกชื่อผู้รับมอบงาน' }, { status: 400 });
  if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(signature) || signature.length > MAX_SIGNATURE || signature.length < 500) return NextResponse.json({ error: 'กรุณาเซ็นชื่อในช่องลายเซ็น' }, { status: 400 });

  const row = await jobByToken(token);
  if (!row) return NextResponse.json({ error: 'ลิงก์ไม่ถูกต้องหรือถูกยกเลิกแล้ว' }, { status: 404 });
  if (row.value.handover) return NextResponse.json({ error: 'เอกสารนี้เซ็นรับมอบแล้ว' }, { status: 409 });
  if (!HANDOVER_FROM.includes(row.value.status)) return NextResponse.json({ error: 'ยังไม่ถึงขั้นตอนส่งมอบงาน' }, { status: 400 });

  const handover: Handover = { name, signedAt: new Date().toISOString(), signature, ip: (req.headers.get('x-forwarded-for') || '').split(',')[0].trim().slice(0, 64) };
  const value = { ...row.value, handover };
  // Only if still unsigned and the link wasn't revoked in the meantime.
  const [saved] = await getDb().update(schema.records).set({ value, updatedAt: new Date() })
    .where(and(eq(schema.records.id, row.id), sql`${schema.records.value}->>'publicToken' = ${token}`, sql`${schema.records.value}->'handover' is null`)).returning({ id: schema.records.id });
  if (!saved) return NextResponse.json({ error: 'เอกสารนี้เซ็นรับมอบแล้ว' }, { status: 409 });

  await writeAudit({ id: 'customer', value: { name: `ลูกค้า (${name})` } }, { collection: JOBS, recordId: row.id, recordLabel: String(row.value.customer || ''), action: 'update', changes: [{ field: 'เซ็นรับมอบงาน', from: null, to: name }] });
  await notifyLine(`✍️ ลูกค้าเซ็นรับมอบงานแล้ว\n${row.value.customer}\nผู้เซ็น: ${name}\n${adminUrl()}`);
  return NextResponse.json({ data: { ok: true } });
}
