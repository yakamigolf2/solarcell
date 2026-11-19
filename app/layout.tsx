import type { Metadata, Viewport } from 'next';
import { Prompt } from 'next/font/google';
import './globals.css';

const prompt = Prompt({ subsets: ['thai', 'latin'], weight: ['300', '400', '500', '600', '700', '800'], variable: '--font-prompt', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'BGE SolarTech — โซลูชันพลังงานแสงอาทิตย์', template: '%s | BGE SolarTech' },
  description: 'ออกแบบ ติดตั้ง และดูแลระบบ Solar Cell ครบวงจร สำหรับบ้าน ที่อยู่อาศัย และธุรกิจ',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#102A43' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={prompt.variable}>
      <body>{children}</body>
    </html>
  );
}
