# BGE SolarTech

เว็บไซต์บริษัทและระบบหลังบ้าน (CRM) ของ BGE - Better Group Engineering สำหรับงานติดตั้งโซลาร์เซลล์ ตั้งแต่ลีดจากเว็บ ใบเสนอราคา การเงิน งานติดตั้ง ไปจนถึงยื่นการไฟฟ้า

- เว็บไซต์: https://beg-solarcell.vercel.app
- หลังบ้าน: https://beg-solarcell.vercel.app/admin
- เวอร์ชันปัจจุบันและสิ่งที่เปลี่ยน: ดูไอคอนโทรโข่งบนแถบด้านบนของหลังบ้าน หรือ [`lib/changelog.ts`](lib/changelog.ts)

> repo นี้เป็น public ห้าม commit รหัสผ่าน token หรือไฟล์ `.env*` ค่าลับทั้งหมดอยู่ใน Vercel Environment Variables

## สารบัญ

- [เทคโนโลยี](#เทคโนโลยี)
- [ความสามารถ](#ความสามารถ)
- [เริ่มพัฒนาบนเครื่อง](#เริ่มพัฒนาบนเครื่อง)
- [Environment variables](#environment-variables)
- [Deploy](#deploy)
- [ตั้งค่าแจ้งเตือน LINE](#ตั้งค่าแจ้งเตือน-line)
- [เข้าสู่ระบบด้วย LINE](#เข้าสู่ระบบด้วย-line)
- [ตรวจสลิปอัตโนมัติ (SlipOK)](#ตรวจสลิปอัตโนมัติ-slipok)
- [ลิงก์ลูกค้าและใบส่งมอบงาน](#ลิงก์ลูกค้าและใบส่งมอบงาน)
- [สำรองและกู้ข้อมูล](#สำรองและกู้ข้อมูล)
- [โครงสร้างโค้ด](#โครงสร้างโค้ด)
- [ข้อมูลและสิทธิ์](#ข้อมูลและสิทธิ์)
- [ความปลอดภัย](#ความปลอดภัย)

## เทคโนโลยี

| ส่วน | ใช้ |
|---|---|
| เว็บและ API | Next.js 16 (App Router) บน Vercel |
| ฐานข้อมูล | Neon Postgres ผ่าน Drizzle ORM (ตาราง `records` เดียว เก็บ JSON แยกตาม `collection`) |
| ไฟล์รูป / PDF / สำรองข้อมูล | Vercel Blob |
| ล็อกอิน | Cookie session (JWT, `jose`) + bcrypt |
| ตรวจข้อมูล | zod ([`lib/job.ts`](lib/job.ts)) |
| PDF ใบเสนอราคา / ใบเสร็จ | วาดบน canvas ในเบราว์เซอร์ + `pdf-lib` |
| Excel | `exceljs` (โหลดเมื่อกด Export เท่านั้น) |
| แจ้งเตือน | LINE Messaging API |
| งานรายวัน | Vercel Cron (`vercel.json`) |

## ความสามารถ

**เว็บไซต์:** หน้าแรก, บริการ/อุปกรณ์, ผลงาน, ข่าวสาร, เกี่ยวกับเรา, ติดต่อ, ฟอร์มขอใบเสนอราคา (สร้างลีดใหม่ในหลังบ้านอัตโนมัติ)

**หลังบ้าน:**

| เมนู | ทำอะไร |
|---|---|
| แดชบอร์ด | KPI, ยอดขาย, งานล่าสุด |
| ลูกค้า / ออเดอร์ | สถานะงาน 23 ขั้น, kanban, ฟิลเตอร์แบบกลุ่ม + ช่วงวันที่ + งานของฉัน, เซลล์/ทีมช่างผู้รับผิดชอบ, ที่มาของลีด, ลิงก์ Google Maps พร้อมแผนที่, ลิงก์ลูกค้า |
| ปฏิทินติดตั้ง | คิวติดตั้งรายเดือนแยกทีมช่าง, วันว่างของแต่ละทีม, งานที่ยังไม่นัดวันติดตั้ง |
| รายงาน | ภาษีขายรายเดือน (ภ.พ.30) จากใบเสร็จ, ที่มาของลีดและอัตราปิดการขาย, Export Excel |
| ใบเสนอราคา | แก้ไข + PDF ในหน้าเดียว, ชุดอุปกรณ์, ไฟล์แนบ, อนุมัติแล้วล็อกราคา |
| การเงิน | งวดชำระ, แนบสลิป + ตรวจสลิปอัตโนมัติ (SlipOK), ยืนยันการโอน, ออกใบเสร็จรับเงิน / ใบกำกับภาษี (เลขที่ `RC-ปปดด####`), Export Excel |
| งานการไฟฟ้า / อัลบั้ม | ขั้นตอนยื่นการไฟฟ้า, ภาพหน้างาน before/after |
| แก้ไขหน้าเว็บ | ข่าวสาร, ผลงาน, อุปกรณ์, โลโก้ลูกค้าของเรา |
| ผู้ใช้ | 4 role (Admin, Sale, Technician, Accountant) + สิทธิ์รายข้อ |
| ประวัติการแก้ไข | ใครเปลี่ยนสถานะ แก้ราคา ยืนยันการโอน อนุมัติ หรือลบ (Admin) |
| การใช้งานระบบ | ขนาดฐานข้อมูล, compute ของ Neon, พื้นที่ Blob, สำรองข้อมูล, ข้อผิดพลาดของระบบ (Admin) |

## เริ่มพัฒนาบนเครื่อง

ต้องมี [Bun](https://bun.sh) และ Vercel CLI (`npx vercel`) ที่ล็อกอินบัญชีเจ้าของโปรเจกต์แล้ว

```bash
bun install
npx vercel link              # ครั้งแรกเท่านั้น
npx vercel env pull .env.local
bun dev                      # http://localhost:3000
```

`.env.local` ที่ได้จะชี้ไปที่**ฐานข้อมูลจริง** ถ้าจะทดลองแก้ข้อมูล ให้สร้าง branch ใน Neon (Neon Console → Branches → Create branch) แล้วใส่ connection string ของ branch นั้นเป็น `DATABASE_URL` แทน

ตรวจก่อน push:

```bash
bun run typecheck
bun run build
```

ฐานข้อมูลใหม่ (ว่าง):

```bash
bun run db:push   # สร้างตาราง
bun run db:seed   # ใส่ข้อมูลตัวอย่าง + ผู้ใช้ตัวอย่าง (พิมพ์รหัสผ่านสุ่มให้ครั้งเดียว)
```

## Environment variables

ตั้งใน Vercel → Project → Settings → Environment Variables ดูตัวอย่างใน [`.env.example`](.env.example)

| ตัวแปร | จำเป็น | ใช้ทำอะไร |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon (ตั้งให้อัตโนมัติจาก Vercel Storage) |
| `BLOB_READ_WRITE_TOKEN` | ✅ | Vercel Blob (ตั้งให้อัตโนมัติ, store ต้องเป็น public) |
| `AUTH_SECRET` | ✅ | เซ็น session อย่างน้อย 16 ตัวอักษร (`openssl rand -base64 32`) เปลี่ยนค่าแล้วทุกคนจะหลุดออกจากระบบ |
| `BACKUP_KEY` | สำรองข้อมูล | คีย์ AES-256 แบบ base64 ขนาด 32 bytes |
| `CRON_SECRET` | สำรองข้อมูล + เตือนนัด | Vercel ส่งค่านี้มากับ cron อัตโนมัติ |
| `NEON_API_KEY` | การ์ด CPU | API key ของ Neon ที่จำกัดเฉพาะโปรเจกต์นี้ |
| `NEON_PROJECT_ID` | การ์ด CPU | ตั้งให้อัตโนมัติจาก Vercel Storage |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE | จาก LINE Developers |
| `LINE_CHANNEL_SECRET` | LINE | ใช้ตรวจ webhook |
| `LINE_TO` | LINE | ID กลุ่ม/ผู้รับ คั่นด้วย `,` ได้หลายปลายทาง |
| `LINE_LOGIN_CHANNEL_ID`, `LINE_LOGIN_CHANNEL_SECRET` | เข้าสู่ระบบด้วย LINE | จาก LINE Login channel (คนละ channel กับ Messaging API) |
| `SLIPOK_BRANCH_ID`, `SLIPOK_API_KEY` | ตรวจสลิปอัตโนมัติ | จากหน้า API ของ SlipOK |
| `APP_URL` | ไม่จำเป็น | ลิงก์ในข้อความแจ้งเตือน (ค่าเริ่มต้น `https://beg-solarcell.vercel.app`) |
| `MONITOR_DB_LIMIT_GB`, `MONITOR_COMPUTE_LIMIT_HOURS`, `MONITOR_BLOB_LIMIT_GB` | ไม่จำเป็น | ลิมิตที่แสดงในหน้าการใช้งานระบบ (ค่าเริ่มต้น 0.5 GB / 100 ชม. / 1 GB) |

ค่าที่ตั้งเป็น Secret ใน Vercel อ่านกลับไม่ได้ (`vercel env pull` จะได้ค่าแทนที่) ให้เก็บสำเนาไว้เองถ้าจำเป็น

## Deploy

โปรเจกต์ deploy ผ่าน Vercel CLI (ไม่ได้ผูก auto-deploy กับ GitHub):

```bash
npx vercel deploy --prod
```

เปลี่ยน environment variable แล้วต้อง deploy ใหม่ค่าใหม่จึงมีผล

ทุก release: เพิ่มรายการบนสุดใน [`lib/changelog.ts`](lib/changelog.ts) และแก้ `version` ใน `package.json` ให้ตรงกัน

## ตั้งค่าแจ้งเตือน LINE

LINE Notify ปิดบริการไปแล้ว ระบบจึงใช้ LINE Messaging API แทน

1. สร้าง LINE Official Account และเปิด Messaging API ที่ [developers.line.biz](https://developers.line.biz)
2. ใส่ Webhook URL เป็น `https://beg-solarcell.vercel.app/api/line/webhook` แล้วเปิด "Use webhook"
3. ใน Vercel ตั้ง `LINE_CHANNEL_ACCESS_TOKEN` และ `LINE_CHANNEL_SECRET` แล้ว deploy ใหม่
4. เชิญบอทเข้ากลุ่ม LINE ที่ต้องการรับแจ้งเตือน แล้วพิมพ์ `id` บอทจะตอบรหัสกลุ่มกลับมา
5. ใส่รหัสนั้นเป็น `LINE_TO` ใน Vercel แล้ว deploy ใหม่

ตรวจว่าตั้งค่าครบได้ที่หลังบ้าน → การใช้งานระบบ → การ์ด "สำรองข้อมูล" (บรรทัดแจ้งเตือน LINE ต้องเป็น ✅)

ระบบจะแจ้งเตือนเมื่อ:

| เหตุการณ์ | ส่งเมื่อ |
|---|---|
| ลีดใหม่จากเว็บไซต์ | ทันทีที่ลูกค้าส่งฟอร์มขอใบเสนอราคา |
| แนบสลิป | ทันทีที่มีคนแนบสลิปในงวดชำระ |
| นัดหมายพรุ่งนี้ | ทุกวัน 08:00 |
| ข้อผิดพลาดใหม่ของระบบ | ครั้งแรกของ error แต่ละแบบในแต่ละวัน |

## เข้าสู่ระบบด้วย LINE

พนักงานเข้าสู่ระบบด้วย LINE ได้หลังจากเชื่อมบัญชีแล้วเท่านั้น บัญชี LINE ที่ไม่ได้เชื่อมเข้าระบบไม่ได้ และสร้างผู้ใช้ใหม่ผ่าน LINE ไม่ได้

ตั้งค่า (ครั้งเดียว):

1. ที่ [developers.line.biz](https://developers.line.biz) สร้าง channel ประเภท **LINE Login** (คนละ channel กับ Messaging API ที่ใช้แจ้งเตือน)
2. ในแท็บ LINE Login ใส่ Callback URL เป็น `https://beg-solarcell.vercel.app/api/auth/line/callback`
3. ใน Vercel ตั้ง `LINE_LOGIN_CHANNEL_ID` และ `LINE_LOGIN_CHANNEL_SECRET` แล้ว deploy ใหม่
4. กด Publish channel ใน LINE Developers (ถ้ายังเป็น Developing จะเข้าได้เฉพาะคนที่เป็น tester)

พนักงานแต่ละคน:

1. เข้าสู่ระบบด้วยรหัสผ่านตามปกติ
2. ไปที่ โปรไฟล์ของฉัน → กด **เชื่อมบัญชี LINE**
3. ครั้งต่อไปกด **เข้าสู่ระบบด้วย LINE** ที่หน้าเข้าสู่ระบบ

ยกเลิกการเชื่อมได้ที่หน้าโปรไฟล์ ผู้ใช้ที่ถูกปิดใช้งานเข้าด้วย LINE ไม่ได้ หน้าผู้ใช้แสดงป้าย LINE สำหรับคนที่เชื่อมแล้ว

## ตรวจสลิปอัตโนมัติ (SlipOK)

เมื่อแนบสลิปในหน้าการเงิน ระบบส่งรูปสลิปพร้อมยอดของงวดนั้นไปตรวจที่ [SlipOK](https://slipok.com)

| ผลตรวจ | ระบบทำอะไร |
|---|---|
| สลิปถูกต้อง (ของจริง, ยอดตรงงวด, โอนเข้าบัญชีบริษัท) | ยืนยันการโอนให้อัตโนมัติ และแจ้ง LINE |
| สลิปซ้ำ (SlipOK เคยเห็นแล้ว หรือเลขอ้างอิงเดียวกันเคยใช้กับงวดอื่นในระบบ) | ตั้งเป็น "รอตรวจสอบ" และแจ้ง LINE |
| ยอดไม่ตรง / บัญชีผู้รับไม่ใช่บัญชีบริษัท / อ่าน QR ไม่ได้ | ตั้งเป็น "รอตรวจสอบ" ให้คนตรวจเอง |
| ธนาคารยังไม่พร้อม / ระบบขัดข้อง | ตั้งเป็น "รอตรวจสอบ" กด "ตรวจอีกครั้ง" ภายหลัง |

ตั้งค่า:

1. สมัครแพ็กเกจที่ slipok.com แล้วเอา Branch ID และ API key จากหน้าตั้งค่า API
2. **ลงทะเบียนบัญชีธนาคารของบริษัทใน SlipOK** ไม่เช่นนั้น SlipOK จะไม่ตรวจว่าโอนเข้าบัญชีถูกหรือไม่ (error 1014)
3. ใน Vercel ตั้ง `SLIPOK_BRANCH_ID` และ `SLIPOK_API_KEY` แล้ว deploy ใหม่

ตรวจโควตาที่เหลือได้ที่หลังบ้าน → การใช้งานระบบ ทุกการตรวจใช้โควตา 1 สลิป ปุ่ม "ตรวจอีกครั้ง" ใช้โควตาเพิ่ม

## ลิงก์ลูกค้าและใบส่งมอบงาน

ในรายละเอียดงาน (แท็บข้อมูล) กด **สร้างลิงก์ให้ลูกค้า** แล้ว **ส่งทาง LINE** หรือคัดลอกไปส่งเอง ลิงก์เป็นรูปแบบ `/track/<รหัสสุ่ม>`

- ลูกค้าเห็น: ขั้นตอนงาน 6 ขั้น, วันติดตั้ง, นัดหมาย, งวดชำระ (ชำระแล้ว/รอชำระ) ไม่แสดงเบอร์โทร ที่อยู่ หรือบันทึกภายใน
- เมื่อสถานะถึง "ติดตั้งแล้วเสร็จ" ลูกค้าเซ็นรับมอบงานบนมือถือได้ครั้งเดียว ลายเซ็นเก็บในงานนั้น และดาวน์โหลด **ใบส่งมอบงาน (PDF)** ได้จากรายละเอียดงาน
- ลิงก์หลุดไปที่อื่น: กด **สร้างลิงก์ใหม่** ลิงก์เดิมจะใช้ไม่ได้ทันที
- การสร้างลิงก์และการเซ็นถูกบันทึกในประวัติการแก้ไข และแจ้ง LINE เมื่อลูกค้าเซ็น

## สำรองและกู้ข้อมูล

**สำรองอัตโนมัติ:** ทุกวัน 08:00 (เวลาไทย) ผ่าน Vercel Cron ที่ `/api/cron/daily` ข้อมูลทั้งตาราง `records` ถูกบีบอัดและเข้ารหัส AES-256-GCM ด้วย `BACKUP_KEY` แล้วเก็บใน Vercel Blob โฟลเดอร์ `backups/` เก็บ 30 วัน (อย่างน้อย 7 ชุดล่าสุดเสมอ)

**สำรองทันที / ดาวน์โหลด:** หลังบ้าน → การใช้งานระบบ → การ์ด "สำรองข้อมูล" กด "สำรองข้อมูลตอนนี้" หรือ "ดาวน์โหลดไฟล์สำรอง (ถอดรหัสแล้ว)" ไฟล์ที่ดาวน์โหลดมีข้อมูลลูกค้า ต้องเก็บในที่ปลอดภัย

**กู้ข้อมูล:** กู้ลง Neon branch ใหม่ก่อนเสมอ ตรวจข้อมูลแล้วค่อยตัดสินใจใช้

```bash
# 1. ดูว่าไฟล์มีอะไร (ไม่แตะฐานข้อมูล)
bun scripts/backup-restore.ts ./solarcell-2026-11-21-xxxx.json

# 2. โหลดเข้า branch ที่สร้างไว้
DATABASE_URL="<connection string ของ branch>" bun scripts/backup-restore.ts ./solarcell-2026-11-21-xxxx.json --apply
```

Neon มี point-in-time restore ของตัวเองด้วย แต่แพ็กเกจ Free ย้อนได้แค่ช่วงสั้น ไฟล์สำรองรายวันจึงเป็นตัวหลัก

## โครงสร้างโค้ด

```
app/
  (site)/                 เว็บไซต์สาธารณะ
  admin/page.tsx          หลังบ้าน (render components/SolarApp.tsx)
  api/
    actions/              API หลักของหลังบ้าน: records.list/create/replace/delete, quote.approve, receipt.issue
    auth/                 login, logout, me, password
    public/quote/         ฟอร์มขอใบเสนอราคาจากเว็บ (ไม่ต้องล็อกอิน)
    upload/               ออก token ให้เบราว์เซอร์อัปโหลดไฟล์ไป Blob
    maps/resolve/         แปลงลิงก์ย่อ Google Maps
    monitor/              ข้อมูลหน้าการใช้งานระบบ + สำรองข้อมูลทันที/ดาวน์โหลด
    cron/daily/           สำรองข้อมูล + เตือนนัดหมาย (Vercel Cron)
    errors/               รับรายงาน error จากเบราว์เซอร์
    line/webhook/         ตอบ ID กลุ่มตอนตั้งค่า LINE
components/
  SolarApp.tsx            หน้าจอหลักของหลังบ้าน (state + ทุกเมนู)
  solar/model.ts          type, ค่าคงที่, ฟังก์ชันคำนวณของหลังบ้าน (ไม่มี UI)
  solar/quote.tsx         ใบเสนอราคา, ใบเสร็จ
  solar/ui.tsx            ปุ่มอัปโหลด, ErrorBoundary, ไอคอน
  admin/                  หน้าจอย่อย (CMS, ใบเสนอราคา, ประวัติการแก้ไข, การใช้งานระบบ, ...)
  site/                   ส่วนประกอบของเว็บไซต์
lib/
  job.ts                  สถานะงาน, กลุ่มสถานะ, schema ตรวจข้อมูล, สูตรยอดเงิน (ใช้ทั้งหน้าจอและ API)
  auth.ts                 session, สิทธิ์, นโยบายรหัสผ่าน
  audit.ts                ประวัติการแก้ไข
  backup.ts               สำรอง/ถอดรหัสข้อมูล
  errors.ts, report-error.ts   บันทึกข้อผิดพลาด
  notify.ts               ส่ง LINE
  quote-render.ts, quote-pdf.ts   วาด PDF ใบเสนอราคาและใบเสร็จ
  sales-export.ts         Export Excel
  changelog.ts            บันทึกเวอร์ชัน
scripts/                  seed, กู้ข้อมูล
db/schema.ts              ตาราง records
```

## ข้อมูลและสิทธิ์

ข้อมูลทั้งหมดอยู่ในตาราง `records` คอลัมน์ `value` (JSONB) แยกด้วย `collection`:

| collection | เก็บ |
|---|---|
| `solarpro_jobs` | ลูกค้า/งาน, ใบเสนอราคา, งวดชำระ, ใบเสร็จ |
| `solarpro_users` | ผู้ใช้หลังบ้าน (รหัสผ่านเป็น bcrypt) |
| `bge_audit` | ประวัติการแก้ไข (เพิ่มได้อย่างเดียว) |
| `bge_errors` | ข้อผิดพลาดของระบบ |
| `bge_counters` | เลขรันเอกสาร |
| `bge_news`, `bge_projects`, `bge_products`, `bge_clients` | เนื้อหาเว็บไซต์ |
| `bge_company_settings`, `bge_attachments`, `bge_equipment_sets` | ตั้งค่าบริษัท, ไฟล์แนบ, ชุดอุปกรณ์ |

กฎที่เซิร์ฟเวอร์บังคับ (ไม่ใช่แค่ซ่อนปุ่ม):

- **บันทึกทับกัน:** ทุกครั้งที่บันทึกงาน ระบบส่ง `updatedAt` ที่โหลดมาไปด้วย ถ้ามีคนบันทึกงานนั้นไปก่อนแล้ว เซิร์ฟเวอร์ตอบ 409 แทนการเขียนทับ
- **ตรวจรูปแบบ:** งานและผู้ใช้ต้องผ่าน schema ใน `lib/job.ts`
- **ช่องที่ล็อกตามสิทธิ์:** สถานะต้องมีสิทธิ์ `orders_change_status`, งวดชำระต้องมีสิทธิ์ `finance_edit_installments`, การยืนยันการโอนต้องมีสิทธิ์ `finance_confirm`
- **อนุมัติใบเสนอราคา:** ทำได้ผ่าน `quote.approve` เท่านั้น ระหว่างอนุมัติแล้วราคา (`items`, `discount`, `labor`) แก้ไม่ได้
- **ใบเสร็จ:** ออกได้ผ่าน `receipt.issue` เท่านั้น ออกให้งวดที่ยืนยันการโอนแล้ว เลขที่ไม่ซ้ำ งวดที่มีใบเสร็จแล้วแก้ไม่ได้

## ความปลอดภัย

- ล็อกบัญชี 15 นาทีเมื่อใส่รหัสผิด 5 ครั้ง, รหัสผ่านอย่างน้อย 8 ตัวอักษร
- เปลี่ยนรหัสผ่านแล้ว session บนอุปกรณ์อื่นหมดอายุทันที
- Security headers (HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy) ตั้งใน `next.config.ts`
- Content-Security-Policy: บังคับ `object-src 'none'; base-uri 'self'; frame-ancestors 'self'` ส่วนนโยบายเต็มอยู่ในโหมด Report-Only และส่งรายงานเข้า `/api/csp-report` (เห็นในหน้าการใช้งานระบบ → ข้อผิดพลาด) เมื่อไม่มีรายงานแปลกๆ แล้วค่อยเปลี่ยนเป็นบังคับ
- ไฟล์ใน Vercel Blob เป็น public URL (ชื่อไฟล์สุ่ม) ไฟล์สำรองข้อมูลจึงเข้ารหัสไว้
- บัญชีตัวอย่างจาก seed ต้องเปลี่ยนรหัสผ่านทันทีหลังติดตั้ง
