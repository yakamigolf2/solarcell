'use client';
import dynamic from 'next/dynamic';

// Loaded on demand so the interactive explorer doesn't weigh on first paint.
const ExperienceSection = dynamic(() => import('./ExperienceSection'), {
  ssr: false,
  loading: () => <div className="skeleton h-[520px] w-full" aria-busy="true" />,
});

export default function LazyExperience() { return <ExperienceSection />; }
