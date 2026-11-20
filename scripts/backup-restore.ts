// Decrypt a daily backup and optionally load it into a database.
//
//   bun scripts/backup-restore.ts <file.json>     -> a decrypted backup downloaded from the monitor page (no key needed)
//   BACKUP_KEY=... bun scripts/backup-restore.ts <backup URL or .bin file>        -> writes the decrypted JSON to your temp folder, prints counts
//   BACKUP_KEY=... DATABASE_URL=<target> bun scripts/backup-restore.ts <src> --apply   -> upserts every record into DATABASE_URL
//
// Restore into a NEW Neon branch first (Neon console -> Branches -> Create), check the data, then point the app at it or copy back.
import { writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { neon } from '@neondatabase/serverless';
import { decryptBackup } from '../lib/backup';

const src = process.argv[2];
const apply = process.argv.includes('--apply');
if (!src) throw new Error('usage: bun scripts/backup-restore.ts <backup URL or file> [--apply]');

const file = /^https?:\/\//.test(src) ? Buffer.from(await (await fetch(src)).arrayBuffer()) : await readFile(src);
const plain = file.subarray(0, 1).toString() === '{' ? file : decryptBackup(file);
const data = JSON.parse(plain.toString('utf8')) as { createdAt: string; count: number; rows: { id: string; collection: string; value: unknown; idempotencyKey: string | null; createdAt: string; updatedAt: string }[] };

const byCollection: Record<string, number> = {};
for (const r of data.rows) byCollection[r.collection] = (byCollection[r.collection] || 0) + 1;
console.log(`backup from ${data.createdAt}: ${data.count} records`, byCollection);

const out = join(tmpdir(), `solarcell-backup-${data.createdAt.slice(0, 19).replace(/:/g, '')}.json`);
writeFileSync(out, JSON.stringify(data, null, 2));
console.log('decrypted copy (contains customer data and password hashes, delete when done):', out);

if (apply) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL (the restore target) is not set');
  const sql = neon(url);
  let n = 0;
  for (const r of data.rows) {
    await sql`insert into records (id, collection, value, idempotency_key, created_at, updated_at)
      values (${r.id}, ${r.collection}, ${JSON.stringify(r.value)}::jsonb, ${r.idempotencyKey}, ${r.createdAt}, ${r.updatedAt})
      on conflict (id) do update set collection = excluded.collection, value = excluded.value, updated_at = excluded.updated_at`;
    n++;
  }
  console.log(`restored ${n} records into ${new URL(url).host}`);
}
