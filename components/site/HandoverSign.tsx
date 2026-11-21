'use client';
import { useEffect, useRef, useState } from 'react';

/** Signature pad + handover confirmation for the customer's phone. Sends a PNG data URL to /api/public/handover. */
export default function HandoverSign({ token, items }: { token: string; items: { name: string; qty: number }[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  const [name, setName] = useState('');
  const [accept, setAccept] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const c = canvas.current!;
    const ratio = window.devicePixelRatio || 1;
    c.width = c.clientWidth * ratio; c.height = c.clientHeight * ratio;
    const ctx = c.getContext('2d')!;
    ctx.scale(ratio, ratio); ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#102A43';
  }, []);

  const pos = (e: React.PointerEvent) => { const r = canvas.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const down = (e: React.PointerEvent) => { e.preventDefault(); canvas.current!.setPointerCapture(e.pointerId); drawing.current = true; const p = pos(e); const ctx = canvas.current!.getContext('2d')!; ctx.beginPath(); ctx.moveTo(p.x, p.y); };
  const move = (e: React.PointerEvent) => { if (!drawing.current) return; const p = pos(e); const ctx = canvas.current!.getContext('2d')!; ctx.lineTo(p.x, p.y); ctx.stroke(); setHasInk(true); };
  const up = () => { drawing.current = false; };
  const clear = () => { const c = canvas.current!; c.getContext('2d')!.clearRect(0, 0, c.width, c.height); setHasInk(false); };

  async function submit() {
    setMsg(null);
    if (!accept) return setMsg({ ok: false, text: 'กรุณาติ๊กยืนยันว่าได้รับงานครบถ้วน' });
    if (name.trim().length < 2) return setMsg({ ok: false, text: 'กรุณากรอกชื่อผู้รับมอบงาน' });
    if (!hasInk) return setMsg({ ok: false, text: 'กรุณาเซ็นชื่อในช่องลายเซ็น' });
    // downscale to keep the stored signature small
    const src = canvas.current!; const out = document.createElement('canvas'); out.width = 600; out.height = Math.round(600 * src.height / src.width);
    out.getContext('2d')!.drawImage(src, 0, 0, out.width, out.height);
    setBusy(true);
    try {
      const res = await fetch('/api/public/handover', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, name: name.trim(), accept, signature: out.toDataURL('image/png') }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'ส่งไม่สำเร็จ');
      setMsg({ ok: true, text: 'บันทึกการรับมอบงานเรียบร้อย ขอบคุณครับ' });
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : 'ส่งไม่สำเร็จ' }); } finally { setBusy(false); }
  }

  return (
    <div className="rounded-2xl border bg-white p-4 space-y-4 text-[14px]">
      {items.length > 0 && <div><div className="font-semibold mb-1">รายการที่ติดตั้ง</div><ul className="list-disc pl-5 text-[13px] text-[#334E68]">{items.map((it, i) => <li key={i}>{it.name}{it.qty ? ` × ${it.qty}` : ''}</li>)}</ul></div>}
      <label className="flex gap-2 items-start"><input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-1" /><span>ข้าพเจ้าได้ตรวจรับงานติดตั้งระบบโซลาร์เซลล์ตามรายการข้างต้นครบถ้วน ระบบทำงานปกติ และได้รับคำแนะนำการใช้งานแล้ว</span></label>
      <label className="block"><span className="text-[13px] text-[var(--muted)]">ชื่อผู้รับมอบงาน</span><input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border" placeholder="ชื่อ-นามสกุล" autoComplete="name" /></label>
      <div>
        <div className="flex justify-between items-center mb-1"><span className="text-[13px] text-[var(--muted)]">ลายเซ็น</span><button type="button" onClick={clear} className="px-2 py-1.5 -my-1 text-[12px] font-bold text-[var(--primary)]">ล้างลายเซ็น</button></div>
        <canvas ref={canvas} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} className="w-full h-[180px] rounded-xl border-2 border-dashed bg-gray-50 touch-none" aria-label="ช่องเซ็นชื่อ ใช้นิ้วหรือเมาส์เซ็น" />
      </div>
      {msg && <p role="status" className={`text-[13px] font-semibold ${msg.ok ? 'text-emerald-700' : 'text-rose-600'}`}>{msg.text}</p>}
      <button type="button" onClick={submit} disabled={busy} className="w-full py-3 rounded-full bg-[var(--primary)] text-white font-bold disabled:opacity-50">{busy ? 'กำลังส่ง…' : 'ยืนยันรับมอบงาน'}</button>
    </div>
  );
}
