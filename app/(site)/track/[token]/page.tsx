import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CheckCircle2, Circle } from 'lucide-react';
import HandoverSign from '@/components/site/HandoverSign';
import { jobByToken, MILESTONES, publicView } from '@/lib/customer-link';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'สถานะงานติดตั้ง', robots: { index: false, follow: false }, referrer: 'no-referrer' };

const baht = (n: number) => `${n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท`;
const thDate = (s: string) => { if (!s) return '—'; const d = new Date(`${s}T00:00:00`); return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }); };

/** Customer-facing job status: milestones, install date, installments, and the handover signature when it's time. */
export default async function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const row = await jobByToken(token);
  if (!row) notFound();
  const v = publicView(row.value);

  return (
    <div className="max-w-[720px] mx-auto px-4 py-10 sm:py-14">
      <p className="text-[13px] text-[var(--muted)]">สถานะงานติดตั้งโซลาร์เซลล์</p>
      <h1 className="text-[26px] sm:text-[32px] font-extrabold text-[var(--navy)]">{v.customer}</h1>
      <p className="text-[14px] text-[var(--muted)] mt-1">{v.kw ? `ระบบ ${v.kw} kW` : ''}{v.panels ? ` • แผง ${v.panels} แผ่น` : ''}{v.inverter ? ` • ${v.inverter}` : ''}</p>

      <ol className="mt-8 space-y-3">
        {MILESTONES.map((m, i) => {
          const done = v.step > i, current = v.step === i;
          return (
            <li key={m} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${current ? 'border-[var(--primary)] bg-emerald-50' : 'bg-white'}`}>
              {done ? <CheckCircle2 className="text-emerald-600 shrink-0" size={22} /> : <Circle className={current ? 'text-[var(--primary)] shrink-0' : 'text-gray-300 shrink-0'} size={22} />}
              <span className={`font-semibold ${done || current ? 'text-[var(--navy)]' : 'text-gray-400'}`}>{m}</span>
              {current && <span className="ml-auto text-[12px] font-bold text-[var(--primary)]">{v.status}</span>}
            </li>
          );
        })}
      </ol>

      <section className="mt-8 grid sm:grid-cols-2 gap-3 text-[14px]">
        <div className="rounded-2xl border bg-white p-4"><div className="text-[12px] text-[var(--muted)]">วันติดตั้ง</div><div className="font-bold">{v.installDate ? `${thDate(v.installDate)}${v.installDays > 1 ? ` (${v.installDays} วัน)` : ''}` : 'รอนัดหมาย'}</div></div>
        <div className="rounded-2xl border bg-white p-4"><div className="text-[12px] text-[var(--muted)]">นัดหมายครั้งถัดไป</div><div className="font-bold">{thDate(v.nextAppt)}</div></div>
      </section>

      {v.payments.length > 0 && <section className="mt-8">
        <h2 className="font-bold text-[18px] mb-2">งวดชำระเงิน</h2>
        <ul className="rounded-2xl border bg-white divide-y">
          {v.payments.map((p, i) => <li key={i} className="flex items-center gap-3 px-4 py-3 text-[14px]"><span className="flex-1">{p.label} ({p.pct}%)</span><span className="tabular-nums">{baht(p.amount)}</span><span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${p.paid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{p.paid ? 'ชำระแล้ว' : 'รอชำระ'}</span></li>)}
        </ul>
      </section>}

      <section className="mt-8">
        <h2 className="font-bold text-[18px] mb-2">ส่งมอบงาน</h2>
        {v.handover
          ? <p className="rounded-2xl border bg-emerald-50 border-emerald-200 p-4 text-[14px]">เซ็นรับมอบงานแล้วโดย <b>{v.handover.name}</b> เมื่อ {new Date(v.handover.signedAt).toLocaleString('th-TH')} ขอบคุณที่ใช้บริการ</p>
          : v.canSign ? <HandoverSign token={token} items={v.items} />
          : <p className="text-[14px] text-[var(--muted)]">ลูกค้าจะเซ็นรับมอบงานได้ที่หน้านี้หลังติดตั้งเสร็จ</p>}
      </section>

      <p className="mt-10 text-[12px] text-[var(--muted)]">หน้านี้สำหรับลูกค้าเจ้าของงานเท่านั้น กรุณาอย่าส่งต่อลิงก์ สอบถามเพิ่มเติมติดต่อเจ้าหน้าที่ BGE</p>
    </div>
  );
}
