'use client';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export type ComboOption = { value: string; label: string; hint?: string; search?: string };

/** One field that is both a dropdown and a search box: type to filter, arrow keys + Enter to pick, Esc to close. */
export default function Combobox({ options, value, onChange, placeholder = 'พิมพ์เพื่อค้นหา หรือเลือกจากรายการ…', disabled, resetOnSelect, ariaLabel, className = '', allowCustom }: {
  options: ComboOption[]; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean; resetOnSelect?: boolean; ariaLabel?: string; className?: string;
  /** Free-hand mode: the typed text itself can be used as the value, even if it is not in the list. */
  allowCustom?: boolean;
}) {
  const uid = useId();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const selected = options.find(o => o.value === value);
  const qRef = useRef(q); qRef.current = q;
  const onChangeRef = useRef(onChange); onChangeRef.current = onChange;

  const typed = q.trim();
  const shown = useMemo(() => {
    const t = q.toLowerCase().trim();
    const list = t ? options.filter(o => `${o.label} ${o.hint ?? ''} ${o.search ?? ''}`.toLowerCase().includes(t)) : options;
    if (allowCustom && t && !options.some(o => o.label.toLowerCase() === t)) return [...list, { value: q.trim(), label: `+ ใช้ “${q.trim()}” (พิมพ์เอง)`, hint: 'ไม่ต้องมีในรายการ' }];
    return list;
  }, [options, q, allowCustom]);

  useEffect(() => { setActive(0); }, [q, open]);
  useEffect(() => {
    const away = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) { setOpen(false); if (allowCustom && !resetOnSelect && qRef.current.trim()) onChangeRef.current(qRef.current.trim()); setQ(''); } };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [allowCustom]);
  useEffect(() => { if (open) document.getElementById(`${uid}-o${active}`)?.scrollIntoView({ block: 'nearest' }); }, [active, open, uid]);

  const pick = (o: ComboOption) => { onChange(o.value); setQ(''); setOpen(false); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) setOpen(true); else setActive(a => Math.min(shown.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
    else if (e.key === 'Enter') { if (open && shown[active]) { e.preventDefault(); pick(shown[active]); } }
    else if (e.key === 'Escape') { setOpen(false); setQ(''); }
    else if (e.key === 'Tab') { setOpen(false); if (allowCustom && !resetOnSelect && typed) onChange(typed); setQ(''); }
  };
  const display = open ? q : (resetOnSelect ? '' : selected?.label ?? (allowCustom ? value : ''));

  return (
    <div ref={root} className={`relative ${className}`}>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden />
        <input
          role="combobox" aria-expanded={open} aria-controls={`${uid}-list`} aria-autocomplete="list" aria-label={ariaLabel} aria-activedescendant={open && shown[active] ? `${uid}-o${active}` : undefined}
          disabled={disabled} value={display} placeholder={(selected || (allowCustom && value)) && !resetOnSelect ? (selected?.label ?? value) : placeholder} autoComplete="off"
          onFocus={() => setOpen(true)} onClick={() => setOpen(true)} onChange={e => { setQ(e.target.value); setOpen(true); }} onKeyDown={onKey}
          className="w-full pl-9 pr-16 py-2.5 border rounded-xl text-[14px] bg-white disabled:bg-gray-100 placeholder:text-gray-400"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {value && !resetOnSelect && !disabled && <button type="button" aria-label="ล้างที่เลือก" onMouseDown={e => e.preventDefault()} onClick={() => { onChange(''); setQ(''); }} className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"><X size={14} /></button>}
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
        </div>
      </div>
      {open && (
        <ul id={`${uid}-list`} role="listbox" className="absolute z-30 mt-1 w-full max-h-64 overflow-auto rounded-xl border bg-white shadow-lg py-1">
          {shown.length === 0 ? <li className="px-3 py-3 text-[13px] text-gray-500">ไม่พบรายการที่ตรงกับ “{q}”</li> :
            shown.map((o, i) => (
              <li key={o.value} id={`${uid}-o${i}`} role="option" aria-selected={o.value === value} onMouseEnter={() => setActive(i)} onMouseDown={e => e.preventDefault()} onClick={() => pick(o)}
                className={`px-3 py-2 cursor-pointer text-[13.5px] flex items-center justify-between gap-3 ${i === active ? 'bg-blue-50' : ''} ${o.value === value ? 'font-semibold' : ''}`}>
                <span className="min-w-0 truncate">{o.label}</span>{o.hint && <span className="shrink-0 text-[12px] text-gray-500">{o.hint}</span>}
              </li>))}
        </ul>)}
    </div>
  );
}
