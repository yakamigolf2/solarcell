import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'BGE Solar CRM', description: 'ระบบจัดการงานติดตั้งโซลาร์เซลล์' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
