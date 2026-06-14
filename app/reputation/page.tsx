'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/components/wallet/WalletProvider';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function ReputationIndexPage() {
  const { address, connect, hasProvider, isConnecting } = useWallet();
  const router = useRouter();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (address) router.replace(`/reputation/${address}`);
  }, [address, router]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = search.trim();
    if (trimmed) router.push(`/reputation/${trimmed}`);
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-24 space-y-8">
      <div>
        <p className="font-mono text-xs text-[#A4A7E3] mb-1">REPUTATION LEDGER</p>
        <h1 className="font-display text-3xl text-[#E2ECF5]">On-chain Reputation</h1>
        <p className="text-sm text-[#A4A7E3] mt-2">
          Each address builds a verifiable credit history from GenLayer consensus verdicts.
        </p>
      </div>

      {hasProvider && !address && (
        <Card glow="gold">
          <p className="text-sm text-[#E2ECF5] mb-4">Connect your wallet to view your own reputation.</p>
          <Button variant="gold" onClick={connect} disabled={isConnecting}>
            {isConnecting ? 'Connecting…' : 'Connect Wallet'}
          </Button>
        </Card>
      )}

      <Card>
        <h3 className="font-mono text-xs text-[#A4A7E3] uppercase tracking-widest mb-4">Look up any address</h3>
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="0x…"
            className="flex-1 font-mono text-sm"
          />
          <Button type="submit" variant="ghost" disabled={!search.trim()}>
            View
          </Button>
        </form>
      </Card>
    </div>
  );
}
