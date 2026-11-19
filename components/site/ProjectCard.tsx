import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { hueFor, type ProjectItem } from '@/lib/projects';

export default function ProjectCard({ p }: { p: ProjectItem }) {
  return (
    <article className="lift glass rounded-[28px] overflow-hidden h-full">
      <div className={`h-48 relative bg-gradient-to-br ${hueFor(p.id)}`}>
        {p.cover && <Image src={p.cover} alt={p.title} fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover" />}
        {p.kw > 0 && <span className="absolute bottom-3 left-4 text-white text-[13px] font-semibold bg-black/30 rounded-full px-3 py-1">{p.kw} kWp</span>}
      </div>
      <div className="p-5"><div className="flex items-center gap-1 text-[12px] text-[var(--emerald)] font-semibold"><MapPin size={13} />{p.type}{p.place && ` • ${p.place}`}</div><h3 className="mt-1 font-bold text-[17px] text-[var(--navy)] leading-snug">{p.title}</h3>{p.text && <p className="mt-2 text-[14px] text-[var(--muted)] leading-relaxed line-clamp-3">{p.text}</p>}</div>
    </article>
  );
}
