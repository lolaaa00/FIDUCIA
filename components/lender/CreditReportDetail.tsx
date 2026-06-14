'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ReviewedCaseRecord, BorrowerReputation } from '@/types/fiducia';
import { shortAddress, formatAmount, appealOutcomeLabel } from '@/lib/format';
import { DecisionBadge, RiskBadge } from '@/components/ui/Badge';
import VerdictSeal from '@/components/verdict/VerdictSeal';
import RepaymentOrb from '@/components/verdict/RepaymentOrb';
import RiskGlyph from '@/components/verdict/RiskGlyph';
import ReasoningTrail from '@/components/verdict/ReasoningTrail';
import TermRecommendation from '@/components/verdict/TermRecommendation';
import Card from '@/components/ui/Card';

interface Props {
  record: ReviewedCaseRecord;
  reputation: BorrowerReputation | null;
}

export default function CreditReportDetail({ record, reputation }: Props) {
  const { case: c, verdict, appeal_verdict } = record;
  const [copied, setCopied] = useState(false);

  const finalDecision = appeal_verdict?.revised_decision ?? verdict.decision;
  const finalScore = appeal_verdict?.revised_credit_score ?? verdict.credit_score;
  const finalRisk = appeal_verdict?.revised_risk_level ?? verdict.risk_level;

  function copy() {
    navigator.clipboard.writeText(c.borrower);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Disclaimer */}
      <div className="p-4 rounded-[8px] border border-[rgba(246,197,107,0.2)] bg-[rgba(246,197,107,0.05)]">
        <p className="text-xs text-[#A4A7E3]">
          <span className="text-[#F6C56B] font-semibold">Fiducia</span> provides consensus-backed underwriting opinions.
          It does not provide loans, custody funds, guarantee repayment, or force lending decisions.
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <p className="font-mono text-sm text-[#A4A7E3]">Case #{c.case_id}</p>
            {appeal_verdict && (
              <span className="font-mono text-xs px-2 py-0.5 rounded-full border border-[#63E6C2] text-[#63E6C2]">
                APPEAL: {appealOutcomeLabel(appeal_verdict.appeal_outcome)}
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl text-[#E2ECF5] mb-2">{c.business_name}</h1>
          <p className="text-[#A4A7E3] mb-4">{c.business_type}</p>

          <div className="flex items-center gap-3">
            <p className="font-mono text-sm text-[#A4A7E3]">Borrower:</p>
            <code className="font-mono text-sm text-[#63E6C2]">{shortAddress(c.borrower)}</code>
            <button
              onClick={copy}
              className="text-xs font-mono px-2 py-1 rounded border border-[rgba(255,255,255,0.1)] text-[#A4A7E3] hover:text-[#F6C56B] hover:border-[#F6C56B] transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <Link
              href={`/reputation/${c.borrower}`}
              className="text-xs font-mono text-[#F6C56B] hover:underline"
            >
              Reputation →
            </Link>
          </div>
        </div>

        <div className="flex items-start gap-8">
          <VerdictSeal verdict={{ ...verdict, decision: finalDecision, credit_score: finalScore, risk_level: finalRisk }} size="lg" />
          <div className="flex flex-col items-center gap-6">
            <RepaymentOrb probability={verdict.repayment_probability} size={96} />
            <RiskGlyph risk={finalRisk} size={48} />
          </div>
        </div>
      </div>

      {/* Requested Terms */}
      <Card>
        <h3 className="font-mono text-xs text-[#A4A7E3] uppercase tracking-widest mb-4">Requested Terms</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="font-mono text-xs text-[#A4A7E3]">AMOUNT</p>
            <p className="font-display text-xl text-[#E2ECF5] mt-1">{formatAmount(c.loan_amount_requested)}</p>
          </div>
          <div>
            <p className="font-mono text-xs text-[#A4A7E3]">DURATION</p>
            <p className="font-display text-xl text-[#E2ECF5] mt-1">{c.loan_duration_months_requested} months</p>
          </div>
          <div>
            <p className="font-mono text-xs text-[#A4A7E3]">PURPOSE</p>
            <p className="text-sm text-[#E2ECF5] mt-1">{c.loan_purpose}</p>
          </div>
        </div>
      </Card>

      {/* Recommended Terms */}
      <TermRecommendation terms={appeal_verdict?.changed_terms ?? verdict.recommended_terms} />

      {/* Reasoning */}
      <Card>
        <ReasoningTrail
          reasoning={appeal_verdict?.reasoning ?? verdict.reasoning}
          riskFlags={verdict.risk_flags}
          positiveSignals={verdict.positive_signals}
        />
      </Card>

      {/* Appeal History */}
      {appeal_verdict && (
        <Card>
          <h3 className="font-mono text-xs text-[#63E6C2] uppercase tracking-widest mb-4">Appeal History</h3>
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-sm font-bold" style={{
              color: appeal_verdict.appeal_outcome === 'improve' ? '#7C9B63' : appeal_verdict.appeal_outcome === 'worsen' ? '#E05D3F' : '#F6C56B'
            }}>
              {appealOutcomeLabel(appeal_verdict.appeal_outcome)}
            </span>
            <DecisionBadge decision={appeal_verdict.revised_decision} />
            <RiskBadge risk={appeal_verdict.revised_risk_level} />
          </div>
          <div className="space-y-2">
            {appeal_verdict.reasoning.map((r, i) => (
              <p key={i} className="text-sm text-[#E2ECF5]">· {r}</p>
            ))}
          </div>
        </Card>
      )}

      {/* Reputation */}
      {reputation && (
        <Card>
          <h3 className="font-mono text-xs text-[#A4A7E3] uppercase tracking-widest mb-4">Borrower Reputation Ledger</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="font-display text-3xl text-[#F6C56B]">{reputation.total_reviewed_cases}</p>
              <p className="font-mono text-xs text-[#A4A7E3] mt-1">REVIEWS</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl text-[#E2ECF5]">{reputation.average_credit_score.toFixed(0)}</p>
              <p className="font-mono text-xs text-[#A4A7E3] mt-1">AVG SCORE</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl text-[#E2ECF5]">{reputation.average_repayment_probability.toFixed(0)}%</p>
              <p className="font-mono text-xs text-[#A4A7E3] mt-1">AVG REPAY</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 text-center p-3 rounded-lg bg-[rgba(124,155,99,0.1)] border border-[rgba(124,155,99,0.2)]">
              <p className="font-display text-xl text-[#7C9B63]">{reputation.approved_count}</p>
              <p className="font-mono text-xs text-[#A4A7E3]">Approved</p>
            </div>
            <div className="flex-1 text-center p-3 rounded-lg bg-[rgba(246,197,107,0.1)] border border-[rgba(246,197,107,0.2)]">
              <p className="font-display text-xl text-[#F6C56B]">{reputation.conditional_count}</p>
              <p className="font-mono text-xs text-[#A4A7E3]">Conditional</p>
            </div>
            <div className="flex-1 text-center p-3 rounded-lg bg-[rgba(224,93,63,0.1)] border border-[rgba(224,93,63,0.2)]">
              <p className="font-display text-xl text-[#E05D3F]">{reputation.rejected_count}</p>
              <p className="font-mono text-xs text-[#A4A7E3]">Rejected</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
