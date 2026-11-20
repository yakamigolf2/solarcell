import { randomBytes } from 'node:crypto';

/**
 * LINE Login (OAuth 2.1 / OpenID Connect) for staff. Only LINE accounts already linked to a staff user can sign in;
 * nobody can create an account through LINE.
 */
export const LINE_STATE_COOKIE = 'line_oauth';

export function lineLoginConfigured() {
  return !!(process.env.LINE_LOGIN_CHANNEL_ID && process.env.LINE_LOGIN_CHANNEL_SECRET);
}

export const callbackUrl = (origin: string) => `${process.env.APP_URL || origin}/api/auth/line/callback`;

export function authorizeUrl(origin: string, state: string, nonce: string) {
  const q = new URLSearchParams({
    response_type: 'code', client_id: process.env.LINE_LOGIN_CHANNEL_ID || '', redirect_uri: callbackUrl(origin),
    state, nonce, scope: 'openid profile', bot_prompt: 'normal',
  });
  return `https://access.line.me/oauth2/v2.1/authorize?${q}`;
}

export const randomToken = () => randomBytes(24).toString('base64url');

export type LineProfile = { sub: string; name: string; picture: string };

/** Exchange the code, then let LINE verify the ID token (signature, audience, expiry, nonce). */
export async function lineProfileFromCode(code: string, origin: string, nonce: string): Promise<LineProfile> {
  const id = process.env.LINE_LOGIN_CHANNEL_ID || '', secret = process.env.LINE_LOGIN_CHANNEL_SECRET || '';
  const tok = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: AbortSignal.timeout(8000),
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: callbackUrl(origin), client_id: id, client_secret: secret }),
  });
  if (!tok.ok) throw new Error(`LINE token ${tok.status}`);
  const { id_token } = await tok.json();
  const ver = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: AbortSignal.timeout(8000),
    body: new URLSearchParams({ id_token, client_id: id, nonce }),
  });
  if (!ver.ok) throw new Error(`LINE verify ${ver.status}`);
  const p = await ver.json();
  if (!p.sub) throw new Error('LINE verify: no subject');
  return { sub: String(p.sub), name: String(p.name || ''), picture: String(p.picture || '') };
}
