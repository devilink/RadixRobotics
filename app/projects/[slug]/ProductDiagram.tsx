import type { ReactNode } from 'react';
import type { CapstoneBuild } from '../builds';
import BlueprintSheet, { C, MONO, SANS, type SheetIds } from './BlueprintSheet';

// Product drawings: what each build physically looks like, with numbered callouts
// (listed in the key under the drawing) and the dimensions the guide relies on.

type Callout = { n: number; label: string; x: number; y: number; bx: number; by: number };
type Drawing = { views: string; callouts: Callout[]; art: (ids: SheetIds) => ReactNode };

/* ---------- drawing helpers ---------- */

function ViewTitle({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <text x={x} y={y} fontFamily={MONO} fontSize="11" fontWeight="700" letterSpacing="1.5" fill="#cfe6ff">
      {children}
    </text>
  );
}

function Ground({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  const hatches = [];
  for (let x = x1 + 6; x < x2; x += 14) hatches.push(`M${x} ${y + 1}l-10 10`);
  return (
    <g stroke={C.line}>
      <line x1={x1} y1={y} x2={x2} y2={y} strokeWidth="2" />
      <path d={hatches.join('')} strokeOpacity="0.45" />
    </g>
  );
}

/** Dimension line with arrowheads, extension ticks and a centred label. */
function Dim({ x1, y1, x2, y2, label, ids }: { x1: number; y1: number; x2: number; y2: number; label: string; ids: SheetIds }) {
  const vertical = Math.abs(x2 - x1) < Math.abs(y2 - y1);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const lw = label.length * 6.1 + 10;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.line} strokeWidth="1" markerStart={`url(#${ids.dim})`} markerEnd={`url(#${ids.dim})`} />
      {vertical ? (
        <g transform={`rotate(-90 ${mx} ${my})`}>
          <rect x={mx - lw / 2} y={my - 8} width={lw} height="16" fill={C.paper} />
          <text x={mx} y={my + 4} textAnchor="middle" fontFamily={MONO} fontSize="10.5" fill={C.line}>{label}</text>
        </g>
      ) : (
        <g>
          <rect x={mx - lw / 2} y={my - 8} width={lw} height="16" fill={C.paper} />
          <text x={mx} y={my + 4} textAnchor="middle" fontFamily={MONO} fontSize="10.5" fill={C.line}>{label}</text>
        </g>
      )}
    </g>
  );
}

/** Thick structural member drawn with an outline (arm links, drone arms). */
function Member({ x1, y1, x2, y2, w = 18, fill = C.part }: { x1: number; y1: number; x2: number; y2: number; w?: number; fill?: string }) {
  return (
    <g strokeLinecap="round">
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.line} strokeWidth={w + 3} />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={fill} strokeWidth={w} />
    </g>
  );
}

function Joint({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={C.partDark} stroke={C.line} strokeWidth="1.6" />
      <circle cx={x} cy={y} r={r * 0.3} fill={C.accent} />
    </g>
  );
}

function Tag({ x, y, children, size = 10 }: { x: number; y: number; children: string; size?: number }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontFamily={MONO} fontSize={size} fontWeight="700" fill="#ffffff">
      {children}
    </text>
  );
}

const part = { fill: C.part, stroke: C.line, strokeWidth: 1.6 };
const dark = { fill: C.partDark, stroke: C.line, strokeWidth: 1.6 };
const light = { fill: C.partLight, stroke: C.line, strokeWidth: 1.6 };
const accent = { fill: C.accent, stroke: C.line, strokeWidth: 1.6 };
const hidden = { fill: 'none', stroke: C.line, strokeWidth: 1, strokeDasharray: '4 4', strokeOpacity: 0.6 };

/* ---------- 1. ROS 2 LiDAR rover: top + side view ---------- */

