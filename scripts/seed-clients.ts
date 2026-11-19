import { put } from '@vercel/blob';
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';

// One-off: move the four bundled customer logos into Blob + the database so admins can manage them.
const sql = neon(process.env.DATABASE_URL!);
const list: [string, string][] = [['MG', 'mg'], ['7-Eleven', '7-eleven'], ['Cafe Amazon', 'cafe-amazon'], ['เทศบาล', 'seal']];
async function main() {
  const have = await sql`select count(*)::int n from records where collection='bge_clients'`;
  if (have[0].n > 0) { console.log('clients already seeded'); return; }
  for (let i = 0; i < list.length; i++) {
    const [name, file] = list[i];
    const { url } = await put(`clients/${file}.png`, readFileSync(`public/clients/${file}.png`), { access: 'public', contentType: 'image/png', addRandomSuffix: true });
    await sql`insert into records (collection, value, idempotency_key) values ('bge_clients', ${JSON.stringify({ name, logo: url, order: i + 1, status: 'แสดง' })}::jsonb, ${'seed-client-' + i}) on conflict do nothing`;
    console.log('+', name);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
