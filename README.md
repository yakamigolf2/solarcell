# BGE Solar CRM (Next.js fullstack)

Next.js App Router + Neon Postgres (Drizzle) + Vercel Blob (public images) + cookie session auth (bcrypt).

## Deploy to Vercel
1. Push this folder to a Git repo, then import it in Vercel.
2. Vercel -> Storage: add **Neon** (sets `DATABASE_URL`) and **Blob** (sets `BLOB_READ_WRITE_TOKEN`; make the store *public*).
3. Add env `AUTH_SECRET` (`openssl rand -base64 32`).
4. Create tables + seed sample data once, from your machine:
   ```
   vercel env pull .env.local
   bun run db:push
   bun run db:seed        # needs DATABASE_URL in the environment
   ```
5. Log in with a seeded account (admin / admin123 ...) and **change every password immediately** (ผู้ใช้ -> รีเซ็ตรหัสผ่าน).

## Local dev
Copy `.env.example` to `.env.local`, fill in values, `bun dev`.
