import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { decryptBackup, listBackups, runBackup } from '@/lib/backup';

export const maxDuration = 60;

const adminOnly = async () => {
  const user = await getSessionUser();
  return user && user.value.role === 'Admin' ? user : null;
};

/** "Back up now" button on the monitor page (Admin only). */
export async function POST() {
  if (!(await adminOnly())) return NextResponse.json({ error: 'เฉพาะผู้ดูแลระบบ' }, { status: 403 });
  try {
    const b = await runBackup();
    return NextResponse.json({ data: { rows: b.rows, bytes: b.bytes, createdAt: b.createdAt, pathname: b.pathname } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'สำรองข้อมูลไม่สำเร็จ' }, { status: 500 });
  }
}

/**
 * Download a backup already decrypted (Admin only), as JSON for scripts/backup-restore.ts.
 * BACKUP_KEY is stored as a Vercel secret and cannot be read back, so restoring goes through here, not through the key.
 */
export async function GET(req: Request) {
  if (!(await adminOnly())) return NextResponse.json({ error: 'เฉพาะผู้ดูแลระบบ' }, { status: 403 });
  const pathname = new URL(req.url).searchParams.get('pathname') || '';
  const found = (await listBackups()).find((b) => b.pathname === pathname);
  if (!found) return NextResponse.json({ error: 'ไม่พบไฟล์สำรอง' }, { status: 404 });
  const file = Buffer.from(await (await fetch(found.url)).arrayBuffer());
  const json = decryptBackup(file);
  const name = pathname.split('/').pop()!.replace(/\.bin$/, '.json');
  return new NextResponse(new Uint8Array(json), { headers: { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="${name}"`, 'Cache-Control': 'no-store' } });
}
