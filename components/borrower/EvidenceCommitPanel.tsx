'use client';

import { useState } from 'react';
import { generateSalt, computeEvidenceCommitment } from '@/lib/hashing';
import { validateEvidenceShape, stripEmptyFields, PRIVATE_DATA_WARNINGS, SanitisedEvidenceV1 } from '@/lib/evidence';
import { commitEvidence } from '@/lib/genlayerClient';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Textarea from '@/components/ui/Textarea';

interface Props {
  caseId: string;
  onCommitted: () => void;
}

const FIELDS: { key: keyof SanitisedEvidenceV1; label: string; placeholder: string; required?: boolean }[] = [
  { key: 'monthly_revenue', label: 'Monthly Revenue Summary', placeholder: 'e.g. Average monthly revenue ~2,200 over last 6 months, trending up.', required: true },
  { key: 'monthly_expenses', label: 'Monthly Expenses Summary', placeholder: 'e.g. Fixed costs ~800/mo, variable ~400/mo.' },
  { key: 'cashflow_summary', label: 'Cashflow Summary', placeholder: 'e.g. Positive cashflow in 5 of last 6 months.', required: true },
  { key: 'bank_statement_summary', label: 'Bank Statement Summary', placeholder: 'e.g. Average balance 3,000–5,000. No overdrafts in 6 months.' },
  { key: 'sales_records_summary', label: 'Sales Records Summary', placeholder: 'e.g. 40–60 transactions/month, growing steadily.' },
  { key: 'existing_debts', label: 'Existing Debts', placeholder: 'e.g. One supplier debt of 800, being repaid monthly.' },
  { key: 'repayment_history', label: 'Repayment History', placeholder: 'e.g. No missed payments reported to date.' },
  { key: 'business_assets', label: 'Business Assets', placeholder: 'e.g. Delivery vehicle (owned), small warehouse space (leased).' },
  { key: 'customer_concentration', label: 'Customer Concentration', placeholder: 'e.g. Top customer is 20% of revenue. 30+ active customers.' },
  { key: 'supplier_reliability', label: 'Supplier Reliability', placeholder: 'e.g. 3 main suppliers, all 2+ year relationships, no disputes.' },
  { key: 'owner_experience', label: 'Owner Experience', placeholder: 'e.g. 5 years in the sector, 1 prior successful business.' },
  { key: 'market_context', label: 'Market Context', placeholder: 'e.g. Growing local demand. Low direct competition in the area.' },
  { key: 'negative_events', label: 'Negative Events / Disclosures', placeholder: 'e.g. Revenue dipped in Q1 due to seasonal slowdown.' },
  { key: 'positive_events', label: 'Positive Events / Signals', placeholder: 'e.g. Won a 12-month supply contract last month.' },
  { key: 'notes', label: 'Additional Notes', placeholder: 'Any other relevant context for the underwriter.' },
];