const rover: Drawing = {
  views: 'TOP + SIDE VIEW',
  callouts: [
    { n: 1, label: 'RPLIDAR A1, scan plane above everything else', x: 236, y: 130, bx: 310, by: 78 },
    { n: 2, label: 'Raspberry Pi 4 running ROS 2', x: 128, y: 214, bx: 40, by: 112 },
    { n: 3, label: 'ESP32 motor controller', x: 300, y: 210, bx: 398, by: 160 },
    { n: 4, label: 'MDD10A dual motor driver', x: 304, y: 252, bx: 398, by: 290 },
    { n: 5, label: '3S LiPo with main switch + fuse', x: 160, y: 292, bx: 40, by: 300 },
    { n: 6, label: 'Drive wheel on encoder gear motor; 210 mm between wheel centres is WHEEL_BASE in the code', x: 344, y: 186, bx: 398, by: 210 },
    { n: 7, label: 'Rear caster', x: 216, y: 322, bx: 300, by: 404 },
    { n: 8, label: 'Two-deck chassis on standoffs', x: 730, y: 292, bx: 768, by: 236 },
  ],
  art: (ids) => (
    <g>
      {/* TOP VIEW */}
      <ViewTitle x={30} y={42}>TOP VIEW</ViewTitle>
      <line x1="210" y1="104" x2="210" y2="84" stroke={C.line} strokeWidth="1.6" markerEnd={`url(#${ids.arrow})`} />
      <text x="210" y="74" textAnchor="middle" fontFamily={MONO} fontSize="10" fill="#cfe6ff">FRONT</text>
      <rect x="90" y="110" width="240" height="220" rx="14" {...part} />
      <rect x="64" y="168" width="24" height="84" rx="4" {...dark} />
      <rect x="332" y="168" width="24" height="84" rx="4" {...dark} />
      <line x1="88" y1="210" x2="332" y2="210" {...hidden} />
      <circle cx="210" cy="152" r="52" {...hidden} />
      <circle cx="210" cy="152" r="34" {...light} />
      <circle cx="210" cy="152" r="13" {...accent} />
      <rect x="108" y="198" width="84" height="56" rx="3" {...light} />
      <Tag x={150} y={230}>PI 4</Tag>
      <rect x="228" y="198" width="84" height="32" rx="3" {...light} />
      <Tag x={270} y={218}>ESP32</Tag>
      <rect x="228" y="238" width="84" height="22" rx="3" {...dark} />
      <Tag x={270} y={253} size={9}>MDD10A</Tag>
      <rect x="130" y="272" width="160" height="30" rx="3" {...accent} />
      <Tag x={210} y={291}>3S LiPo</Tag>
      <circle cx="210" cy="318" r="8" {...dark} />
      <line x1="76" y1="252" x2="76" y2="372" {...hidden} />
      <line x1="344" y1="252" x2="344" y2="372" {...hidden} />
      <Dim x1={76} y1={364} x2={344} y2={364} label="210 mm track" ids={ids} />

      {/* SIDE VIEW (front to the left) */}
      <ViewTitle x={440} y={42}>SIDE VIEW</ViewTitle>
      <Ground x1={440} x2={784} y={380} />
      <rect x="470" y="266" width="270" height="7" {...part} />
      <rect x="470" y="312" width="270" height="8" {...part} />
      <line x1="480" y1="273" x2="480" y2="312" stroke={C.line} strokeWidth="2" />
      <line x1="730" y1="273" x2="730" y2="312" stroke={C.line} strokeWidth="2" />
      <rect x="490" y="290" width="80" height="22" rx="2" {...light} />
      <rect x="610" y="284" width="110" height="28" rx="2" {...accent} />
      <rect x="478" y="246" width="64" height="20" rx="2" {...light} />
      <rect x="486" y="228" width="48" height="18" rx="3" {...accent} />
      <circle cx="560" cy="348" r="32" {...dark} />
      <circle cx="560" cy="348" r="6" fill={C.line} />
      <line x1="715" y1="320" x2="715" y2="364" stroke={C.line} strokeWidth="2" />
      <circle cx="715" cy="372" r="8" {...dark} />
      {/* LiDAR offset from the axle: matches the static transform in the guide */}
      <line x1="510" y1="228" x2="510" y2="196" {...hidden} />
      <line x1="560" y1="316" x2="560" y2="196" {...hidden} />
      <Dim x1={510} y1={204} x2={560} y2={204} label="x 0.08 m" ids={ids} />
      <line x1="478" y1="237" x2="446" y2="237" {...hidden} />
      <line x1="528" y1="348" x2="446" y2="348" {...hidden} />
      <Dim x1={454} y1={237} x2={454} y2={348} label="z 0.15 m" ids={ids} />
      <Dim x1={470} y1={420} x2={740} y2={420} label="250 mm" ids={ids} />
      <line x1="470" y1="320" x2="470" y2="428" {...hidden} />
      <line x1="740" y1="320" x2="740" y2="428" {...hidden} />
    </g>
  ),
};

