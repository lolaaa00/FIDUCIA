'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCase } from '@/lib/genlayerClient';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import EvidenceCommitPanel from '@/components/borrower/EvidenceCommitPanel';
import Card from '@/components/ui/Card';
import { useWallet } from '@/components/wallet/WalletProvider';

const DEMO_ADDRESS = '0xA1b2C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F8A9B0';
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

interface CaseForm {
  business_name: string;
  business_type: string;
  loan_amount_requested: string;
  loan_duration_months_requested: string;
  loan_purpose: string;
  business_age_months: string;
}

export default function CreateCasePage() {
  const router = useRouter();
  const { address, connect, hasProvider, isConnecting } = useWallet();
  const [step, setStep] = useState<'form' | 'evidence'>('form');
  const [caseId, setCaseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const activeAddress = address ?? (USE_MOCKS ? DEMO_ADDRESS : null);
  const [form, setForm] = useState<CaseForm>({
    business_name: '',
    business_type: '',
    loan_amount_requested: '',
    loan_duration_months_requested: '',
    loan_purpose: '',
    business_age_months: '',
  });

  function set(field: keyof CaseForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function submitCase() {
    if (!form.business_name || !form.loan_amount_requested) {
      setError('Please fill all required fields.');
      return;
    }
    if (!activeAddress) {
      setError('Connect your wallet before creating a case.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const id = await createCase(
        form.business_name,
        form.business_type,
        Number(form.loan_amount_requested),
        Number(form.loan_duration_months_requested),
        form.loan_purpose,
        Number(form.business_age_months),
        activeAddress,
      );
      setCaseId(id);
      setStep('evidence');
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (step === 'evidence' && caseId) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <p className="font-mono text-xs text-[#7C9B63] mb-1">CASE #{caseId} CREATED</p>
          <h1 className="font-display text-3xl text-[#E2ECF5]">Commit Your Evidence</h1>
        </div>
        <EvidenceCommitPanel caseId={caseId} onCommitted={() => router.push(`/borrower/cases/${caseId}`)} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="font-mono text-xs text-[#A4A7E3] mb-2">BORROWER</p>
        <h1 className="font-display text-3xl text-[#E2ECF5] mb-2">Create Credit Case</h1>
        <p className="text-sm text-[#A4A7E3]">
          Submit your business details and requested loan terms. You will commit sanitised evidence in the next step.
        </p>
      </div>

      <div className="glass-panel rounded-[8px] p-4 mb-6 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-[#63E6C2] animate-orb-pulse" />
        <p className="font-mono text-sm text-[#A4A7E3]">Borrower address</p>
        {activeAddress ? (
          <code className="font-mono text-sm text-[#63E6C2]">{activeAddress}</code>
        ) : (
          <>
            <span className="font-mono text-sm text-[#E05D3F]">Wallet not connected</span>
            <Button className="ml-auto" variant="ghost" size="sm" onClick={connect} disabled={!hasProvider || isConnecting}>
              Connect Wallet
            </Button>
          </>
        )}
      </div>

      {!activeAddress && !USE_MOCKS && (
        <Card className="mb-6" glow="gold">
          <p className="text-sm text-[#A4A7E3]">
            Connect a wallet to continue. The case will be created under your address and signed by your wallet.
          </p>
        </Card>
      )}

      <div className="space-y-6">
        {/* Section 1: Business Identity */}
        <div className="glass-panel rounded-[8px] p-6">
          <h2 className="font-display text-lg text-[#F6C56B] mb-5">1. Business Identity</h2>
          <div className="space-y-4">
            <Input label="Business Name *" value={form.business_name} onChange={set('business_name')} placeholder="e.g. Sunrise Textile Co." />
            <Input label="Business Type *" value={form.business_type} onChange={set('business_type')} placeholder="e.g. Online fashion marketplace" />
            <Input
              label="Business Age (months) *"
              type="number"
              value={form.business_age_months}
              onChange={set('business_age_months')}
              placeholder="e.g. 18"
            />
          </div>
        </div>

        {/* Section 2: Requested Loan Terms */}
        <div className="glass-panel rounded-[8px] p-6">
          <h2 className="font-display text-lg text-[#F6C56B] mb-5">2. Requested Loan Terms</h2>
          <div className="space-y-4">
            <Input
              label="Loan Amount Requested (USD) *"
              type="number"
              value={form.loan_amount_requested}
              onChange={set('loan_amount_requested')}
              placeholder="e.g. 5000"
            />
            <Input
              label="Loan Duration (months) *"
              type="number"
              value={form.loan_duration_months_requested}
              onChange={set('loan_duration_months_requested')}
              placeholder="e.g. 12"
            />
            <Textarea
              label="Loan Purpose *"
              value={form.loan_purpose}
              onChange={set('loan_purpose')}
              placeholder="e.g. Inventory expansion ahead of festive season"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[rgba(224,93,63,0.1)] border border-[rgba(224,93,63,0.3)]">
            <p className="text-sm text-[#E05D3F]">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => router.push('/borrower')}>Cancel</Button>
          <Button variant="gold" onClick={submitCase} loading={loading} disabled={!activeAddress && !USE_MOCKS}>
            Create Case & Proceed to Evidence →
          </Button>
        </div>
      </div>
    </div>
  );
}
