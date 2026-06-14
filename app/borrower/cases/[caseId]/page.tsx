'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CreditCase, CaseVerdict } from '@/types/fiducia';
import { getCase, getCaseVerdict, cancelCase, triggerReview } from '@/lib/genlayerClient';
import { getProtocolStats } from '@/lib/genlayerClient';
import { statusLabel, formatAmount } from '@/lib/format';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EvidenceRevealPanel from '@/components/borrower/EvidenceRevealPanel';
import VerdictSeal from '@/components/verdict/VerdictSeal';
import ReasoningTrail from '@/components/verdict/ReasoningTrail';
import TermRecommendation from '@/components/verdict/TermRecommendation';
import RepaymentOrb from '@/components/verdict/RepaymentOrb';
import { useWallet } from '@/components/wallet/WalletProvider';

const DEMO_ADDRESS = '0xA1b2C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F8A9B0';
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

const STATUS_STEPS: string[] = ['COMMITTED', 'READY_FOR_REVIEW', 'UNDER_REVIEW', 'REVIEWED'];

export default function CaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const { address, connect, hasProvider, isConnecting } = useWallet();
  const [c, setC] = useState<CreditCase | null>(null);
  const [verdict, setVerdict] = useState<CaseVerdict | null>(null);
  const [fee, setFee] = useState<bigint>(BigInt(1000000000000000));
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const activeAddress = address ?? (USE_MOCKS ? DEMO_ADDRESS : null);

  async function load() {
    const [caseData, v, stats] = await Promise.all([
      getCase(caseId),
      getCaseVerdict(caseId),
      getProtocolStats(),
    ]);
    setC(caseData);
    setVerdict(v);
    setFee(BigInt(stats.review_fee));
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    Promise.all([
      getCase(caseId),
      getCaseVerdict(caseId),
      getProtocolStats(),
    ]).then(([caseData, v, stats]) => {
      if (!active) return;
      setC(caseData);
      setVerdict(v);
      setFee(BigInt(stats.review_fee));
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [caseId]);

  async function handleCancel() {
    setActionLoading(true);
    try { await cancelCase(caseId); await load(); } catch (e: unknown) { setError((e as Error).message); } finally { setActionLoading(false); }
  }

  async function handleTriggerReview() {
    setActionLoading(true);
    try { await triggerReview(caseId, fee); await load(); } catch (e: unknown) { setError((e as Error).message); } finally { setActionLoading(false); }
  }

  if (loading) return <div className="text-center py-32 text-[#A4A7E3]">Loading…</div>;
  if (!c) return <div className="text-center py-32 text-[#E05D3F]">Case not found.</div>;

  const isBorrower = activeAddress ? c.borrower.toLowerCase() === activeAddress.toLowerCase() : false;
  const canReveal = isBorrower && c.status === 'COMMITTED';
  const canCancel = isBorrower && !['UNDER_REVIEW', 'REVIEWED', 'APPEAL_UNDER_REVIEW', 'APPEAL_REVIEWED'].includes(c.status);
  const canTrigger = c.status === 'READY_FOR_REVIEW';
  const canAppeal = isBorrower && c.status === 'REVIEWED';

  const stepIndex = STATUS_STEPS.indexOf(c.status);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      {!activeAddress && !USE_MOCKS && (
        <Card glow="gold">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl text-[#E2ECF5] mb-1">Connect the borrower wallet</h2>
              <p className="text-sm text-[#A4A7E3]">
                Actions like reveal, review trigger, cancel, and appeal are signed by the borrower address.
              </p>
            </div>
            <Button variant="ghost" onClick={connect} disabled={!hasProvider || isConnecting}>
              Connect Wallet
            </Button>
          </div>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-[#A4A7E3] mb-1">CASE #{c.case_id}</p>
          <h1 className="font-display text-3xl text-[#E2ECF5]">{c.business_name}</h1>
          <p className="text-[#A4A7E3] mt-1">{c.business_type}</p>
        </div>
        <div>
          <span
            className="font-mono text-xs px-3 py-1.5 rounded-full"
            style={{
              color: '#F6C56B',
              border: '1px solid rgba(246,197,107,0.4)',
              background: 'rgba(246,197,107,0.1)',
            }}
          >
            {statusLabel(c.status)}
          </span>
        </div>
      </div>

      {/* Evidence Timeline */}
      <Card>
        <h3 className="font-mono text-xs text-[#A4A7E3] uppercase tracking-widest mb-4">Evidence Timeline</h3>
        <div className="flex items-center gap-0">
          {STATUS_STEPS.map((s, i) => {
            const done = stepIndex >= i;
            const active = stepIndex === i;
            return (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex flex-col items-center flex-1 ${i > 0 ? '' : ''}`}>
                  <div className="flex items-center w-full">
                    {i > 0 && <div className={`flex-1 h-px ${done ? 'bg-[#F6C56B]' : 'bg-[rgba(255,255,255,0.1)]'}`} />}
                    <div
                      className={`w-3 h-3 rounded-full border-2 shrink-0 ${active ? 'animate-orb-pulse' : ''}`}
                      style={{
                        borderColor: done ? '#F6C56B' : 'rgba(255,255,255,0.15)',
                        background: done ? '#F6C56B' : 'transparent',
                      }}
                    />
                    {i < STATUS_STEPS.length - 1 && <div className={`flex-1 h-px ${done && stepIndex > i ? 'bg-[#F6C56B]' : 'bg-[rgba(255,255,255,0.1)]'}`} />}
                  </div>
                  <p className="font-mono text-[9px] text-[#A4A7E3] mt-1.5 text-center">{statusLabel(s as import('@/types/fiducia').CaseStatus).toUpperCase()}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Case details */}
      <Card>
        <h3 className="font-mono text-xs text-[#A4A7E3] uppercase tracking-widest mb-4">Case Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><p className="font-mono text-xs text-[#A4A7E3]">REQUESTED</p><p className="font-display text-lg text-[#E2ECF5] mt-0.5">{formatAmount(c.loan_amount_requested)}</p></div>
          <div><p className="font-mono text-xs text-[#A4A7E3]">DURATION</p><p className="font-display text-lg text-[#E2ECF5] mt-0.5">{c.loan_duration_months_requested}mo</p></div>
          <div><p className="font-mono text-xs text-[#A4A7E3]">PURPOSE</p><p className="text-sm text-[#E2ECF5] mt-0.5">{c.loan_purpose}</p></div>
          <div><p className="font-mono text-xs text-[#A4A7E3]">BIZ AGE</p><p className="font-mono text-sm text-[#E2ECF5] mt-0.5">{c.business_age_months}mo</p></div>
          <div className="col-span-2">
            <p className="font-mono text-xs text-[#A4A7E3]">COMMITMENT</p>
            <code className="text-xs font-mono text-[#63E6C2] break-all">{c.evidence_commitment || '—'}</code>
          </div>
        </div>
      </Card>

      {/* Actions */}
      {error && <div className="p-3 rounded-lg bg-[rgba(224,93,63,0.1)] border border-[rgba(224,93,63,0.3)]"><p className="text-sm text-[#E05D3F]">{error}</p></div>}

      {canReveal && <EvidenceRevealPanel caseId={caseId} onRevealed={load} />}

      {canTrigger && (
        <Card>
          <h3 className="font-display text-xl text-[#E2ECF5] mb-2">Trigger Review</h3>
          <p className="text-sm text-[#A4A7E3] mb-4">
            Anyone can trigger the review. Pay the review fee to start GenLayer consensus underwriting.
            You cannot influence the verdict — GenLayer validators decide independently.
          </p>
          <p className="font-mono text-xs text-[#A4A7E3] mb-4">Fee: {Number(fee) / 1e18} GEN</p>
          <Button variant="gold" onClick={handleTriggerReview} loading={actionLoading}>
            Trigger GenLayer Review
          </Button>
        </Card>
      )}

      {verdict && (
        <div className="space-y-6">
          <div className="flex items-start gap-8">
            <VerdictSeal verdict={verdict} size="lg" />
            <div className="flex-1 space-y-4">
              <RepaymentOrb probability={verdict.repayment_probability} size={80} />
              <TermRecommendation terms={verdict.recommended_terms} />
            </div>
          </div>
          <Card>
            <ReasoningTrail reasoning={verdict.reasoning} riskFlags={verdict.risk_flags} positiveSignals={verdict.positive_signals} />
          </Card>
          {activeAddress && (
            <div className="flex justify-end">
              <Link href={`/reputation/${activeAddress}`} className="font-mono text-xs text-[#F6C56B] hover:underline">
                View your on-chain reputation →
              </Link>
            </div>
          )}
        </div>
      )}

      {canAppeal && (
        <div className="flex justify-end">
          <Link href={`/borrower/appeals/${caseId}`}>
            <Button variant="cyan">File an Appeal →</Button>
          </Link>
        </div>
      )}

      {canCancel && (
        <div className="pt-4 border-t border-[rgba(255,255,255,0.07)]">
          <Button variant="danger" onClick={handleCancel} loading={actionLoading}>Cancel Case</Button>
        </div>
      )}
    </div>
  );
}
