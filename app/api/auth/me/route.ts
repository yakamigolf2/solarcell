import { NextResponse } from 'next/server';
import { getSessionUser, publicUser } from '@/lib/auth';
import { lineLoginConfigured } from '@/lib/line-login';
import { slipOkConfigured } from '@/lib/slipok';

export const dynamic = 'force-dynamic';

export async function GET() {
  const u = await getSessionUser();
  return NextResponse.json({ data: { user: u ? publicUser(u) : null, lineLogin: lineLoginConfigured(), slipOk: slipOkConfigured() } });
}
