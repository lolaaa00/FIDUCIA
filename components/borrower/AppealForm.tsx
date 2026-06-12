'use client';

import { useState } from 'react';
import { generateSalt, computeEvidenceCommitment } from '@/lib/hashing';
import { commitAppeal, revealAppeal, triggerAppealReview } from '@/lib/genlayerClient';
import { PRIVATE_DATA_WARNINGS, SanitisedEvidenceV1, stripEmptyFields } from '@/lib/evidence';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Textarea from '@/components/ui/Textarea';

interface Props {
  caseId: string;
  reviewFee: bigint;
  onAppealSubmitted: () => void;
}

type Step = 'commit' | 'reveal' | 'trigger' | 'done';

export default function AppealForm({ caseId, reviewFee, onAppealSubmitted }: Props) {
  const [step, setStep] = useState<Step>('commit');
  const [evidence, setEvidence] = useState<Partial<SanitisedEvidenceV1>>({});
  const [salt, setSalt] = useState('');
  const [commitment, setCommitment] = useState('');
  const [evidenceJsonInput, setEvidenceJsonInput] = useState('');
  const [saltInput, setSaltInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submitCommit() {
    const clean = stripEmptyFields(evidence);
    const newSalt = generateSalt();
    const hash = await computeEvidenceCommitment(clean, newSalt);
    setSalt(newSalt);
    setCommitment(hash);
    setLoading(true);
    try {
      await commitAppeal(caseId, hash);
      setStep('reveal');
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function submitReveal() {
    setLoading(true);
    try {
      await revealAppeal(caseId, evidenceJsonInput, saltInput);
      setStep('trigger');
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function submitTrigger() {
    setLoading(true);
    try {
      await triggerAppealReview(caseId, reviewFee);
      setStep('done');
      onAppealSubmitted();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function set(key: keyof SanitisedEvidenceV1) {
    return (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      setEvidence((prev) => ({ ...prev, [key]: e.target.value }));
  }

  if (step === 'done') {
    return (
      <Card glow="cyan">
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-[rgba(99,230,194,0.15)] border border-[#63E6C2] flex items-center justify-center mx-auto mb-3">
            <span className="text-[#63E6C2] text-xl">✓</span>
          </div>
          <h3 className="font-display text-xl text-[#E2ECF5] mb-2">Appeal Under Review</h3>
          <p className="text-sm text-[#A4A7E3]">Your appeal has been submitted to GenLayer validators. The appeal verdict will be stored publicly.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="font-display text-xl text-[#E2ECF5] mb-2">File an Appeal</h3>
      <p className="text-sm text-[#A4A7E3] mb-6">Submit new sanitised evidence through commit-reveal to trigger an appeal review.</p>

      {error && <div className="mb-4 p-3 rounded-lg bg-[rgba(224,93,63,0.1)] border border-[rgba(224,93,63,0.3)]"><p className="text-sm text-[#E05D3F]">{error}</p></div>}

      {step === 'commit' && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-[rgba(246,197,107,0.08)] border border-[rgba(246,197,107,0.2)]">
            <p className="font-mono text-xs text-[#F6C56B] mb-2">DO NOT INCLUDE</p>
            <ul className="text-xs text-[#A4A7E3] space-y-1">
              {PRIVATE_DATA_WARNINGS.map((w, i) => <li key={i}>· {w}</li>)}
            </ul>
          </div>
          <Textarea label="Updated Cashflow Summary" value={evidence.cashflow_summary ?? ''} onChange={set('cashflow_summary')} placeholder="New cashflow data since original review..." />
          <Textarea label="Updated Revenue" value={evidence.monthly_revenue ?? ''} onChange={set('monthly_revenue')} placeholder="Revenue trend since original review..." />
          <Textarea label="New Positive Events" value={evidence.positive_events ?? ''} onChange={set('positive_events')} placeholder="e.g. New contracts signed, revenue milestones..." />
          <Textarea label="Updated Debt / Repayment" value={evidence.existing_debts ?? ''} onChange={set('existing_debts')} placeholder="e.g. Previous supplier debt now cleared..." />
          <Textarea label="Notes" value={evidence.notes ?? ''} onChange={set('notes')} placeholder="Any other relevant context for the appeal..." />
          <Button variant="gold" onClick={submitCommit} loading={loading}>Commit Appeal Evidence</Button>
        </div>
      )}

      {step === 'reveal' && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-[rgba(246,197,107,0.08)] border border-[rgba(246,197,107,0.2)]">
            <p className="font-mono text-[10px] text-[#A4A7E3] mb-1 break-all">Commitment: <span className="text-[#63E6C2]">{commitment}</span></p>
            <p className="font-mono text-[10px] text-[#A4A7E3] mt-1 break-all">Salt: <span className="text-[#F6C56B]">{salt}</span></p>
          </div>
          <div>
            <label className="text-sm text-[#A4A7E3] font-medium block mb-2">Appeal Evidence JSON</label>
            <textarea value={evidenceJsonInput} onChange={(e) => setEvidenceJsonInput(e.target.value)} placeholder='{"cashflow_summary": "...", "positive_events": "..."}' className="font-mono text-xs min-h-[120px]" />
          </div>
          <div>
            <label className="text-sm text-[#A4A7E3] font-medium block mb-2">Salt</label>
            <input type="text" value={saltInput} onChange={(e) => setSaltInput(e.target.value)} placeholder="0x..." className="font-mono text-sm" />
          </div>
          <Button variant="gold" onClick={submitReveal} loading={loading} disabled={!evidenceJsonInput || !saltInput}>Reveal Appeal Evidence</Button>
        </div>
      )}

      {step === 'trigger' && (
        <div className="space-y-4">
          <p className="text-sm text-[#E2ECF5]">Appeal evidence is ready. Pay the review fee to trigger GenLayer consensus.</p>
          <p className="font-mono text-xs text-[#A4A7E3]">Fee: {Number(reviewFee) / 1e18} GEN</p>
          <Button variant="gold" onClick={submitTrigger} loading={loading}>Trigger Appeal Review</Button>
        </div>
      )}
    </Card>
  );
}
