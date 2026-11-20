import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { recordError } from '@/lib/errors';

/** Browser error reports (window errors, unhandled rejections, errors caught by safe()). Size-capped and deduplicated in recordError. */
export async function POST(req: Request) {
  const text = await req.text().catch(() => '');
  if (!text || text.length > 8000) return new NextResponse(null, { status: 204 });
  let body: Record<string, unknown> = {};
  try { body = JSON.parse(text); } catch { return new NextResponse(null, { status: 204 }); }
  const user = await getSessionUser();
  await recordError({ message: body.message, stack: body.stack, url: body.url, source: 'client', user: user?.value.username || '' });
  return new NextResponse(null, { status: 204 });
}
