'use client';

interface RepaymentOrbProps {
  probability: number;
  size?: number;
}

export default function RepaymentOrb({ probability, size = 80 }: RepaymentOrbProps) {
  const color =
    probability >= 70
      ? ['#7C9B63', '#63E6C2']
      : probability >= 50
      ? ['#F6C56B', '#7C9B63']
      : ['#E05D3F', '#F6C56B'];

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="rounded-full animate-orb-pulse relative flex items-center justify-center"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 35% 35%, ${color[0]}40, ${color[1]}20)`,
          border: `2px solid ${color[0]}60`,
          boxShadow: `0 0 ${size * 0.3}px ${color[0]}40, inset 0 0 ${size * 0.2}px ${color[0]}20`,
        }}
      >
        <span
          className="font-display font-bold"
          style={{ fontSize: size * 0.28, color: color[0] }}
        >
          {probability}%
        </span>
      </div>
      <p className="font-mono text-[10px] text-[#A4A7E3] uppercase tracking-widest">Repayment</p>
    </div>
  );
}