/* ---------- 2. Survey drone: top + side view ---------- */

function Motor({ x, y, n, dir, ids }: { x: number; y: number; n: number; dir: 'CW' | 'CCW'; ids: SheetIds }) {
  // Rotation arc: clockwise sweeps right-to-left over the top, CCW the other way.
  const r = 38;
  const arc = dir === 'CW'
    ? `M${x - r * 0.7} ${y - r * 0.7}A${r} ${r} 0 0 1 ${x + r * 0.7} ${y - r * 0.7}`
    : `M${x + r * 0.7} ${y - r * 0.7}A${r} ${r} 0 0 0 ${x - r * 0.7} ${y - r * 0.7}`;
  return (
    <g>
      <circle cx={x} cy={y} r="60" fill="none" stroke={C.line} strokeOpacity="0.55" strokeDasharray="5 5" />
      <path d={arc} fill="none" stroke={C.power} strokeWidth="1.6" markerEnd={`url(#${ids.arrowPower})`} />
      <circle cx={x} cy={y} r="15" {...dark} />
      <Tag x={x} y={y + 4}>{`M${n}`}</Tag>
      <text x={x} y={y + 34} textAnchor="middle" fontFamily={MONO} fontSize="10" fill={C.powerLabel}>{dir}</text>
    </g>
  );
}

