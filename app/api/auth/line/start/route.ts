import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { authorizeUrl, LINE_STATE_COOKIE, lineLoginConfigured, randomToken } from '@/lib/line-login';

/** Starts LINE Login. mode=login signs in a linked user; mode=link attaches LINE to the signed-in user. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (!lineLoginConfigured()) return NextResponse.redirect(new URL('/admin?line=disabled', url.origin));
  const mode = url.searchParams.get('mode') === 'link' ? 'link' : 'login';
  if (mode === 'link' && !(await getSessionUser())) return NextResponse.redirect(new URL('/admin?line=error', url.origin));
  const state = randomToken(), nonce = randomToken();
  const res = NextResponse.redirect(authorizeUrl(url.origin, state, nonce));
  res.cookies.set(LINE_STATE_COOKIE, JSON.stringify({ state, nonce, mode }), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/auth/line', maxAge: 600 });
  return res;
}
