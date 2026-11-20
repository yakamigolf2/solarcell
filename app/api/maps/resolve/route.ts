import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { isShortMapLink } from '@/lib/maps';

/** Expands a maps.app.goo.gl short link to the full Google Maps URL. Only follows redirects on Google hosts, never fetches the final page. */
export async function GET(req: Request) {
  if (!(await getSessionUser())) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  let url = new URL(req.url).searchParams.get('url') || '';
  if (!isShortMapLink(url)) return NextResponse.json({ error: 'ไม่ใช่ลิงก์ย่อ Google Maps' }, { status: 400 });
  for (let hop = 0; hop < 5 && isShortMapLink(url); hop++) {
    const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(5000) }).catch(() => null);
    const next = res?.headers.get('location');
    if (!next) break;
    const target = new URL(next, url);
    if (target.protocol !== 'https:') break;
    url = target.href;
  }
  if (isShortMapLink(url)) return NextResponse.json({ error: 'เปิดลิงก์ไม่สำเร็จ' }, { status: 502 });
  return NextResponse.json({ data: { url } });
}