const drone: Drawing = {
  views: 'TOP + SIDE VIEW',
  callouts: [
    { n: 1, label: 'Pixhawk 6C, arrow facing forward', x: 248, y: 226, bx: 432, by: 228 },
    { n: 2, label: 'M10 GPS + compass on folding mast', x: 238, y: 270, bx: 432, by: 270 },
    { n: 3, label: '2212 920 KV motor (numbered as in ArduPilot Quad-X)', x: 352, y: 138, bx: 432, by: 104 },
    { n: 4, label: '1045 propeller, check spin direction', x: 392, y: 160, bx: 432, by: 150 },
    { n: 5, label: '4S 5200 mAh LiPo, strapped under the body', x: 650, y: 330, bx: 712, by: 372 },
    { n: 6, label: 'Optical flow + rangefinder, facing down', x: 612, y: 344, bx: 548, by: 432 },
    { n: 7, label: 'SiK telemetry radio antenna', x: 700, y: 330, bx: 770, by: 372 },
    { n: 8, label: 'Landing gear', x: 665, y: 396, bx: 742, by: 432 },
  ],
  art: (ids) => (
    <g>
      {/* TOP VIEW */}
      <ViewTitle x={30} y={42}>TOP VIEW</ViewTitle>
      <line x1="230" y1="96" x2="230" y2="76" stroke={C.line} strokeWidth="1.6" markerEnd={`url(#${ids.arrow})`} />
      <text x="230" y="66" textAnchor="middle" fontFamily={MONO} fontSize="10" fill="#cfe6ff">FRONT</text>
      <Member x1={230} y1={240} x2={120} y2={130} w={10} />
      <Member x1={230} y1={240} x2={340} y2={130} w={10} />
      <Member x1={230} y1={240} x2={120} y2={350} w={10} />
      <Member x1={230} y1={240} x2={340} y2={350} w={10} />
      <Motor x={340} y={130} n={1} dir="CCW" ids={ids} />
      <Motor x={120} y={350} n={2} dir="CCW" ids={ids} />
      <Motor x={120} y={130} n={3} dir="CW" ids={ids} />
      <Motor x={340} y={350} n={4} dir="CW" ids={ids} />
      <rect x="195" y="195" width="70" height="90" rx="10" {...part} />
      <rect x="210" y="212" width="40" height="34" rx="3" {...accent} />
      <path d="M230 216l7 10h-5v14h-4v-14h-5z" fill="#ffffff" />
      <circle cx="230" cy="268" r="10" {...light} />
      <line x1="120" y1="372" x2="120" y2="432" {...hidden} />
      <line x1="340" y1="372" x2="340" y2="432" {...hidden} />
      <Dim x1={120} y1={426} x2={340} y2={426} label="318 mm · 450 mm diagonal" ids={ids} />

      {/* SIDE VIEW */}
      <ViewTitle x={470} y={42}>SIDE VIEW</ViewTitle>
      <Ground x1={466} x2={784} y={400} />
      <line x1="460" y1="280" x2="560" y2="280" stroke={C.line} strokeWidth="2.5" />
      <line x1="680" y1="280" x2="780" y2="280" stroke={C.line} strokeWidth="2.5" />
      <Member x1={510} y1={300} x2={730} y2={300} w={7} />
      <rect x="500" y="282" width="20" height="18" rx="2" {...dark} />
      <rect x="720" y="282" width="20" height="18" rx="2" {...dark} />
      <line x1="620" y1="296" x2="620" y2="238" stroke={C.line} strokeWidth="2.5" />
      <rect x="600" y="228" width="40" height="10" rx="3" {...light} />
      <rect x="580" y="294" width="80" height="28" rx="6" {...part} />
      <rect x="588" y="322" width="64" height="16" rx="2" {...accent} />
      <rect x="602" y="338" width="20" height="8" rx="1" {...light} />
      <line x1="700" y1="300" x2="700" y2="330" stroke={C.line} strokeWidth="2" />
      <circle cx="700" cy="332" r="3" fill={C.line} />
      <path d="M595 338L575 398M645 338L665 398" stroke={C.line} strokeWidth="2.5" />
      <path d="M560 398H592M650 398H682" stroke={C.line} strokeWidth="4" strokeLinecap="round" />
      <line x1="460" y1="280" x2="470" y2="280" {...hidden} />
      <Dim x1={480} y1={280} x2={480} y2={400} label="≈ 230 mm" ids={ids} />
    </g>
  ),
};

/* ---------- 3. Vision robotic arm: side view + base sweep ---------- */

// Joint positions (side view): shoulder S, elbow E, wrist W, gripper root G.
const S = { x: 180, y: 330 };
const E = { x: 266, y: 207 };
const W = { x: 401, y: 243 };
const G = { x: 431, y: 251 };

