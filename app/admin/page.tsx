import type { Metadata } from 'next';
import SolarApp from '@/components/SolarApp';

export const metadata: Metadata = { title: 'Backoffice', robots: { index: false, follow: false } };

export default function AdminPage() {
  return <SolarApp />;
}
