import Link from 'next/link';
import { ReviewedCaseRecord } from '@/types/fiducia';
import { shortAddress, formatAmount, riskColor, scoreColor } from '@/lib/format';
import { DecisionBadge, RiskBadge } from '@/components/ui/Badge';
import RiskGlyph from '@/components/verdict/RiskGlyph';

export default function CreditReportCard({ record }: { record: ReviewedCaseRecord }) {
  const { case: c, verdict, appeal_verdict } = record;
  const finalDecision = appeal_verdict?.revised_decision ?? verdict.decision;
  const finalScore = appeal_verdict?.revised_credit_score ?? verdict.credit_score;
  const finalRisk = appeal_verdict?.revised_risk_level ?? verdict.risk_level;

  return (
    <div className="glass-panel rounded-[8px] p-5 hover:border-[rgba(246,197,107,0.25)] transition-all duration-200 group">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-mono text-xs text-[#A4A7E3]">#{c.case_id}</p>
            {appeal_verdict && (
              <span className="font-mono text-xs px-2 py-0.5 rounded-full border border-[#63E6C2] text-[#63E6C2] bg-[rgba(99,230,194,0.1)]">
                APPEALED
              </span>
            )}
          </div>
          <h3 className="font-display text-lg text-[#E2ECF5] group-hover:text-[#F6C56B] transition-colors truncate">
            {c.business_name}
          </h3>
          <p className="font-mono text-xs text-[#A4A7E3] mt-1">{shortAddress(c.borrower)}</p>
        </div>
        <RiskGlyph risk={finalRisk} size={44} />
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="text-center">
          <p className="font-mono text-xs text-[#A4A7E3]">SCORE</p>
          <p className="font-display text-2xl font-bold mt-0.5" style={{ color: scoreColor(finalScore) }}>
            {finalScore}
          </p>
        </div>
        <div className="text-center">
          <p className="font-mono text-xs text-[#A4A7E3]">REPAY</p>
          <p className="font-mono text-lg font-bold mt-0.5" style={{ color: riskColor(finalRisk) }}>
            {verdict.repayment_probability}%
          </p>
        </div>
        <div className="text-center">
          <p className="font-mono text-xs text-[#A4A7E3]">REQUESTED</p>
          <p className="font-mono text-sm font-medium mt-0.5 text-[#E2ECF5]">
            {formatAmount(c.loan_amount_requested)}
          </p>
        </div>
        <div className="text-center">
          <p className="font-mono text-xs text-[#A4A7E3]">REC. MAX</p>
          <p className="font-mono text-sm font-medium mt-0.5 text-[#F6C56B]">
            {formatAmount(verdict.recommended_terms.max_loan_amount)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <DecisionBadge decision={finalDecision} />
          <RiskBadge risk={finalRisk} />
        </div>
        <Link
          href={`/lenders/reports/${c.case_id}`}
          className="text-xs font-mono text-[#F6C56B] hover:underline"
        >
          Open Report →
        </Link>
      </div>
    </div>
  );
}