const arm: Drawing = {
  views: 'SIDE VIEW + BASE SWEEP',
  callouts: [
    { n: 1, label: 'Base yaw servo (MG996R) in the turntable', x: 160, y: 368, bx: 56, by: 344 },
    { n: 2, label: 'Shoulder servo (MG996R)', x: 170, y: 322, bx: 90, by: 270 },
    { n: 3, label: 'Elbow servo (MG996R)', x: 272, y: 198, bx: 232, by: 116 },
    { n: 4, label: 'Wrist pitch servo (MG90S)', x: 404, y: 234, bx: 380, by: 166 },
    { n: 5, label: 'Wrist roll servo (MG90S)', x: 418, y: 246, bx: 446, by: 178 },
    { n: 6, label: 'Gripper servo (MG90S)', x: 466, y: 262, bx: 500, by: 302 },
    { n: 7, label: 'PCA9685 + ESP32 receiver on the base plate', x: 128, y: 372, bx: 56, by: 390 },
    { n: 8, label: 'Base plate, clamp it to the desk', x: 238, y: 392, bx: 290, by: 408 },
  ],
  art: (ids) => (
    <g>
      <ViewTitle x={30} y={42}>SIDE VIEW</ViewTitle>
      <Ground x1={40} x2={490} y={400} />
      {/* axis of base rotation */}
      <line x1={S.x} y1="296" x2={S.x} y2="440" stroke={C.line} strokeOpacity="0.6" strokeDasharray="10 3 2 3" />
      <rect x="110" y="380" width="140" height="20" rx="2" {...dark} />
      <rect x="114" y="366" width="28" height="14" rx="1" {...accent} />
      <rect x="145" y="356" width="70" height="24" rx="3" {...part} />
      <rect x="160" y="314" width="40" height="42" rx="3" {...light} />
      <Member x1={S.x} y1={S.y} x2={E.x} y2={E.y} />
      <Member x1={E.x} y1={E.y} x2={W.x} y2={W.y} w={15} />
      <Member x1={W.x} y1={W.y} x2={G.x} y2={G.y} w={11} fill={C.partLight} />
      <path d={`M${G.x} ${G.y - 4}L466 238L476 245M${G.x} ${G.y + 4}L466 266L476 259`} fill="none" stroke={C.line} strokeWidth="3.5" strokeLinejoin="round" />
      <Joint x={S.x} y={S.y} r={15} />
      <Joint x={E.x} y={E.y} r={13} />
      <Joint x={W.x} y={W.y} r={10} />
      {/* shoulder angle */}
      <line x1={S.x} y1={S.y} x2={S.x + 62} y2={S.y} {...hidden} />
      <path d={`M${S.x + 44} ${S.y}A44 44 0 0 0 ${S.x + 25} ${S.y - 36}`} fill="none" stroke={C.power} strokeWidth="1.4" />
      <text x={S.x + 52} y={S.y - 16} fontFamily={SANS} fontSize="12" fontStyle="italic" fill={C.powerLabel}>θ shoulder</text>
      <text x="212" y="262" textAnchor="end" fontFamily={MONO} fontSize="10.5" fill={C.line}>L1 105 mm</text>
      <text x="338" y="204" textAnchor="middle" fontFamily={MONO} fontSize="10.5" fill={C.line}>L2 98 mm</text>
      <line x1="476" y1="262" x2="476" y2="442" {...hidden} />
      <Dim x1={S.x} y1={436} x2={476} y2={436} label="max reach ≈ 300 mm" ids={ids} />

      {/* BASE SWEEP (top view) */}
      <ViewTitle x={540} y={42}>TOP VIEW · BASE SWEEP</ViewTitle>
      <path d="M650 130A120 120 0 0 1 650 370" fill="none" stroke={C.power} strokeWidth="1.5" strokeDasharray="6 4" markerStart={`url(#${ids.arrowPower})`} markerEnd={`url(#${ids.arrowPower})`} />
      <text x="700" y="112" fontFamily={MONO} fontSize="10.5" fill={C.powerLabel}>base yaw 0–180°</text>
      <circle cx="650" cy="250" r="52" {...dark} />
      <circle cx="650" cy="250" r="30" {...part} />
      <rect x="650" y="239" width="106" height="22" rx="4" {...part} />
      <path d="M756 243L772 238M756 257L772 262" stroke={C.line} strokeWidth="3" />
      <Joint x={650} y={250} r={12} />
      <Dim x1={650} y1={400} x2={772} y2={400} label="radius ≈ 300 mm" ids={ids} />
      <line x1="650" y1="302" x2="650" y2="408" {...hidden} />
      <line x1="772" y1="262" x2="772" y2="408" {...hidden} />
    </g>
  ),
};

/* ---------- 4. LoRaWAN agro hub: field installation ---------- */

