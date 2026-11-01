import type { ReactNode } from 'react';

// Shared engineering-sheet frame for every drawing on a build page: grid paper,
// border, title block. Drawing space is 800 × 460; the title block sits below it.

export const SHEET_W = 800;
export const SHEET_H = 460;

export const C = {
  paper: '#163e6e',
  part: '#1d4d85',
  partDark: '#0f2f55',
  partLight: '#2a5f9e',
  line: '#e6f1ff',
  label: '#9fcbff',
  accent: '#ff5400',
  power: '#ffb347',
  powerLabel: '#ffcf8a',
};

export const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
export const SANS = 'Inter, system-ui, sans-serif';

/** Marker ids are prefixed per sheet so two drawings on one page never share an id. */
export type SheetIds = { arrow: string; arrowPower: string; dim: string };

export default function BlueprintSheet({
  id,
  title,
  footerLeft,
  footerRight,
  children,
}: {
  id: string;
  title: string;
  footerLeft: string;
  footerRight: string;
  children: (ids: SheetIds) => ReactNode;
}) {
  const ids: SheetIds = { arrow: `${id}-arrow`, arrowPower: `${id}-arrow-power`, dim: `${id}-dim` };
  return (
    <svg
      viewBox={`0 0 ${SHEET_W} ${SHEET_H + 50}`}
      role="img"
      aria-labelledby={`${id}-title`}
      className="block h-auto w-full min-w-[680px]"
    >
      <title id={`${id}-title`}>{title}</title>
      <defs>
        <pattern id={`${id}-grid-sm`} width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M10 0H0V10" fill="none" stroke="#ffffff" strokeOpacity="0.06" strokeWidth="1" />
        </pattern>
        <pattern id={`${id}-grid`} width="50" height="50" patternUnits="userSpaceOnUse">
          <rect width="50" height="50" fill={`url(#${id}-grid-sm)`} />
          <path d="M50 0H0V50" fill="none" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="1" />
        </pattern>
        <marker id={ids.arrow} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill="#cfe6ff" />
        </marker>
        <marker id={ids.arrowPower} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill={C.power} />
        </marker>
        <marker id={ids.dim} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 1.5L10 5L0 8.5z" fill={C.line} />
        </marker>
      </defs>

      <rect width={SHEET_W} height={SHEET_H + 50} fill={C.paper} />
      <rect width={SHEET_W} height={SHEET_H + 50} fill={`url(#${id}-grid)`} />
      <rect x="8" y="8" width={SHEET_W - 16} height={SHEET_H + 34} fill="none" stroke="#cfe6ff" strokeOpacity="0.6" strokeWidth="1.5" />

      {children(ids)}

      <g fontFamily={MONO} fontSize="10.5" fill="#cfe6ff">
        <line x1="8" y1={SHEET_H + 8} x2={SHEET_W - 8} y2={SHEET_H + 8} stroke="#cfe6ff" strokeOpacity="0.6" />
        <text x="22" y={SHEET_H + 32} fontWeight="700" fill="#ffffff">{footerLeft}</text>
        <text x={SHEET_W - 22} y={SHEET_H + 32} textAnchor="end">{footerRight}</text>
      </g>
    </svg>
  );
}
