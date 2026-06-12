'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ReviewedCaseRecord, BorrowerReputation } from '@/types/fiducia';
import { getCaseVerdict, getCase, getAppealVerdict, getBorrowerReputation } from '@/lib/genlayerClient';
import CreditReportDetail from '@/components/lender/CreditReportDetail';

export default function LenderReportPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const [record, setRecord] = useState<ReviewedCaseRecord | null>(null);
  const [reputation, setReputation] = useState<BorrowerReputation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [c, verdict, appealVerdict] = await Promise.all([
        getCase(caseId),
        getCaseVerdict(caseId),
        getAppealVerdict(caseId),
      ]);

      if (c && verdict) {
        setRecord({ case: c, verdict, appeal_verdict: appealVerdict });
        const rep = await getBorrowerReputation(c.borrower);
        setReputation(rep);
      }
      setLoading(false);
    }
    load();
  }, [caseId]);

  if (loading) return <div className="text-center py-32 text-[#A4A7E3]">Loading report…</div>;
  if (!record) return <div className="text-center py-32 text-[#E05D3F]">Report not found.</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <Link href="/lenders" className="font-mono text-xs text-[#A4A7E3] hover:text-[#F6C56B] transition-colors">
          ← Back to Reports
        </Link>
      </div>
      <CreditReportDetail record={record} reputation={reputation} />
    </div>
  );
}