function Plant({ x }: { x: number }) {
  return (
    <g stroke="#7fd99a" strokeWidth="2" fill="none" strokeLinecap="round">
      <path d={`M${x} 322V290`} />
      <path d={`M${x} 306C${x - 14} 300 ${x - 18} 292 ${x - 16} 286C${x - 6} 290 ${x} 298 ${x} 306`} fill="#2f7d4a" />
      <path d={`M${x} 298C${x + 12} 292 ${x + 18} 284 ${x + 16} 278C${x + 6} 282 ${x} 290 ${x} 298`} fill="#2f7d4a" />
    </g>
  );
}

const agro: Drawing = {
  views: 'FIELD INSTALLATION',
  callouts: [
    { n: 1, label: '6 V 3 W solar panel, tilted toward the south', x: 232, y: 100, bx: 168, by: 64 },
    { n: 2, label: 'IP65 enclosure: ESP32, RAK3172, 18650 cells, charger', x: 228, y: 210, bx: 176, by: 196 },
    { n: 3, label: 'LoRa antenna, vertical and clear of the panel', x: 287, y: 136, bx: 340, by: 150 },
    { n: 4, label: 'Capacitive soil moisture probe (root depth)', x: 184, y: 372, bx: 214, by: 420 },
    { n: 5, label: 'RS485 NPK probe', x: 330, y: 388, bx: 372, by: 420 },
    { n: 6, label: '12 V solenoid valve (normally closed)', x: 420, y: 314, bx: 452, by: 262 },
    { n: 7, label: 'Drip line with emitters at each plant', x: 560, y: 324, bx: 560, by: 392 },
    { n: 8, label: 'LoRaWAN gateway (up to ~10 km line of sight)', x: 728, y: 200, bx: 672, by: 186 },
  ],
  art: (ids) => (
    <g>
      <ViewTitle x={30} y={42}>FIELD INSTALLATION · SIDE VIEW</ViewTitle>
      {/* soil */}
      <rect x="40" y="330" width="744" height="100" fill="#0f2f55" fillOpacity="0.55" />
      <Ground x1={40} x2={784} y={330} />

      {/* radio link to the gateway */}
      <path d="M287 116Q510 20 735 108" fill="none" stroke={C.power} strokeWidth="1.5" strokeDasharray="7 5" markerEnd={`url(#${ids.arrowPower})`} />
      <text x="510" y="60" textAnchor="middle" fontFamily={MONO} fontSize="10.5" fill={C.powerLabel}>LoRaWAN uplink · IN865</text>

      {/* pole, panel, enclosure, antenna */}
      <rect x="252" y="92" width="12" height="238" {...dark} />
      <rect x="252" y="330" width="12" height="36" fill="none" stroke={C.line} strokeDasharray="4 3" strokeOpacity="0.7" />
      <path d="M258 96L262 84" stroke={C.line} strokeWidth="3" />
      <path d="M195 108L318 72L322 84L199 120Z" {...light} />
      <path d="M236 96L240 108M277 84L281 96" stroke={C.line} strokeOpacity="0.6" />
      <rect x="222" y="160" width="72" height="76" rx="4" {...part} />
      <Tag x={258} y={202}>IP65</Tag>
      <path d="M222 172H252M222 224H252" stroke={C.line} strokeOpacity="0.5" />
      <line x1="287" y1="160" x2="287" y2="118" stroke={C.line} strokeWidth="3" />
      <circle cx="287" cy="116" r="3.5" fill={C.line} />

      {/* sensors */}
      <path d="M240 236V320H180V318" fill="none" stroke={C.line} strokeWidth="1.4" />
      <rect x="174" y="318" width="12" height="70" rx="2" {...light} />
      <path d="M276 236V316H322V312" fill="none" stroke={C.line} strokeWidth="1.4" />
      <rect x="310" y="304" width="26" height="26" rx="2" {...light} />
      <path d="M315 330V400M323 330V400M331 330V400" stroke={C.line} strokeWidth="2.5" />
      <line x1="186" y1="388" x2="146" y2="388" {...hidden} />
      <Dim x1={152} y1={330} x2={152} y2={388} label="15 cm" ids={ids} />
      <line x1="252" y1="92" x2="112" y2="92" {...hidden} />
      <Dim x1={118} y1={92} x2={118} y2={330} label="1.8 m" ids={ids} />

      {/* irrigation */}
      <path d="M294 200H405V298" fill="none" stroke={C.line} strokeWidth="1.4" />
      <line x1="350" y1="324" x2="380" y2="324" stroke={C.line} strokeWidth="4" />
      <path d="M378 317L390 324L378 331Z" fill={C.line} />
      <text x="352" y="350" fontFamily={MONO} fontSize="10" fill="#cfe6ff">water in</text>
      <rect x="398" y="298" width="14" height="10" {...dark} />
      <rect x="390" y="308" width="30" height="26" rx="2" {...accent} />
      <line x1="420" y1="324" x2="676" y2="324" stroke={C.line} strokeWidth="4" />
      {[460, 520, 580, 640].map((x) => (
        <g key={x}>
          <Plant x={x} />
          <rect x={x - 3} y="320" width="6" height="8" fill={C.accent} />
          <circle cx={x} cy="338" r="2.2" fill="#9fcbff" />
          <circle cx={x} cy="348" r="1.8" fill="#9fcbff" fillOpacity="0.7" />
        </g>
      ))}

      {/* gateway tower */}
      <path d="M712 330L735 120L758 330M718 280H752M724 220H746M729 170H741M718 280L746 220M752 280L724 220" fill="none" stroke={C.line} strokeWidth="1.8" />
      <line x1="735" y1="120" x2="735" y2="96" stroke={C.line} strokeWidth="3" />
      <rect x="726" y="128" width="18" height="16" rx="2" {...light} />
    </g>
  ),
};

