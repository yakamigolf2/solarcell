'use client';
import { useId } from 'react';

// Isometric SVG house used by the hero (decorative) and the interactive energy-flow explorer.
export type Scenario = 'on-grid' | 'hybrid' | 'off-grid' | 'commercial';
export type PartId = 'solar' | 'inverter' | 'battery' | 'home' | 'grid';

type P3 = [number, number, number];
const S = 36, OX = 215, OY = 178;
const pt = ([x, y, z]: P3): [number, number] => [OX + (x - y) * S * 0.866, OY + (x + y) * S * 0.5 - z * S];
const poly = (ps: P3[]) => ps.map(p => pt(p).map(n => n.toFixed(1)).join(',')).join(' ');
const pathD = (ps: P3[]) => ps.map((p, i) => `${i ? 'L' : 'M'}${pt(p).map(n => n.toFixed(1)).join(' ')}`).join(' ');

const C = { forest: '#123C32', energy: '#72B65A', gold: '#E8BD65', wallTop: '#FFFFFF', wallL: '#FFFFFF', wallR: '#E3E8DB', roof: '#2B3A34', roofEdge: '#1B2723', panel: '#1F3C63', panelLine: '#7FA2CF', ground: '#E9EEE2', blue: '#4C8FD6' };

function Box({ x, y, z, w, d, h, top = C.wallTop, left = C.wallL, right = C.wallR }: { x: number; y: number; z: number; w: number; d: number; h: number; top?: string; left?: string; right?: string }) {
  return (
    <g>
      <polygon points={poly([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={top} />
      <polygon points={poly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={left} />
      <polygon points={poly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]])} fill={right} />
    </g>
  );
}

// world-space anchors for the energy flows
const A = {
  panel: [3.0, 3.7, 2.75] as P3, eave: [4.3, 4.1, 2.0] as P3,
  inv: [4.25, 4.1, 1.35] as P3, invLow: [4.25, 4.1, 0.55] as P3,
  board: [4.25, 1.8, 1.25] as P3, boardLow: [4.25, 1.8, 0.55] as P3,
  bat: [5.1, 3.6, 0.7] as P3,
  gridMeter: [4.25, 0.7, 0.55] as P3, gridOut: [6.8, 0.7, 0.12] as P3, gridPole: [7.4, 0.7, 0.9] as P3,
};
type Flow = { id: string; color: string; pts: P3[]; parts: PartId[]; label: string };
const FLOWS: Record<string, Flow> = {
  solarInv: { id: 'solarInv', color: C.gold, pts: [A.panel, [4.0, 4.1, 2.45], A.inv], parts: ['solar', 'inverter'], label: 'แผง → อินเวอร์เตอร์' },
  invHome: { id: 'invHome', color: C.gold, pts: [A.inv, [4.25, 4.1, 0.95], [4.25, 1.8, 0.95], A.board], parts: ['inverter', 'home'], label: 'อินเวอร์เตอร์ → บ้าน' },
  homeGridOut: { id: 'homeGridOut', color: C.gold, pts: [A.boardLow, [4.25, 1.8, 0.4], [4.25, 0.7, 0.4], [5.2, 0.7, 0.12], A.gridOut], parts: ['home', 'grid'], label: 'บ้าน → กริด (ไฟส่วนเกิน)' },
  gridHomeIn: { id: 'gridHomeIn', color: C.blue, pts: [A.gridOut, [5.0, 1.0, 0.08], [4.25, 1.05, 0.3], [4.25, 1.8, 0.75]], parts: ['grid', 'home'], label: 'กริด → บ้าน (ซื้อไฟ)' },
  invBat: { id: 'invBat', color: C.energy, pts: [A.invLow, [4.6, 4.1, 0.3], A.bat], parts: ['inverter', 'battery'], label: 'อินเวอร์เตอร์ → แบตเตอรี่ (ชาร์จ)' },
  batHome: { id: 'batHome', color: C.energy, pts: [[5.0, 3.3, 0.35], [4.5, 2.9, 0.12], [4.25, 2.6, 0.45], [4.25, 1.85, 0.8]], parts: ['battery', 'home'], label: 'แบตเตอรี่ → บ้าน (จ่ายไฟ)' },
  invGrid: { id: 'invGrid', color: C.gold, pts: [[4.25, 4.1, 0.4], [4.9, 4.9, 0.1], [7.0, 3.2, 0.1], [7.2, 1.0, 0.1], A.gridOut], parts: ['inverter', 'grid'], label: 'ไฟส่วนเกิน → กริด' },
};
export const SCENARIO_FLOWS: Record<Scenario, string[]> = {
  'on-grid': ['solarInv', 'invHome', 'homeGridOut', 'gridHomeIn'],
  hybrid: ['solarInv', 'invHome', 'invBat', 'batHome', 'homeGridOut'],
  'off-grid': ['solarInv', 'invBat', 'batHome'],
  commercial: ['solarInv', 'invHome', 'homeGridOut', 'gridHomeIn'],
};

/** Where a callout chip should sit over the SVG, as % of the viewBox (560 x 450). */
export function partAnchor(p: PartId): { left: string; top: string } {
  const at: Record<PartId, P3> = { solar: [2.6, 1.6, 3.5], inverter: [4.3, 4.3, 1.7], battery: [5.1, 3.6, 1.45], home: [1.8, 5.1, 1.7], grid: [7.55, 0.5, 3.4] };
  const [x, y] = pt(at[p]);
  return { left: `${(x / 560 * 100).toFixed(1)}%`, top: `${(y / 482 * 100).toFixed(1)}%` };
}
export const FLOW_LABELS = FLOWS;

export default function IsoScene({ scenario = 'hybrid', selected = null, onSelect, interactive = false, className = '', hideFlows = false }: { scenario?: Scenario; selected?: PartId | null; onSelect?: (p: PartId) => void; interactive?: boolean; className?: string; hideFlows?: boolean }) {
  const uid = useId().replace(/:/g, '');
  const hasBattery = scenario === 'hybrid' || scenario === 'off-grid';
  const hasGrid = scenario !== 'off-grid';
  const active = SCENARIO_FLOWS[scenario].map(k => FLOWS[k]);
  const dim = (p: PartId) => (selected && selected !== p ? 0.55 : 1);
  const hot = (p: PartId, label: string) => interactive ? ({
    role: 'button', tabIndex: 0, 'aria-label': label, 'aria-pressed': selected === p, className: 'iso-hot', onClick: () => onSelect?.(p),
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(p); } },
  }) : ({ 'aria-hidden': true });
  const glow = (p: PartId) => (selected === p ? `url(#glow${uid})` : undefined);

  // roof panel grid on the +x slope
  const panels: P3[][] = [];
  const slope = (u: number, v: number): P3 => [4.3 - 2.3 * u, -0.3 + 5.6 * v, 2.0 + 1.6 * u];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
    const u0 = 0.14 + r * 0.38, u1 = u0 + 0.34, v0 = 0.07 + c * 0.225, v1 = v0 + 0.2;
    panels.push([slope(u0, v0), slope(u0, v1), slope(u1, v1), slope(u1, v0)]);
  }
  const sunC: [number, number] = [86, 78]; // fixed inside the viewBox so the glow never spills over content above the scene

  return (
    <svg viewBox="0 0 560 482" className={className} role="img" aria-label={interactive ? 'ภาพจำลองระบบโซลาร์เซลล์บนบ้าน คลิกส่วนประกอบเพื่อดูรายละเอียด' : 'ภาพประกอบบ้านที่ติดตั้งโซลาร์เซลล์'}>
      <defs>
        <filter id={`glow${uid}`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <radialGradient id={`sun${uid}`}><stop offset="0" stopColor="#FFE9A8" /><stop offset="1" stopColor="#E8BD65" stopOpacity="0" /></radialGradient>
        <linearGradient id={`pv${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2C568C" /><stop offset="1" stopColor="#16294A" /></linearGradient>
        {Object.values(FLOWS).map(f => <marker key={f.id} id={`ah-${f.id}-${uid}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill={f.color} /></marker>)}
      </defs>

      {/* sun + beams */}
      <g aria-hidden>
        <circle cx={sunC[0]} cy={sunC[1]} r="54" fill={`url(#sun${uid})`} />
        <circle cx={sunC[0]} cy={sunC[1]} r="21" fill={C.gold} />
        <g stroke={C.gold} strokeWidth="2.5" strokeLinecap="round" className="iso-rays">{Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return <line key={i} x1={(sunC[0] + Math.cos(a) * 30).toFixed(1)} y1={(sunC[1] + Math.sin(a) * 30).toFixed(1)} x2={(sunC[0] + Math.cos(a) * 40).toFixed(1)} y2={(sunC[1] + Math.sin(a) * 40).toFixed(1)} />; })}</g>
        <path d={`M${sunC[0] + 26} ${sunC[1] + 12} L${pt([2.6, 1.2, 3.2]).join(' ')}`} stroke={C.gold} strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" opacity=".8" />
        <path d={`M${sunC[0] + 30} ${sunC[1] + 4} L${pt([2.0, 3.6, 3.4]).join(' ')}`} stroke={C.gold} strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" opacity=".6" />
      </g>

      {/* ground */}
      <polygon points={poly([[-1.2, -1.4, 0], [9, -1.4, 0], [9, 6.6, 0], [-1.2, 6.6, 0]])} fill={C.ground} />
      <polygon points={poly([[-1.2, 6.6, 0], [9, 6.6, 0], [9, 6.6, -0.18], [-1.2, 6.6, -0.18]])} fill="#D5DACE" />
      <polygon points={poly([[9, -1.4, 0], [9, 6.6, 0], [9, 6.6, -0.18], [9, -1.4, -0.18]])} fill="#C9CFC1" />

      {/* utility pylon */}
      <g {...hot('grid', 'สายส่งไฟฟ้า (กริด)')} opacity={hasGrid ? dim('grid') : 0.28} filter={hasGrid ? glow('grid') : undefined}>
        <polygon points={`${pt([7.2, 0.5, 0]).join(',')} ${pt([7.9, 0.5, 0]).join(',')} ${pt([7.55, 0.5, 3.2]).join(',')}`} fill="none" stroke={C.forest} strokeWidth="2.5" strokeLinejoin="round" />
        <path d={`M${pt([7.3, 0.5, 1.2]).join(' ')} L${pt([7.8, 0.5, 1.2]).join(' ')} M${pt([7.38, 0.5, 2.1]).join(' ')} L${pt([7.72, 0.5, 2.1]).join(' ')} M${pt([7.0, 0.5, 2.6]).join(' ')} L${pt([8.1, 0.5, 2.6]).join(' ')}`} stroke={C.forest} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={pt([7.55, 0.5, 3.3])[0]} cy={pt([7.55, 0.5, 3.3])[1]} r="3" fill={hasGrid ? C.energy : '#B7BDB2'} />
        {interactive && <rect x={pt([7.0, 0.5, 3.4])[0] - 4} y={pt([7.0, 0.5, 3.4])[1] - 6} width="64" height="150" fill="transparent" />}
      </g>

      {/* house walls */}
      <g opacity={dim('home')} filter={glow('home')} {...hot('home', 'บ้านและเครื่องใช้ไฟฟ้า')}>
        <polygon points={poly([[-0.2, -0.2, 0], [4.9, -0.2, 0], [5.6, 5.9, 0], [-0.2, 5.9, 0]])} fill="#1B2723" opacity=".09" />
        <polygon points={poly([[0, 5, 0], [4, 5, 0], [4, 5, 2], [2, 5, 3.6], [0, 5, 2]])} fill={C.wallL} stroke="#C9D1C2" strokeWidth="1.2" strokeLinejoin="round" />
        <polygon points={poly([[4, 0, 0], [4, 5, 0], [4, 5, 2], [4, 0, 2]])} fill={C.wallR} stroke="#C9D1C2" strokeWidth="1.2" strokeLinejoin="round" />
        {/* door + window on +y gable */}
        <polygon points={poly([[0.5, 5, 0], [1.4, 5, 0], [1.4, 5, 1.55], [0.5, 5, 1.55]])} fill="#6E7A72" />
        <polygon points={poly([[2.5, 5, 0.9], [3.4, 5, 0.9], [3.4, 5, 1.6], [2.5, 5, 1.6]])} fill="#FFF3CF" stroke="#fff" strokeWidth="2" />
        <polygon points={poly([[4, 2.4, 0.9], [4, 3.3, 0.9], [4, 3.3, 1.6], [4, 2.4, 1.6]])} fill="#FFF3CF" stroke="#fff" strokeWidth="2" />
        {/* AC unit */}
        <Box x={1.7} y={5} z={1.25} w={1.4} d={0.22} h={0.5} top="#fff" left="#F4F5F1" right="#E6E9E2" />
        <path d={`M${pt([1.85, 5.23, 1.38]).join(' ')} L${pt([2.95, 5.23, 1.38]).join(' ')}`} stroke="#B9C0B4" strokeWidth="2" strokeLinecap="round" />
        <circle cx={pt([2.2, 5.3, 0.6])[0]} cy={pt([2.2, 5.3, 0.6])[1]} r="0" />
      </g>

      {/* roof */}
      <g aria-hidden>
        <polygon points={poly([[4.3, -0.3, 2], [4.3, 5.3, 2], [2, 5.3, 3.6], [2, -0.3, 3.6]])} fill={C.roof} />
        <polygon points={poly([[2, 5.3, 3.6], [-0.3, 5.3, 2], [-0.3, 5.3, 1.85], [4.3, 5.3, 1.85], [4.3, 5.3, 2]])} fill={C.roofEdge} />
      </g>

      {/* solar panels */}
      <g {...hot('solar', 'แผงโซลาร์เซลล์')} opacity={dim('solar')} filter={glow('solar')}>
        {panels.map((p, i) => <g key={i}><polygon points={poly(p)} fill={`url(#pv${uid})`} stroke="#CFE0F5" strokeWidth="1.6" strokeLinejoin="round" />
          <path d={`M${pt([(p[0][0] + p[3][0]) / 2, (p[0][1] + p[3][1]) / 2, (p[0][2] + p[3][2]) / 2]).join(' ')} L${pt([(p[1][0] + p[2][0]) / 2, (p[1][1] + p[2][1]) / 2, (p[1][2] + p[2][2]) / 2]).join(' ')}`} stroke={C.panelLine} strokeWidth=".8" opacity=".7" /></g>)}
        <polygon points={poly([slope(0.14, 0.07), slope(0.14, 0.93), slope(0.86, 0.93), slope(0.86, 0.07)])} fill="#FFE9A8" opacity=".12" />
      </g>

      {/* wall equipment */}
      <g {...hot('inverter', scenario === 'hybrid' ? 'ไฮบริดอินเวอร์เตอร์' : scenario === 'off-grid' ? 'อินเวอร์เตอร์และชาร์จคอนโทรลเลอร์' : 'อินเวอร์เตอร์')} opacity={dim('inverter')} filter={glow('inverter')}>
        <Box x={4} y={3.7} z={0.8} w={0.3} d={0.85} h={0.85} top="#fff" left="#F5F6F2" right="#E9ECE4" />
        <circle cx={pt([4.3, 4.12, 1.2])[0]} cy={pt([4.3, 4.12, 1.2])[1]} r="3.2" fill={C.energy} />
      </g>
      <g aria-hidden opacity={dim('home')}>
        <Box x={4} y={1.5} z={0.9} w={0.25} d={0.6} h={0.65} top="#fff" left="#F5F6F2" right="#E3E7DD" />
        <Box x={4} y={0.5} z={0.6} w={0.22} d={0.4} h={0.5} top="#fff" left="#F5F6F2" right="#E3E7DD" />
      </g>

      {/* battery */}
      <g {...hot('battery', 'แบตเตอรี่')} opacity={hasBattery ? dim('battery') : 0.22} filter={hasBattery ? glow('battery') : undefined}>
        <Box x={4.7} y={3.1} z={0} w={0.8} d={0.9} h={1.25} top="#fff" left="#F2F4EE" right="#DDE3D8" />
        <polygon points={poly([[5.5, 3.2, 0.18], [5.5, 3.9, 0.18], [5.5, 3.9, 1.0], [5.5, 3.2, 1.0]])} fill={hasBattery ? C.energy : '#C7CCC1'} opacity=".9" />
        {[0.3, 0.52, 0.74].map(z => <path key={z} d={`M${pt([5.5, 3.28, z]).join(' ')} L${pt([5.5, 3.82, z]).join(' ')}`} stroke="#fff" strokeWidth="1.6" opacity=".8" />)}
      </g>

      {/* energy flows */}
      {!hideFlows && (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {active.map(f => {
            const on = !selected || f.parts.includes(selected);
            return (
              <g key={f.id} opacity={on ? 1 : 0.18}>
                <path d={pathD(f.pts)} stroke={f.color} strokeWidth="6" opacity=".18" />
                <path d={pathD(f.pts)} stroke={f.color} strokeWidth="3" strokeDasharray="7 9" className="iso-flow" markerEnd={`url(#ah-${f.id}-${uid})`} />
              </g>);
          })}
        </g>
      )}
    </svg>
  );
}
