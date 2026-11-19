import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PRODUCT_ICONS } from '@/lib/product-icons';
import type { ProductItem } from '@/lib/products';

/** Product category cards. Brand / model / capacity / warranty / price render only when an admin has entered a verified value. */
export default function ProductsShowcase({ items }: { items: ProductItem[] }) {
  if (!items.length) return null;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map(p => {
        const Icon = (PRODUCT_ICONS[p.icon] || PRODUCT_ICONS.package).icon;
        const specs: [string, string][] = ([['ยี่ห้อ', p.brand], ['รุ่น', p.model], ['ขนาด', p.capacity], ['รับประกัน', p.warranty]] as [string, string][]).filter(([, v]) => v);
        return (
          <article key={p.id} className="lift group flex flex-col rounded-[24px] bg-white border border-[var(--line)] overflow-hidden">
            <div className="relative aspect-[16/10] bg-gradient-to-br from-[#EAF1E4] to-[#DDE8D5] flex items-center justify-center">
              {p.cover ? <Image src={p.cover} alt={p.title} fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" /> : <Icon size={56} className="text-[var(--navy)]/50" aria-hidden />}
            </div>
            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-[20px] font-bold text-[var(--navy)] tracking-tight">{p.title}</h3>
              {specs.length > 0 && <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">{specs.map(([k, v]) => <div key={k}><dt className="text-[11px] uppercase tracking-wide text-[var(--muted)]">{k}</dt><dd className="font-medium text-[var(--navy)]">{v}</dd></div>)}</dl>}
              <ul className="mt-3 space-y-1.5 text-[13.5px] text-[var(--muted)] leading-relaxed">{p.points.slice(0, 3).map(pt => <li key={pt} className="flex gap-2"><span className="mt-2 w-1.5 h-1.5 rounded-full bg-[var(--energy)] shrink-0" />{pt}</li>)}</ul>
              {p.price && <div className="mt-4 text-[15px] font-semibold text-[var(--navy)]">{p.price}</div>}
              <Link href="/quote" className="mt-5 inline-flex items-center gap-1.5 self-start text-[14px] font-semibold text-[var(--navy)] hover:text-[var(--emerald)] transition">Request a Quote <ArrowRight size={15} /></Link>
            </div>
          </article>);
      })}
    </div>
  );
}
