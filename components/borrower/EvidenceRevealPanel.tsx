'use client';

import { useState } from 'react';
import { revealEvidence } from '@/lib/genlayerClient';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function EvidenceRevealPanel({ caseId, onRevealed }: { caseId: string; onRevealed: () => void }) {
  const [evidenceJson, setEvidenceJson] = useState('');
  const [salt, setSalt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    setLoading(true);
    try {
      await revealEvidence(caseId, evidenceJson, salt);
      onRevealed();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h3 className="font-display text-xl text-[#E2ECF5] mb-2">Reveal Evidence</h3>
      <p className="text-sm text-[#A4A7E3] mb-6">
        Submit the original evidence JSON and salt. The contract will verify the commitment.
        Once revealed, the sanitised evidence becomes publicly visible on-chain.
      </p>

      <div className="space-y-5">
        <div>
          <label className="text-sm text-[#A4A7E3] font-medium block mb-2">Evidence JSON</label>
          <textarea
            value={evidenceJson}
            onChange={(e) => setEvidenceJson(e.target.value)}
            placeholder='{"monthly_revenue_last_6_months": [...], "cashflow_summary": "..."}'
            className="font-mono text-xs min-h-[160px] resize-none"
          />
        </div>
        <div>
          <label className="text-sm text-[#A4A7E3] font-medium block mb-2">Salt</label>
          <input
            type="text"
            value={salt}
            onChange={(e) => setSalt(e.target.value)}
            placeholder="0x..."
            className="font-mono text-sm"
          />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-[#E05D3F]">{error}</p>}

      <div className="mt-6">
        <Button variant="gold" onClick={submit} loading={loading} disabled={!evidenceJson || !salt}>
          Reveal Evidence
        </Button>
      </div>
    </Card>
  );
}
