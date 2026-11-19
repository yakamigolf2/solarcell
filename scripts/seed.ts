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
  const news = await db.select().from(records).where(eq(records.collection, 'bge_news'));
  if (news.length === 0) {
    const SAMPLE = [
      { date: '2026-11-12', tag: 'ความรู้', title: 'ติดตั้งโซลาร์รูฟท็อปต้องเตรียมอะไรบ้าง', summary: 'เช็กลิสต์ก่อนติดตั้ง ตั้งแต่โครงสร้างหลังคา ทิศทาง ไปจนถึงมิเตอร์และเอกสาร' },
      { date: '2026-11-03', tag: 'คู่มือ', title: 'ขนาดระบบแค่ไหนจึงเหมาะกับค่าไฟของคุณ', summary: 'วิธีประเมินขนาดระบบคร่าว ๆ จากบิลค่าไฟรายเดือน และสิ่งที่ควรถามผู้ติดตั้ง' },
      { date: '2026-10-21', tag: 'บำรุงรักษา', title: 'ดูแลแผงโซลาร์ให้ผลิตไฟได้เต็มประสิทธิภาพ', summary: 'การล้างแผง ตรวจสายไฟ และสัญญาณเตือนที่ควรให้ช่างมาตรวจสอบ' },
    ];
    for (let i = 0; i < SAMPLE.length; i++) await db.insert(records).values({ collection: 'bge_news', value: { ...SAMPLE[i], body: SAMPLE[i].summary, cover: '', status: 'เผยแพร่' }, idempotencyKey: `seed-news-${i}` }).onConflictDoNothing();
    console.log('news + 3');
  }
  const proj = await db.select().from(records).where(eq(records.collection, 'bge_projects'));
  if (proj.length === 0) {
    const P = [
      ['ติดตั้ง Solar บ้านพักอาศัย 5.8 kWp', 'ปทุมธานี', 'บ้านพักอาศัย', 5.8, 'ระบบ On-grid สำหรับบ้านสองชั้น ลดค่าไฟช่วงกลางวันที่ใช้เครื่องปรับอากาศ'],
      ['โซลาร์รูฟท็อปอาคารสำนักงาน 30 kWp', 'นนทบุรี', 'อาคารพาณิชย์', 30, 'ติดตั้งบนดาดฟ้าอาคาร พร้อมระบบมอนิเตอร์ผลผลิตแบบเรียลไทม์'],
      ['ระบบโซลาร์โรงงานพลาสติก 99 kWp', 'สมุทรปราการ', 'โรงงาน', 99, 'ลดต้นทุนพลังงานในช่วงเวลาผลิต ออกแบบโครงสร้างรองรับหลังคาเมทัลชีท'],
      ['Solar บ้านในหมู่บ้านจัดสรร 4.4 kWp', 'กรุงเทพฯ', 'บ้านพักอาศัย', 4.4, 'จัดวางแผงให้กลมกลืนกับหลังคา คำนึงถึงทิศและร่มเงา'],
      ['โซลาร์ร้านค้าและโกดัง 15 kWp', 'ปทุมธานี', 'อาคารพาณิชย์', 15, 'ระบบขนาดกลางสำหรับธุรกิจที่เปิดทำการช่วงกลางวัน'],
      ['ระบบโซลาร์โรงงานอะไหล่ 60 kWp', 'ปทุมธานี', 'โรงงาน', 60, 'วิศวกรออกแบบตามโหลดไฟฟ้าและพื้นที่หลังคาจริง'],
    ] as const;
    for (let i = P.length - 1; i >= 0; i--) { const [title, place, type, kw, text] = P[i]; await db.insert(records).values({ collection: 'bge_projects', value: { title, place, type, kw, text, cover: '', status: 'เผยแพร่' }, idempotencyKey: `seed-project-${i}` }).onConflictDoNothing(); }
    console.log('projects + 6');
  }
  console.log('seed done');
}
main().catch((e) => { console.error(e); process.exit(1); });
