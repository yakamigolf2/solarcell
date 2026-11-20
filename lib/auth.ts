import { and, eq, sql } from 'drizzle-orm';
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { getDb, schema } from '@/db';

export const USERS = 'solarpro_users';
export const JOBS = 'solarpro_jobs';
export const COMPANY = 'bge_company_settings';
const COOKIE = 'sid';
const MAX_AGE = 60 * 60 * 24 * 7;
export const MIN_PASSWORD = 8;
export const MAX_LOGIN_FAILS = 5;
export const LOCK_MINUTES = 15;

/** Tail of the bcrypt hash: changing a password changes it, which ends every session issued before. */
const pwVersion = (hash: unknown) => String(hash || '').slice(-12);

export type SessionUser = { id: string; value: Record<string, any> };

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error('AUTH_SECRET is not set (min 16 chars)');
  return new TextEncoder().encode(s);
}

export async function startSession(userId: string, passwordHash: string) {
  const token = await new SignJWT({ pv: pwVersion(passwordHash) }).setProtectedHeader({ alg: 'HS256' }).setSubject(userId).setIssuedAt().setExpirationTime(`${MAX_AGE}s`).sign(secret());
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: MAX_AGE });
}
export async function endSession() { (await cookies()).delete(COOKIE); }

/** Current user, re-read from the DB on every request so disabled users / changed permissions apply immediately. */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const token = (await cookies()).get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    const rows = await getDb().select().from(schema.records).where(and(eq(schema.records.id, payload.sub), eq(schema.records.collection, USERS))).limit(1);
    const u = rows[0];
    if (!u || u.value.status !== 'ใช้งาน') return null;
    if (payload.pv !== pwVersion(u.value.password)) return null;
    return { id: u.id, value: u.value };
  } catch { return null; }
}

export function can(user: SessionUser, ...keys: string[]) {
  // Permissions added after a user was created (news_manage) default to the role's rule: Admin only.
  return keys.some((k) => user.value.permissions?.[k] ?? ((k === 'news_manage' || k === 'projects_manage' || k === 'products_manage' || k === 'clients_manage') && user.value.role === 'Admin'));
}

export function publicUser(u: SessionUser) {
  const { loginFails: _f, lockedUntil: _l, ...value } = u.value;
  return { id: u.id, value: { ...value, password: '' } };
}

export async function findUserByUsername(username: string) {
  const rows = await getDb().select().from(schema.records).where(and(eq(schema.records.collection, USERS), sql`lower(${schema.records.value}->>'username') = ${username.toLowerCase()}`)).limit(1);
  return rows[0] || null;
}
