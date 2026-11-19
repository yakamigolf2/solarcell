import { NextResponse } from 'next/server';
import { getSessionUser, publicUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const u = await getSessionUser();
  return NextResponse.json({ data: { user: u ? publicUser(u) : null } });
}