export default function EvidenceCommitPanel({ caseId, onCommitted }: Props) {
  const [evidence, setEvidence] = useState<Partial<SanitisedEvidenceV1>>({});
  const [salt, setSalt] = useState('');
  const [commitment, setCommitment] = useState('');
  const [step, setStep] = useState<'form' | 'review' | 'done'>('form');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  function set(key: keyof SanitisedEvidenceV1) {
    return (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      setEvidence((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function generateCommitment() {
    const clean = stripEmptyFields(evidence);
    const errs = validateEvidenceShape(evidence);
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    const newSalt = generateSalt();
    const hash = await computeEvidenceCommitment(clean, newSalt);
    setSalt(newSalt);
    setCommitment(hash);
    setStep('review');
  }

  async function submit() {
    setLoading(true);
    try {
      await commitEvidence(caseId, commitment);
      setStep('done');
      onCommitted();
    } catch (e: unknown) {
      setErrors([(e as Error).message]);
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string) { navigator.clipboard.writeText(text); }

  if (step === 'done') {
    return (
      <Card glow="cyan">
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-[rgba(99,230,194,0.15)] border border-[#63E6C2] flex items-center justify-center mx-auto mb-3">
            <span className="text-[#63E6C2] text-xl">✓</span>
          </div>
          <h3 className="font-display text-xl text-[#E2ECF5] mb-2">Evidence Committed</h3>
          <p className="text-sm text-[#A4A7E3]">Keep your salt safe — you will need it to reveal.</p>
        </div>
      </Card>
    );
  }

  if (step === 'review') {
    const clean = stripEmptyFields(evidence);
    return (
      <Card>
        <h3 className="font-display text-xl text-[#E2ECF5] mb-6">Review & Submit Commitment</h3>

        <div className="mb-5 p-4 rounded-lg bg-[rgba(224,93,63,0.1)] border border-[rgba(224,93,63,0.3)]">
          <p className="text-sm text-[#E05D3F] font-semibold mb-1">⚠ Save your salt before proceeding</p>
          <p className="text-xs text-[#A4A7E3]">Losing this salt means you cannot reveal evidence and the case cannot be reviewed.</p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <p className="font-mono text-xs text-[#A4A7E3] mb-2">COMMITMENT HASH</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-[#63E6C2] bg-[rgba(99,230,194,0.08)] px-3 py-2 rounded-lg break-all border border-[rgba(99,230,194,0.2)]">
                {commitment}
              </code>
              <button onClick={() => copy(commitment)} className="text-[#A4A7E3] hover:text-[#63E6C2] text-xs transition-colors">Copy</button>
            </div>
          </div>
          <div>
            <p className="font-mono text-xs text-[#A4A7E3] mb-2">YOUR SALT (SAVE THIS)</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-[#F6C56B] bg-[rgba(246,197,107,0.08)] px-3 py-2 rounded-lg break-all border border-[rgba(246,197,107,0.2)]">
                {salt}
              </code>
              <button onClick={() => copy(salt)} className="text-[#A4A7E3] hover:text-[#F6C56B] text-xs transition-colors">Copy</button>
            </div>
          </div>
          <div>
            <p className="font-mono text-xs text-[#A4A7E3] mb-2">EVIDENCE FIELDS ({Object.keys(clean).length})</p>
            <div className="space-y-1">
              {Object.entries(clean).map(([k, v]) => (
                <div key={k} className="flex gap-2 text-xs">
                  <span className="font-mono text-[#F6C56B] w-40 shrink-0">{k}</span>
                  <span className="text-[#A4A7E3] truncate">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-[rgba(224,93,63,0.1)] border border-[rgba(224,93,63,0.3)]">
            {errors.map((e, i) => <p key={i} className="text-sm text-[#E05D3F]">{e}</p>)}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setStep('form')}>Back</Button>
          <Button variant="gold" onClick={submit} loading={loading}>Submit Commitment</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="font-display text-xl text-[#E2ECF5] mb-2">Commit Sanitised Evidence</h3>
      <p className="text-sm text-[#A4A7E3] mb-6">
        Fill in whichever fields apply to your business. Evidence is hashed locally — only the commitment hash goes on-chain until you reveal.
      </p>

      <div className="mb-5 p-4 rounded-lg bg-[rgba(246,197,107,0.08)] border border-[rgba(246,197,107,0.2)]">
        <p className="font-mono text-xs text-[#F6C56B] mb-2">DO NOT INCLUDE</p>
        <ul className="text-xs text-[#A4A7E3] space-y-1">
          {PRIVATE_DATA_WARNINGS.map((w, i) => <li key={i}>· {w}</li>)}
        </ul>
      </div>

      <div className="space-y-4">
        {FIELDS.map(({ key, label, placeholder, required }) => (
          <Textarea
            key={key}
            label={`${label}${required ? ' *' : ''}`}
            value={evidence[key] ?? ''}
            onChange={set(key)}
            placeholder={placeholder}
          />
        ))}
      </div>

      {errors.length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-[rgba(224,93,63,0.1)] border border-[rgba(224,93,63,0.3)]">
          {errors.map((e, i) => <p key={i} className="text-sm text-[#E05D3F]">{e}</p>)}
        </div>
      )}

      <div className="mt-6">
        <Button variant="gold" onClick={generateCommitment}>Generate Commitment</Button>
      </div>
    </Card>
  );
}
