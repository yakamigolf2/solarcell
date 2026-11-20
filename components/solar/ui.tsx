'use client';
import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { uploadImage } from '@/lib/upload';

export const LINE_GREEN = '#06C755';
export const LineIcon = ({ size = 18 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 3C6.48 3 2 6.58 2 11c0 3.96 3.55 7.27 8.35 7.9.32.07.77.21.88.49.1.25.07.65.03.9l-.14.85c-.04.25-.2.98.86.53 1.06-.45 5.73-3.38 7.82-5.78C21.23 14.3 22 12.74 22 11c0-4.42-4.48-8-10-8Z" /></svg>;

// Error boundary — never a white screen
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(p: any) { super(p); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() { /* guarded: show fallback instead of white screen */ }
  render() {
    if (this.state.hasError) return <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}><h1>BGE SolarPro Backoffice</h1><p>เกิดข้อผิดพลาดชั่วคราว กรุณารีโหลดหน้าเว็บอีกครั้ง</p><button onClick={() => { try { window.location.reload(); } catch { /* ignore */ } }} style={{ padding: '10px 16px', borderRadius: 999, background: '#0B7DFF', color: '#fff', border: 0 }}>รีโหลดหน้า</button></div>;
    return this.props.children;
  }
}

export function LogoText({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ background: '#0B7DFF', color: '#fff', fontWeight: 800, borderRadius: 12, padding: size === 'lg' ? '10px 14px' : '6px 10px', fontSize: size === 'lg' ? 22 : 16, letterSpacing: 1 }}>BGE</span>{size === 'lg' && <span style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>BETTER GROUP<br />ENGINEERING</span>}</div>;
}

export function UploadBtn({ folder, onUrl, onError, disabled, label = 'อัปโหลดรูป' }: { folder: 'photos' | 'slips'; onUrl: (url: string) => void; onError: (m: string) => void; disabled?: boolean; label?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <label className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[13px] font-semibold bg-white whitespace-nowrap ${disabled || busy ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:bg-gray-50'}`}>
      <Camera size={15} />{busy ? 'กำลังอัปโหลด…' : label}
      <input type="file" accept="image/*" className="hidden" disabled={disabled || busy} onChange={async e => {
        const input = e.currentTarget; const f = input.files?.[0]; if (!f) return;
        setBusy(true);
        try { onUrl(await uploadImage(f, folder)); } catch (err) { onError('อัปโหลดไม่สำเร็จ: ' + (err instanceof Error ? err.message : String(err))); }
        setBusy(false); input.value = '';
      }} />
    </label>
  );
}
