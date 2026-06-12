'use client';

import { CaseVerdict } from '@/types/fiducia';
import { decisionLabel, scoreColor, riskColor } from '@/lib/format';

interface VerdictSealProps {
  verdict: CaseVerdict;
  size?: 'sm' | 'md' | 'lg';
}

export default function VerdictSeal({ verdict, size = 'md' }: VerdictSealProps) {
  const dim = { sm: 120, md: 180, lg: 240 }[size];
  const r = dim / 2 - 10;
  const circ = 2 * Math.PI * r;
  const strokeDash = (verdict.credit_score / 100) * circ;
  const color = scoreColor(verdict.credit_score);
  const fontSize = { sm: 28, md: 40, lg: 56 }[size];

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: dim, height: dim }}>
        {/* Outer orbit ring */}
        <svg width={dim} height={dim} className="absolute inset-0 animate-spin-slow opacity-20">
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={r + 6}
            fill="none"
            stroke={color}
            strokeWidth="1"
            strokeDasharray="4 8"
          />
        </svg>

        {/* Score arc */}
        <svg width={dim} height={dim} className="absolute inset-0 -rotate-90">
          <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${circ}`}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-display font-bold leading-none"
            style={{ fontSize, color }}
          >
            {verdict.credit_score}
          </span>
          <span className="text-[#A4A7E3] font-mono text-xs mt-0.5">SCORE</span>
        </div>
      </div>

      {/* Decision stamp */}
      <div
        className="px-4 py-1.5 rounded-full font-mono text-xs font-bold tracking-widest uppercase"
        style={{
          color,
          border: `1px solid ${color}`,
          background: `${color}18`,
          letterSpacing: '0.12em',
        }}
      >
        {decisionLabel(verdict.decision)}
      </div>

      {/* Stats row */}
      <div className="flex gap-4 text-center">
        <div>
          <p className="font-mono text-xs text-[#A4A7E3]">RISK</p>
          <p className="font-mono text-sm font-bold" style={{ color: riskColor(verdict.risk_level) }}>
            {verdict.risk_level.toUpperCase()}
          </p>
        </div>
        <div className="w-px bg-[rgba(255,255,255,0.1)]" />
        <div>
          <p className="font-mono text-xs text-[#A4A7E3]">CONF.</p>
          <p className="font-mono text-sm font-bold text-[#F6C56B]">{verdict.confidence}%</p>
        </div>
      </div>
    </div>
  );
}
