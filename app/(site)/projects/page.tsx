import type { Metadata } from 'next';
import { MapPin } from 'lucide-react';
import { RevealItem, SectionTitle, Stagger } from '@/components/site/Reveal';
import { PROJECTS } from '@/lib/site-data';

export const metadata: Metadata = { title: 'ผลงานการติดตั้ง' };

export default function Projects() {
  return (
    <div className="max-w-[1200px] mx-auto px-5 pt-16">
      <SectionTitle eyebrow="Installation projects" title="ผลงานการติดตั้ง" text="ตัวอย่างโครงการทั้งบ้านพักอาศัย อาคารพาณิชย์ และโรงงาน" />
      <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {PROJECTS.map(p => (
          <RevealItem key={p.id}><article className="lift glass rounded-[28px] overflow-hidden h-full">
            <div className={`h-48 bg-gradient-to-br ${p.hue} relative`} aria-hidden><span className="absolute bottom-3 left-4 text-white text-[13px] font-semibold bg-black/20 rounded-full px-3 py-1">{p.kw} kWp</span></div>
            <div className="p-5"><div className="flex items-center gap-1 text-[12px] text-[var(--emerald)] font-semibold"><MapPin size={13} />{p.type} • {p.place}</div><h2 className="mt-1 font-bold text-[17px] text-[var(--navy)] leading-snug">{p.title}</h2><p className="mt-2 text-[14px] text-[var(--muted)] leading-relaxed">{p.text}</p></div>
          </article></RevealItem>))}
      </Stagger>
    </div>
  );
}
