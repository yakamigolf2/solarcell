'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { MotionConfig } from 'motion/react';
import { ArrowRight, Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import { COMPANY, NAV } from '@/lib/site-data';
import RouteTransition from './RouteTransition';

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={COMPANY.brand}>
      <span className="bg-white rounded-xl p-1 shadow-sm"><Image src="/BGE_logo.png" alt="" width={36} height={36} className="w-9 h-9 object-contain" priority /></span>
      <span className={`font-bold text-[19px] tracking-tight ${light ? 'text-white' : 'text-[var(--navy)]'}`}>BGE <span className={light ? 'text-emerald-300' : 'text-[var(--emerald)]'}>SolarTech</span></span>
    </Link>
  );
}

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));
  return (
    <MotionConfig reducedMotion="user">
      <div className="site-theme relative min-h-screen overflow-x-clip">
        <RouteTransition />
        <header className="sticky top-3 z-50 mx-3 sm:mx-6 lg:mx-auto lg:max-w-[1200px]">
          <div className="glass rounded-full px-4 sm:px-6 h-16 flex items-center gap-4">
            <Brand />
            <nav className="hidden lg:flex items-center gap-1 mx-auto" aria-label="เมนูหลัก">
              {NAV.map(n => <Link key={n.href} href={n.href} aria-current={active(n.href) ? 'page' : undefined} className={`px-4 py-2 rounded-full text-[14px] font-medium transition ${active(n.href) ? 'bg-[var(--navy)] text-white shadow' : 'text-[var(--navy)] hover:bg-white/80'}`}>{n.label}</Link>)}
            </nav>
            <Link href="/quote" className="btn-primary ml-auto lg:ml-0 hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[14px] font-semibold">ขอใบเสนอราคา <ArrowRight size={16} /></Link>
            <button onClick={() => setOpen(!open)} className="lg:hidden ml-auto sm:ml-0 w-10 h-10 rounded-full bg-white/70 flex items-center justify-center" aria-label="เมนู" aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
          {open && (
            <div className="lg:hidden glass rounded-3xl mt-2 p-3 flex flex-col">
              {NAV.map(n => <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={`px-4 py-3 rounded-2xl text-[15px] font-medium ${active(n.href) ? 'bg-blue-50 text-blue-700' : ''}`}>{n.label}</Link>)}
              <Link href="/quote" onClick={() => setOpen(false)} className="btn-primary mt-2 text-center px-5 py-3 rounded-full font-semibold">ขอใบเสนอราคา</Link>
            </div>
          )}
        </header>

        <main>{children}</main>

        <footer className="mt-24 bg-[#123C32] text-white">
          <div className="max-w-[1200px] mx-auto px-5 py-14 grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2">
              <Brand light />
              <p className="mt-4 text-[14px] text-white/70 max-w-sm leading-relaxed">ออกแบบ ติดตั้ง และดูแลระบบ Solar Cell ครบวงจร สำหรับบ้าน อาคาร และโรงงาน</p>
              <p className="mt-3 text-[12px] text-white/50">{COMPANY.legal} • {COMPANY.legalEn}</p>
            </div>
            <div><h3 className="font-semibold mb-3">เมนู</h3><ul className="text-[14px] text-white/75">{NAV.map(n => <li key={n.href}><Link href={n.href} className="inline-block py-2 hover:text-white">{n.label}</Link></li>)}<li><Link href="/quote" className="inline-block py-2 hover:text-white">ขอใบเสนอราคา</Link></li></ul></div>
            <div><h3 className="font-semibold mb-3">ติดต่อเรา</h3><ul className="space-y-3 text-[14px] text-white/75">
              <li className="flex gap-2"><MapPin size={16} className="shrink-0 mt-0.5" />{COMPANY.address}</li>
              <li className="flex gap-2"><Phone size={16} className="shrink-0 mt-0.5" /><a href={COMPANY.phoneHref} className="hover:text-white">{COMPANY.phone}</a></li>
              <li className="flex gap-2"><Mail size={16} className="shrink-0 mt-0.5" /><a href={`mailto:${COMPANY.email}`} className="hover:text-white break-all">{COMPANY.email}</a></li></ul></div>
          </div>
          <div className="border-t border-white/10 py-5 text-center text-[12px] text-white/50">© {new Date().getFullYear()} {COMPANY.legalEn} • <Link href="/admin" className="hover:text-white/80">สำหรับพนักงาน</Link></div>
        </footer>
      </div>
    </MotionConfig>
  );
}
