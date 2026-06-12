'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BorrowerReputation, CreditCase } from '@/types/fiducia';
import { getBorrowerReputation, getBorrowerCases } from '@/lib/genlayerClient';
import { shortAddress, decisionLabel, riskLabel } from '@/lib/format';
import Card from '@/components/ui/Card';
import BorrowerCaseCard from '@/components/borrower/BorrowerCaseCard';

export default function ReputationPage() {
  const { address } = useParams<{ address: string }>();
  const [reputation, setReputation] = useState<BorrowerReputation | null>(null);
  const [cases, setCases] = useState<CreditCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [r, c] = await Promise.all([
        getBorrowerReputation(address),
        getBorrowerCases(address),
      ]);
      setReputation(r);
      setCases(c);
      setLoading(false);
    }
    load();
  }, [address]);

  if (loading) return <div className="text-center py-32 text-[#A4A7E3]">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      <div>
        <p className="font-mono text-xs text-[#A4A7E3] mb-1">REPUTATION LEDGER</p>
        <h1 className="font-display text-3xl text-[#E2ECF5] mb-2">{shortAddress(address)}</h1>
        <code className="font-mono text-sm text-[#63E6C2]">{address}</code>
      </div>

      {!reputation ? (
        <Card>
          <p className="text-[#A4A7E3]">No reputation data yet. This address has no reviewed cases.</p>
        </Card>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Reviews', value: reputation.total_reviewed_cases, color: '#F6C56B' },
              { label: 'Avg Score', value: reputation.average_credit_score.toFixed(0), color: '#E2ECF5' },
              { label: 'Avg Repay', value: `${reputation.average_repayment_probability.toFixed(0)}%`, color: '#63E6C2' },
              { label: 'Last Risk', value: riskLabel(reputation.last_risk_level as 'low' | 'medium' | 'high'), color: '#A4A7E3' },
            ].map((s, i) => (
              <Card key={i}>
                <p className="font-mono text-xs text-[#A4A7E3] mb-1">{s.label.toUpperCase()}</p>
                <p className="font-display text-2xl" style={{ color: s.color }}>{s.value}</p>
              </Card>
            ))}
          </div>

          {/* Decision breakdown */}
          <Card>
            <h3 className="font-mono text-xs text-[#A4A7E3] uppercase tracking-widest mb-4">Decision History</h3>
            <div className="flex gap-4">
              <div className="flex-1 text-center p-4 rounded-[8px] bg-[rgba(124,155,99,0.1)] border border-[rgba(124,155,99,0.2)]">
                <p className="font-display text-3xl text-[#7C9B63]">{reputation.approved_count}</p>
                <p className="font-mono text-xs text-[#A4A7E3] mt-1">Approved</p>
              </div>
              <div className="flex-1 text-center p-4 rounded-[8px] bg-[rgba(246,197,107,0.1)] border border-[rgba(246,197,107,0.2)]">
                <p className="font-display text-3xl text-[#F6C56B]">{reputation.conditional_count}</p>
                <p className="font-mono text-xs text-[#A4A7E3] mt-1">Conditional</p>
              </div>
              <div className="flex-1 text-center p-4 rounded-[8px] bg-[rgba(224,93,63,0.1)] border border-[rgba(224,93,63,0.2)]">
                <p className="font-display text-3xl text-[#E05D3F]">{reputation.rejected_count}</p>
                <p className="font-mono text-xs text-[#A4A7E3] mt-1">Rejected</p>
              </div>
            </div>
          </Card>

          {reputation.last_decision && (
            <Card>
              <h3 className="font-mono text-xs text-[#A4A7E3] uppercase tracking-widest mb-2">Last Activity</h3>
              <p className="text-sm text-[#E2ECF5]">
                Case #{reputation.last_reviewed_case_id} — {decisionLabel(reputation.last_decision as 'approve' | 'conditional_approve' | 'reject')} · {riskLabel(reputation.last_risk_level as 'low' | 'medium' | 'high')}
              </p>
            </Card>
          )}
        </>
      )}

      {/* Case history */}
      {cases.length > 0 && (
        <div>
          <h2 className="font-display text-xl text-[#E2ECF5] mb-4">Case History</h2>
          <div className="space-y-4">
            {cases.map((c) => <BorrowerCaseCard key={c.case_id} c={c} />)}
          </div>
        </div>
      )}
    </div>
  );
}
