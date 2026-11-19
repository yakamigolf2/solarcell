import type { Metadata } from 'next';
import ProjectCard from '@/components/site/ProjectCard';
import { RevealItem, SectionTitle, Stagger } from '@/components/site/Reveal';
import { getPublishedProjects } from '@/lib/projects';

export const metadata: Metadata = { title: 'ผลงานการติดตั้ง' };
export const dynamic = 'force-dynamic';

export default async function Projects() {
  const items = await getPublishedProjects();
  return (
    <div className="max-w-[1200px] mx-auto px-5 pt-16">
      <SectionTitle eyebrow="Installation projects" title="ผลงานการติดตั้ง" text="ตัวอย่างโครงการทั้งบ้านพักอาศัย อาคารพาณิชย์ และโรงงาน" />
      {items.length === 0 ? <p className="glass rounded-3xl p-10 text-center text-[var(--muted)]">ยังไม่มีผลงาน</p> :
        <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{items.map(p => <RevealItem key={p.id}><ProjectCard p={p} /></RevealItem>)}</Stagger>}
    </div>
  );
}
