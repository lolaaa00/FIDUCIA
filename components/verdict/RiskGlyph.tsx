'use client';

import { RiskLevel } from '@/types/fiducia';
import { riskColor } from '@/lib/format';

interface RiskGlyphProps {
  risk: RiskLevel;
  size?: number;
}

export default function RiskGlyph({ risk, size = 40 }: RiskGlyphProps) {
  const color = riskColor(risk);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {risk === 'low' && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
        )}
        {risk === 'medium' && (
          <>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="2" strokeDasharray="3 3" />
            <circle cx={cx} cy={cy} r={r * 0.55} fill="none" stroke={color} strokeWidth="1.5" />
          </>
        )}
        {risk === 'high' && (
          <>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="2" strokeDasharray="5 2" strokeLinecap="round" />
            <line x1={cx - r * 0.5} y1={cy - r * 0.5} x2={cx + r * 0.5} y2={cy + r * 0.5} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <line x1={cx + r * 0.5} y1={cy - r * 0.5} x2={cx - r * 0.5} y2={cy + r * 0.5} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}
      </svg>
      <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color }}>
        {risk}
      </span>
    </div>
  );
}
