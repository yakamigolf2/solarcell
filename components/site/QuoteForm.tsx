'use client';
import { useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { BUILDINGS } from '@/lib/site-data';

type Errors = Partial<Record<'name' | 'phone' | 'bill', string>>;
const input = 'w-full px-4 py-3 rounded-2xl border border-[var(--line2)] bg-white/80 text-[15px] aria-[invalid=true]:border-red-400';

export default function QuoteForm() {
  const [f, setF] = useState({ name: '', phone: '', line: '', address: '', building: BUILDINGS[0], bill: '', note: '', website: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF(p => ({ ...p, [k]: e.target.value }));

  const validate = (): Errors => {
    const e: Errors = {};
    if (f.name.trim().length < 2) e.name = 'กรุณากรอกชื่อ';
    if (!/^[0-9+\-\s()]{8,20}$/.test(f.phone.trim())) e.phone = 'กรุณากรอกเบอร์โทรให้ถูกต้อง';
    if (f.bill && (!Number.isFinite(Number(f.bill)) || Number(f.bill) < 0)) e.bill = 'กรอกเป็นตัวเลข';
    return e;
  };
  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate(); setErrors(e);
    if (Object.keys(e).length) return;
    setState('busy'); setMsg('');
    try {
      const res = await fetch('/api/public/quote', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...f, bill: Number(f.bill) || 0 }) });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok || json.error) throw new Error(json.error || 'ส่งข้อมูลไม่สำเร็จ');
      setState('done');
    } catch (err) { setState('error'); setMsg(err instanceof Error ? err.message : 'ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่'); }
  }

  if (state === 'done') return (
    <div role="status" className="glass rounded-[32px] p-10 text-center"><CheckCircle2 size={52} className="mx-auto text-emerald-500" /><h3 className="mt-3 text-[24px] font-bold text-[var(--navy)]">ได้รับข้อมูลแล้ว</h3><p className="mt-2 text-[var(--muted)]">ทีมงานจะติดต่อกลับเพื่อนัดสำรวจหน้างานและเสนอราคาโดยเร็วที่สุด</p></div>
  );
  return (
    <form onSubmit={submit} noValidate className="glass rounded-[32px] p-6 sm:p-8 grid sm:grid-cols-2 gap-4">
      <div><label htmlFor="q-name" className="text-[13px] font-medium">ชื่อ-นามสกุล *</label><input id="q-name" value={f.name} onChange={set('name')} aria-invalid={!!errors.name} autoComplete="name" className={input} />{errors.name && <p className="text-[12px] text-red-600 mt-1">{errors.name}</p>}</div>
      <div><label htmlFor="q-phone" className="text-[13px] font-medium">เบอร์โทร *</label><input id="q-phone" value={f.phone} onChange={set('phone')} aria-invalid={!!errors.phone} inputMode="tel" autoComplete="tel" className={input} />{errors.phone && <p className="text-[12px] text-red-600 mt-1">{errors.phone}</p>}</div>
      <div><label htmlFor="q-line" className="text-[13px] font-medium">LINE ID</label><input id="q-line" value={f.line} onChange={set('line')} className={input} /></div>
      <div><label htmlFor="q-bill" className="text-[13px] font-medium">ค่าไฟเฉลี่ยต่อเดือน (บาท)</label><input id="q-bill" value={f.bill} onChange={set('bill')} inputMode="numeric" aria-invalid={!!errors.bill} className={input} />{errors.bill && <p className="text-[12px] text-red-600 mt-1">{errors.bill}</p>}</div>
      <div><label htmlFor="q-type" className="text-[13px] font-medium">ประเภทอาคาร</label><select id="q-type" value={f.building} onChange={set('building')} className={input}>{BUILDINGS.map(b => <option key={b}>{b}</option>)}</select></div>
      <div><label htmlFor="q-addr" className="text-[13px] font-medium">ที่อยู่ / พื้นที่ติดตั้ง</label><input id="q-addr" value={f.address} onChange={set('address')} autoComplete="street-address" className={input} /></div>
      <div className="sm:col-span-2"><label htmlFor="q-note" className="text-[13px] font-medium">รายละเอียดเพิ่มเติม</label><textarea id="q-note" rows={3} value={f.note} onChange={set('note')} className={input} /></div>
      <input tabIndex={-1} autoComplete="off" aria-hidden value={f.website} onChange={set('website')} className="hidden" name="website" />
      {state === 'error' && <p role="alert" className="sm:col-span-2 text-[14px] text-red-600 bg-red-50 rounded-2xl px-4 py-3">{msg}</p>}
      <button disabled={state === 'busy'} className="btn-primary sm:col-span-2 inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-semibold disabled:opacity-60">{state === 'busy' ? <><Loader2 size={18} className="animate-spin" /> กำลังส่ง…</> : <><Send size={18} /> ส่งคำขอใบเสนอราคา</>}</button>
    </form>
  );
}
