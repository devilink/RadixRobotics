import type { CapstoneBuild, DiagramNode } from '../builds';
import BlueprintSheet, { C, MONO, SANS, SHEET_H, SHEET_W } from './BlueprintSheet';

const NODE_W = 170;
const NODE_H = 64;

type Box = { x: number; y: number; w: number; h: number };

const box = (n: DiagramNode): Box => ({ x: n.x, y: n.y, w: n.w ?? NODE_W, h: NODE_H });
const center = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

// Point where the ray from the box centre toward (tx, ty) leaves the box.
function exitPoint(b: Box, tx: number, ty: number) {
  const c = center(b);
  const dx = tx - c.x;
  const dy = ty - c.y;
  const sx = dx === 0 ? Infinity : b.w / 2 / Math.abs(dx);
  const sy = dy === 0 ? Infinity : b.h / 2 / Math.abs(dy);
  const s = Math.min(sx, sy);
  return { x: c.x + dx * s, y: c.y + dy * s };
}

/** System block diagram: how the parts connect (signal and power). */
export default function BlueprintDiagram({ build }: { build: CapstoneBuild }) {
  const { nodes, edges, drawingNo } = build.blueprint;
  const byId = new Map(nodes.map((n) => [n.id, box(n)]));

  return (
    <BlueprintSheet
      id={`sys-${build.id}`}
      title={`System blueprint for ${build.title}: ${nodes.map((n) => n.label).join(', ')}`}
      footerLeft={`RADIX ROBOTICS · ${build.title.toUpperCase()}`}
      footerRight={`DWG ${drawingNo} · SYSTEM BLOCK DIAGRAM · NTS · REV A`}
    >
      {(ids) => (
        <>
          {/* Connections */}
          {edges.map((e, i) => {
            const a = byId.get(e.from);
            const b = byId.get(e.to);
            if (!a || !b) return null;
            const ca = center(a);
            const cb = center(b);
            const p1 = exitPoint(a, cb.x, cb.y);
            const p2 = exitPoint(b, ca.x, ca.y);
            const mx = (p1.x + p2.x) / 2;
            const my = (p1.y + p2.y) / 2;
            const label = e.label ?? '';
            const lw = label.length * 6.1 + 12;
            // Horizontal runs are short: sit the label above the line so it never hides the arrowhead.
            const horizontal = Math.abs(p2.y - p1.y) < 4;
            const ly = horizontal ? my - 12 : my;
            return (
              <g key={i}>
                <line
                  x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                  stroke={e.power ? C.power : '#cfe6ff'}
                  strokeWidth="1.6"
                  strokeDasharray={e.power ? '6 4' : undefined}
                  markerEnd={`url(#${e.power ? ids.arrowPower : ids.arrow})`}
                />
                {label && (
                  <g>
                    {!horizontal && <rect x={mx - lw / 2} y={ly - 9} width={lw} height="18" fill={C.paper} />}
                    <text x={mx} y={ly + 4} textAnchor="middle" fontFamily={MONO} fontSize="10.5" fill={e.power ? C.powerLabel : C.label}>
                      {label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Components */}
          {nodes.map((n) => {
            const b = box(n);
            return (
              <g key={n.id}>
                <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={n.accent ? C.accent : C.part} fillOpacity={n.accent ? 0.9 : 1} stroke="#ffffff" strokeWidth="1.8" />
                <path d={`M${b.x + 6} ${b.y + 2}V${b.y + 8}M${b.x + 2} ${b.y + 6}H${b.x + 8}`} stroke="#ffffff" strokeOpacity="0.6" />
                <text x={b.x + b.w / 2} y={b.y + 27} textAnchor="middle" fontFamily={SANS} fontWeight="800" fontSize="14" fill="#ffffff">
                  {n.label}
                </text>
                {n.sub && (
                  <text x={b.x + b.w / 2} y={b.y + 46} textAnchor="middle" fontFamily={MONO} fontSize="10.5" fill={n.accent ? '#fff3e8' : '#cfe6ff'}>
                    {n.sub}
                  </text>
                )}
              </g>
            );
          })}

          {/* Legend */}
          <g fontFamily={MONO} fontSize="10" fill="#cfe6ff">
            <line x1={SHEET_W - 210} y1={SHEET_H - 14} x2={SHEET_W - 180} y2={SHEET_H - 14} stroke="#cfe6ff" strokeWidth="1.6" />
            <text x={SHEET_W - 174} y={SHEET_H - 10}>signal</text>
            <line x1={SHEET_W - 120} y1={SHEET_H - 14} x2={SHEET_W - 90} y2={SHEET_H - 14} stroke={C.power} strokeWidth="1.6" strokeDasharray="6 4" />
            <text x={SHEET_W - 84} y={SHEET_H - 10}>power</text>
          </g>
        </>
      )}
    </BlueprintSheet>
  );
}
