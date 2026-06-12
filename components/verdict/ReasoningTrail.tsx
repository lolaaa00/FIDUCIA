interface ReasoningTrailProps {
  reasoning: string[];
  riskFlags?: string[];
  positiveSignals?: string[];
}

export default function ReasoningTrail({ reasoning, riskFlags = [], positiveSignals = [] }: ReasoningTrailProps) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-mono text-xs text-[#A4A7E3] uppercase tracking-widest mb-3">Reasoning Trail</h4>
        <div className="space-y-3">
          {reasoning.map((r, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-[#F6C56B] mt-1.5 shrink-0" />
                {i < reasoning.length - 1 && <div className="w-px flex-1 bg-[rgba(246,197,107,0.2)] mt-1" />}
              </div>
              <p className="text-sm text-[#E2ECF5] leading-relaxed pb-3">{r}</p>
            </div>
          ))}
        </div>
      </div>

      {positiveSignals.length > 0 && (
        <div>
          <h4 className="font-mono text-xs text-[#7C9B63] uppercase tracking-widest mb-3">Positive Signals</h4>
          <div className="space-y-2">
            {positiveSignals.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[#7C9B63] mt-0.5">+</span>
                <p className="text-sm text-[#E2ECF5]">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {riskFlags.length > 0 && (
        <div>
          <h4 className="font-mono text-xs text-[#E05D3F] uppercase tracking-widest mb-3">Risk Flags</h4>
          <div className="space-y-2">
            {riskFlags.map((f, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[#E05D3F] mt-0.5">⚑</span>
                <p className="text-sm text-[#E2ECF5]">{f}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
