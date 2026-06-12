'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCase, BorrowerReputation } from '@/types/fiducia';
import { getBorrowerCases, getBorrowerReputation } from '@/lib/genlayerClient';
import BorrowerCaseCard from '@/components/borrower/BorrowerCaseCard';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useWallet } from '@/components/wallet/WalletProvider';

const DEMO_ADDRESS = '0xA1b2C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F8A9B0';
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

export default function BorrowerDashboard() {
  const { address, connect, hasProvider, isConnecting } = useWallet();
  const [cases, setCases] = useState<CreditCase[]>([]);
  const [reputation, setReputation] = useState<BorrowerReputation | null>(null);
  const [loading, setLoading] = useState(true);
  const activeAddress = address ?? (USE_MOCKS ? DEMO_ADDRESS : null);

  useEffect(() => {
    async function load() {
      if (!activeAddress) {
        setCases([]);
        setReputation(null);
        setLoading(false);
        return;
      }

      try {
        const [c, r] = await Promise.all([
          getBorrowerCases(activeAddress),
          getBorrowerReputation(activeAddress),
        ]);
        setCases(c);
        setReputation(r);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [activeAddress]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="font-mono text-xs text-[#A4A7E3] mb-2">BORROWER DASHBOARD</p>
          <h1 className="font-display text-3xl text-[#E2ECF5]">Your Cases</h1>
        </div>
        <Link href="/borrower/create-case">
          <Button variant="gold">+ New Case</Button>
        </Link>
      </div>

      {/* Wallet */}
      <div className="glass-panel rounded-[8px] p-4 mb-8 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-[#7C9B63] animate-orb-pulse" />
        <p className="font-mono text-sm text-[#A4A7E3]">Connected as</p>
        {activeAddress ? (
          <>
            <code className="font-mono text-sm text-[#63E6C2]">{activeAddress}</code>
            <Link href={`/reputation/${activeAddress}`} className="ml-auto text-xs font-mono text-[#F6C56B] hover:underline">
              View Reputation →
            </Link>
          </>
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
        <Card className="mb-8" glow="gold">
          <h2 className="font-display text-xl text-[#E2ECF5] mb-2">Connect your wallet</h2>
          <p className="text-sm text-[#A4A7E3]">
            The borrower dashboard uses your connected address. Once you connect, we’ll load your cases and reputation here.
          </p>
        </Card>
      )}

      {/* Reputation summary */}
      {reputation && activeAddress && (
        <div className="grid grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Reviews', value: reputation.total_reviewed_cases, color: '#F6C56B' },
            { label: 'Avg Score', value: reputation.average_credit_score.toFixed(0), color: '#E2ECF5' },
            { label: 'Last Decision', value: reputation.last_decision.replace('_', ' '), color: '#7C9B63' },
            { label: 'Avg Repay', value: `${reputation.average_repayment_probability.toFixed(0)}%`, color: '#63E6C2' },
          ].map((stat, i) => (
            <Card key={i}>
              <p className="font-mono text-xs text-[#A4A7E3] mb-1">{stat.label.toUpperCase()}</p>
              <p className="font-display text-2xl" style={{ color: stat.color }}>{stat.value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Cases */}
      {loading ? (
        <div className="text-center py-20 text-[#A4A7E3]">Loading cases…</div>
      ) : cases.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#A4A7E3] mb-4">No cases yet.</p>
          <Link href="/borrower/create-case">
            <Button variant="gold">Create your first case</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((c) => <BorrowerCaseCard key={c.case_id} c={c} />)}
        </div>
      )}
    </div>
  );
}