const drawings: Record<string, Drawing> = {
  'ros-rover': rover,
  'drone-telemetry': drone,
  'gesture-arm': arm,
  'smart-agro': agro,
};

function Callouts({ items }: { items: Callout[] }) {
  return (
    <g>
      {items.map((c) => (
        <g key={c.n}>
          <line x1={c.x} y1={c.y} x2={c.bx} y2={c.by} stroke="#ffffff" strokeWidth="1" />
          <circle cx={c.x} cy={c.y} r="2.6" fill="#ffffff" />
          <circle cx={c.bx} cy={c.by} r="11" fill={C.accent} stroke="#ffffff" strokeWidth="1.6" />
          <text x={c.bx} y={c.by + 4} textAnchor="middle" fontFamily={SANS} fontSize="11.5" fontWeight="800" fill="#ffffff">
            {c.n}
          </text>
        </g>
      ))}
    </g>
  );
}

/** The drawing for one build. Returns null for builds without one. */
export default function ProductDiagram({ build }: { build: CapstoneBuild }) {
  const d = drawings[build.id];
  if (!d) return null;
  return (
    <BlueprintSheet
      id={`prd-${build.id}`}
      title={`Product drawing of ${build.title}: ${d.callouts.map((c) => `${c.n}. ${c.label}`).join('; ')}`}
      footerLeft={`RADIX ROBOTICS · ${build.title.toUpperCase()}`}
      footerRight={`DWG ${build.blueprint.drawingNo}-P · PRODUCT DRAWING · ${d.views} · NTS`}
    >
      {(ids) => (
        <>
          {d.art(ids)}
          <Callouts items={d.callouts} />
        </>
      )}
    </BlueprintSheet>
  );
}

/** Numbered key for the callouts, shown under the drawing. */
export function ProductKey({ build }: { build: CapstoneBuild }) {
  const d = drawings[build.id];
  if (!d) return null;
  return (
    <ol className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
      {d.callouts.map((c) => (
        <li key={c.n} className="flex items-start gap-3 text-[14px] leading-snug text-[#3b3f46]">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ff5400] text-[11px] font-black text-white">
            {c.n}
          </span>
          <span className="pt-0.5">{c.label}</span>
        </li>
      ))}
    </ol>
  );
}
