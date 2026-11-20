'use client';
import { useEffect, useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import { CHANGELOG, LATEST_VERSION, type ChangeKind } from '@/lib/changelog';

const SEEN_KEY = 'bge_seen_version';
const KIND: Record<ChangeKind, { label: string; cls: string }> = {
  new: { label: 'ใหม่', cls: 'bg-emerald-100 text-emerald-800' },
  improve: { label: 'ปรับปรุง', cls: 'bg-sky-100 text-sky-800' },
  fix: { label: 'แก้ไข', cls: 'bg-amber-100 text-amber-800' },
  security: { label: 'ความปลอดภัย', cls: 'bg-rose-100 text-rose-800' },
};

/** Top-bar button + modal listing backoffice version updates. A dot shows until the user opens the latest version. */
export default function ReleaseNotes() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    try { setUnread(localStorage.getItem(SEEN_KEY) !== LATEST_VERSION); } catch { /* storage blocked: no dot */ }
  }, []);

  const show = () => {
    setOpen(true);
    setUnread(false);
    try { localStorage.setItem(SEEN_KEY, LATEST_VERSION); } catch { /* ignore */ }
  };

  return (
    <>
      <button onClick={show} aria-label="อัปเดตเวอร์ชัน" title={`อัปเดตเวอร์ชัน (v${LATEST_VERSION})`} className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white/70 hover:bg-white">
        <Megaphone size={17} />
        {unread && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="อัปเดตเวอร์ชัน" className="bg-white w-full max-w-[560px] max-h-[85vh] rounded-3xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 p-5 pb-3 border-b">
              <div>
                <h2 className="text-[18px] font-extrabold">อัปเดตเวอร์ชัน</h2>
                <p className="text-[13px] text-gray-500">เวอร์ชันปัจจุบัน v{LATEST_VERSION}</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="ปิด" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto p-5 space-y-6">
              {CHANGELOG.map((r, i) => (
                <section key={r.version}>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-extrabold text-[15px]">v{r.version}</span>
                    {i === 0 && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--primary)] text-white">ล่าสุด</span>}
                    <span className="text-[12px] text-gray-500">{r.date}</span>
                  </div>
                  <div className="text-[14px] font-semibold mt-0.5 mb-2">{r.title}</div>
                  <ul className="space-y-1.5">
                    {r.changes.map((c, j) => (
                      <li key={j} className="flex gap-2 text-[13px] leading-relaxed">
                        <span className={`shrink-0 h-fit text-[11px] font-bold px-2 py-0.5 rounded-full ${KIND[c.kind].cls}`}>{KIND[c.kind].label}</span>
                        <span>{c.text}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
