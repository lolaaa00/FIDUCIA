'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CreditCase, CaseVerdict, AppealVerdict } from '@/types/fiducia';
import { getCase, getCaseVerdict, getAppealVerdict, getProtocolStats } from '@/lib/genlayerClient';
import { appealOutcomeLabel } from '@/lib/format';
import AppealForm from '@/components/borrower/AppealForm';
import VerdictSeal from '@/components/verdict/VerdictSeal';
import Card from '@/components/ui/Card';
import { DecisionBadge, RiskBadge } from '@/components/ui/Badge';
import { useWallet } from '@/components/wallet/WalletProvider';
import Button from '@/components/ui/Button';

const DEMO_ADDRESS = '0xA1b2C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F8A9B0';
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

export default function AppealPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const router = useRouter();
  const { address, connect, hasProvider, isConnecting } = useWallet();
  const [c, setC] = useState<CreditCase | null>(null);
  const [verdict, setVerdict] = useState<CaseVerdict | null>(null);
  const [appealVerdict, setAppealVerdict] = useState<AppealVerdict | null>(null);
  const [fee, setFee] = useState<bigint>(BigInt(1000000000000000));
  const [loading, setLoading] = useState(true);
  const activeAddress = address ?? (USE_MOCKS ? DEMO_ADDRESS : null);

  useEffect(() => {
    async function load() {
      const [caseData, v, av, stats] = await Promise.all([
        getCase(caseId),
        getCaseVerdict(caseId),
        getAppealVerdict(caseId),
        getProtocolStats(),
      ]);
      setC(caseData);
      setVerdict(v);
      setAppealVerdict(av);
      setFee(BigInt(stats.review_fee));
      setLoading(false);
    }
    load();
  }, [caseId]);

  if (loading) return <div className="text-center py-32 text-[#A4A7E3]">Loading…</div>;
  if (!c || !verdict) return <div className="text-center py-32 text-[#E05D3F]">Case or verdict not found.</div>;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      {!activeAddress && !USE_MOCKS && (
        <Card glow="gold">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl text-[#E2ECF5] mb-1">Connect the borrower wallet</h2>
              <p className="text-sm text-[#A4A7E3]">
                Appeals are only available to the borrower address that owns the original case.
              </p>
            </div>
            <Button variant="ghost" onClick={connect} disabled={!hasProvider || isConnecting}>
              Connect Wallet
            </Button>
          </div>
        </Card>
      )}

      <div>
        <p className="font-mono text-xs text-[#A4A7E3] mb-1">CASE #{caseId} — APPEAL</p>
        <h1 className="font-display text-3xl text-[#E2ECF5]">{c.business_name}</h1>
      </div>

      {/* Original Verdict */}
      <Card>
        <h3 className="font-mono text-xs text-[#A4A7E3] uppercase tracking-widest mb-4">Original Verdict</h3>
        <div className="flex items-center gap-6">
          <VerdictSeal verdict={verdict} size="sm" />
          <div>
            <p className="text-sm text-[#E2ECF5] mb-2">This was the GenLayer consensus verdict for your case.</p>
            <p className="text-xs text-[#A4A7E3]">
              You may appeal by submitting new sanitised evidence. GenLayer validators will assess whether the new evidence changes the picture.
            </p>
          </div>
        </div>
      </Card>

      {/* Appeal verdict if already reviewed */}
      {appealVerdict ? (
        <Card glow={appealVerdict.appeal_outcome === 'improve' ? 'cyan' : appealVerdict.appeal_outcome === 'worsen' ? 'ember' : 'gold'}>
          <h3 className="font-mono text-xs text-[#F6C56B] uppercase tracking-widest mb-4">Appeal Verdict</h3>
          <div className="flex items-center gap-3 mb-4">
            <span className="font-display text-xl font-bold" style={{
              color: appealVerdict.appeal_outcome === 'improve' ? '#7C9B63' : appealVerdict.appeal_outcome === 'worsen' ? '#E05D3F' : '#F6C56B'
            }}>
              {appealOutcomeLabel(appealVerdict.appeal_outcome)}
            </span>
            <DecisionBadge decision={appealVerdict.revised_decision} />
            <RiskBadge risk={appealVerdict.revised_risk_level} />
          </div>
          <div className="space-y-2 mb-4">
            {appealVerdict.reasoning.map((r, i) => (
              <p key={i} className="text-sm text-[#E2ECF5]">· {r}</p>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-[rgba(255,255,255,0.04)]">
            <div><p className="font-mono text-xs text-[#A4A7E3]">REVISED SCORE</p><p className="font-display text-xl text-[#F6C56B]">{appealVerdict.revised_credit_score}</p></div>
            <div><p className="font-mono text-xs text-[#A4A7E3]">REVISED RISK</p><p className="font-mono text-sm text-[#E2ECF5] mt-1">{appealVerdict.revised_risk_level}</p></div>
            <div><p className="font-mono text-xs text-[#A4A7E3]">CONFIDENCE</p><p className="font-mono text-sm text-[#E2ECF5] mt-1">{appealVerdict.confidence}%</p></div>
          </div>
        </Card>
      ) : (
        ['REVIEWED'].includes(c.status) && activeAddress && c.borrower.toLowerCase() === activeAddress.toLowerCase() ? (
          <AppealForm caseId={caseId} reviewFee={fee} onAppealSubmitted={() => router.push(`/borrower/cases/${caseId}`)} />
        ) : (
          <Card>
            <p className="text-sm text-[#A4A7E3]">
              {activeAddress
                ? 'This wallet does not match the borrower on this case.'
                : 'Connect the borrower wallet to file an appeal.'}
            </p>
          </Card>
        )
      )}
    </div>
  );
}
