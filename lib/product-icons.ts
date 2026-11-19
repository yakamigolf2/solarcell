import { BatteryCharging, Bird, Cable, Cpu, Package, ShieldCheck, Sun, Zap, type LucideIcon } from 'lucide-react';

export const PRODUCT_ICONS: Record<string, { label: string; icon: LucideIcon }> = {
  sun: { label: 'แผงโซลาร์', icon: Sun },
  cpu: { label: 'อินเวอร์เตอร์', icon: Cpu },
  battery: { label: 'แบตเตอรี่', icon: BatteryCharging },
  shield: { label: 'อุปกรณ์ป้องกัน', icon: ShieldCheck },
  cable: { label: 'สายไฟ/โครงสร้าง', icon: Cable },
  bird: { label: 'อุปกรณ์เสริม', icon: Bird },
  zap: { label: 'ระบบไฟฟ้า', icon: Zap },
  package: { label: 'อื่น ๆ', icon: Package },
};
export const HUES = ['from-sky-300 to-blue-600', 'from-emerald-300 to-teal-600', 'from-amber-300 to-orange-500', 'from-indigo-300 to-violet-600', 'from-cyan-300 to-sky-600', 'from-fuchsia-300 to-purple-600'];
