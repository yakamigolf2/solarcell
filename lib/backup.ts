import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { gunzipSync, gzipSync } from 'node:zlib';
import { del, list, put } from '@vercel/blob';
import { asc } from 'drizzle-orm';
import { getDb, schema } from '@/db';

/**
 * Daily backup of the whole records table: JSON -> gzip -> AES-256-GCM (BACKUP_KEY) -> Vercel Blob under backups/.
 * Blob URLs are public, so the file is useless without the key. Keeps 30 days.
 */
const MAGIC = Buffer.from('BGEBK1');
const KEEP_DAYS = 30;
export const BACKUP_PREFIX = 'backups/';

function key() {
  const k = Buffer.from(process.env.BACKUP_KEY || '', 'base64');
  if (k.length !== 32) throw new Error('BACKUP_KEY is not set (32 bytes, base64)');
  return k;
}

export function encryptBackup(plain: Buffer, k = key()) {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', k, iv);
  const body = Buffer.concat([c.update(gzipSync(plain)), c.final()]);
  return Buffer.concat([MAGIC, iv, c.getAuthTag(), body]);
}

export function decryptBackup(file: Buffer, k = key()) {
  if (!file.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error('not a BGE backup file');
  const iv = file.subarray(6, 18), tag = file.subarray(18, 34), body = file.subarray(34);
  const d = createDecipheriv('aes-256-gcm', k, iv);
  d.setAuthTag(tag);
  return gunzipSync(Buffer.concat([d.update(body), d.final()]));
}

export async function runBackup() {
  const k = key();
  const rows = await getDb().select().from(schema.records).orderBy(asc(schema.records.createdAt));
  const createdAt = new Date().toISOString();
  const payload = Buffer.from(JSON.stringify({ version: 1, createdAt, count: rows.length, rows }));
  const file = encryptBackup(payload, k);
  const blob = await put(`${BACKUP_PREFIX}solarcell-${createdAt.slice(0, 10)}.bin`, file, { access: 'public', addRandomSuffix: true, contentType: 'application/octet-stream' });
  const pruned = await pruneBackups();
  return { pathname: blob.pathname, url: blob.url, bytes: file.length, rows: rows.length, createdAt, pruned };
}

export async function listBackups() {
  const out: { pathname: string; url: string; size: number; uploadedAt: string }[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: BACKUP_PREFIX, cursor, limit: 1000 });
    out.push(...page.blobs.map((b) => ({ pathname: b.pathname, url: b.url, size: b.size, uploadedAt: new Date(b.uploadedAt).toISOString() })));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

async function pruneBackups() {
  const all = await listBackups();
  const cutoff = Date.now() - KEEP_DAYS * 24 * 3600_000;
  const old = all.slice(7).filter((b) => new Date(b.uploadedAt).getTime() < cutoff); // always keep the newest 7
  if (old.length) await del(old.map((b) => b.url));
  return old.length;
}
