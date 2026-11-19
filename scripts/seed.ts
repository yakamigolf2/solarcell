import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { records } from '../db/schema';
import { SAMPLES, SAMPLE_USERS } from '../components/SolarApp';

// Usage: DATABASE_URL=... bun run db:seed      (idempotent: only inserts what is missing)
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
const db = drizzle(neon(url));

async function main() {
  const users = await db.select().from(records).where(eq(records.collection, 'solarpro_users'));
  const have = new Set(users.map((u) => String(u.value.username).toLowerCase()));
  for (const u of SAMPLE_USERS) {
    if (have.has(u.username.toLowerCase())) continue;
    await db.insert(records).values({ collection: 'solarpro_users', value: { ...u, password: await bcrypt.hash(u.password, 10) }, idempotencyKey: `seed-user-${u.username}` }).onConflictDoNothing();
    console.log('user +', u.username);
  }
  const jobs = await db.select().from(records).where(eq(records.collection, 'solarpro_jobs'));
  if (jobs.length === 0) {
    for (let i = 0; i < SAMPLES.length; i++) await db.insert(records).values({ collection: 'solarpro_jobs', value: SAMPLES[i], idempotencyKey: `seed-job-${i}` }).onConflictDoNothing();
    console.log(`jobs + ${SAMPLES.length}`);
  }
  console.log('seed done');
}
main().catch((e) => { console.error(e); process.exit(1); });
