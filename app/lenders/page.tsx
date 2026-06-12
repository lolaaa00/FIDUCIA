'use client';

import { useEffect, useState } from 'react';
import { ReviewedCaseRecord, LenderFilters } from '@/types/fiducia';
import { getReviewedCases } from '@/lib/genlayerClient';
import CreditReportCard from '@/components/lender/CreditReportCard';
import ReportFilters from '@/components/lender/ReportFilters';

function applyFilters(records: ReviewedCaseRecord[], filters: LenderFilters): ReviewedCaseRecord[] {
  return records.filter(({ case: c, verdict, appeal_verdict }) => {
    const finalDecision = appeal_verdict?.revised_decision ?? verdict.decision;
    const finalScore = appeal_verdict?.revised_credit_score ?? verdict.credit_score;
    const finalRisk = appeal_verdict?.revised_risk_level ?? verdict.risk_level;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!c.business_name.toLowerCase().includes(q) && !c.borrower.toLowerCase().includes(q)) return false;
    }
    if (filters.decision && finalDecision !== filters.decision) return false;
    if (filters.riskLevel && finalRisk !== filters.riskLevel) return false;
    if (filters.scoreMin !== undefined && finalScore < filters.scoreMin) return false;
    if (filters.scoreMax !== undefined && finalScore > filters.scoreMax) return false;
    if (filters.repaymentMin !== undefined && verdict.repayment_probability < filters.repaymentMin) return false;
    return true;
  });
}

export default function LendersPage() {
  const [all, setAll] = useState<ReviewedCaseRecord[]>([]);
  const [filters, setFilters] = useState<LenderFilters>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReviewedCases().then((r) => { setAll(r); setLoading(false); });
  }, []);

  const filtered = applyFilters(all, filters);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px w-8 bg-[#F6C56B]" />
          <span className="font-mono text-xs text-[#F6C56B] uppercase tracking-widest">Lender Observatory</span>
        </div>
        <h1 className="font-display text-4xl text-[#E2ECF5] mb-3">Credit Reports</h1>
        <p className="text-sm text-[#A4A7E3] max-w-xl">
          Browse consensus-backed credit reports produced by GenLayer validators.
          All cases shown have been fully reviewed. Lenders cannot fund loans or change verdicts in V1.
        </p>
      </div>

      <div className="mb-6">
        <ReportFilters filters={filters} onChange={setFilters} />
      </div>

      <div className="flex items-center gap-3 mb-6">
        <p className="font-mono text-xs text-[#A4A7E3]">
          {loading ? 'Loading…' : `${filtered.length} report${filtered.length !== 1 ? 's' : ''}`}
        </p>
        <div className="h-px flex-1 bg-[rgba(255,255,255,0.07)]" />
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#A4A7E3]">Loading reports…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-[#A4A7E3]">No reports match your filters.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {filtered.map((record) => (
            <CreditReportCard key={record.case.case_id} record={record} />
          ))}
        </div>
      )}

      <div className="mt-12 p-5 rounded-[8px] border border-[rgba(255,255,255,0.07)] bg-[rgba(16,22,34,0.4)]">
        <p className="text-xs text-[#A4A7E3] leading-relaxed">
          <span className="text-[#F6C56B] font-semibold">Disclaimer:</span> Fiducia provides consensus-backed underwriting opinions.
          It does not provide loans, custody funds, guarantee repayment, or force lending decisions.
        </p>
      </div>
    </div>
  );
}
