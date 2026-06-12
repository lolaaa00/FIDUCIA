import { RecommendedTerms } from '@/types/fiducia';
import { formatAmount } from '@/lib/format';

export default function TermRecommendation({ terms }: { terms: RecommendedTerms }) {
  return (
    <div className="glass-panel rounded-[8px] p-5 border border-[rgba(246,197,107,0.2)]">
      <h4 className="font-mono text-xs text-[#F6C56B] uppercase tracking-widest mb-4">Recommended Terms</h4>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="font-mono text-xs text-[#A4A7E3] mb-1">MAX AMOUNT</p>
          <p className="font-display text-lg text-[#F6C56B]">{formatAmount(terms.max_loan_amount)}</p>
        </div>
        <div>
          <p className="font-mono text-xs text-[#A4A7E3] mb-1">INTEREST</p>
          <p className="font-display text-lg text-[#E2ECF5]">{terms.interest_rate}%</p>
        </div>
        <div>
          <p className="font-mono text-xs text-[#A4A7E3] mb-1">DURATION</p>
          <p className="font-display text-lg text-[#E2ECF5]">{terms.loan_duration_months}mo</p>
        </div>
      </div>
      {terms.conditions.length > 0 && (
        <div>
          <p className="font-mono text-xs text-[#A4A7E3] uppercase tracking-widest mb-2">Conditions</p>
          <ul className="space-y-1">
            {terms.conditions.map((c, i) => (
              <li key={i} className="text-sm text-[#E2ECF5] flex gap-2">
                <span className="text-[#F6C56B]">·</span> {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
