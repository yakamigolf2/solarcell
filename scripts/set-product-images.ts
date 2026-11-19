import { put } from '@vercel/blob';
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';

// One-off: upload starter product photos to Vercel Blob and attach them as covers (admins can replace them in the backoffice).
const sql = neon(process.env.DATABASE_URL!);
const items: [string, string][] = [['แผงโซลาร์เซลล์', 'assets/products/panel.jpg'], ['อินเวอร์เตอร์', 'assets/products/inverter.jpg']];
async function main() {
  for (const [title, file] of items) {
    const { url } = await put(`products/${title === 'อินเวอร์เตอร์' ? 'inverter' : 'panel'}.jpg`, readFileSync(file), { access: 'public', contentType: 'image/jpeg', addRandomSuffix: true });
    const r = await sql`update records set value = jsonb_set(value, '{cover}', to_jsonb(${url}::text)) where collection = 'bge_products' and value->>'title' = ${title} and coalesce(value->>'cover','') = '' returning id`;
    console.log(title, r.length ? url : 'already has a cover — skipped');
  }
}
main().catch(e => { console.error(e); process.exit(1); });
