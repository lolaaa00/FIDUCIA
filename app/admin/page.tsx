'use client';

import { useEffect, useState } from 'react';
import { ProtocolStats } from '@/types/fiducia';
import { getProtocolStats, pauseProtocol, unpauseProtocol, setReviewFee, flagCase } from '@/lib/genlayerClient';
import { useWallet } from '@/components/wallet/WalletProvider';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function AdminPage() {
  const { address, connect, hasProvider, isConnecting } = useWallet();
  const [stats, setStats] = useState<ProtocolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [newFee, setNewFee] = useState('');
  const [flagCaseId, setFlagCaseId] = useState('');
  const [flagReason, setFlagReason] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [msg, setMsg] = useState('');

  async function reload() {
    const s = await getProtocolStats();
    setStats(s);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    getProtocolStats().then((s) => {
      if (!active) return;
      setStats(s);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  async function act(key: string, fn: () => Promise<unknown>) {
    setActionLoading(key);
    setMsg('');
    try {
      await fn();
      await reload();
      setMsg('Done.');
    } catch (e: unknown) {
      setMsg((e as Error).message);
    } finally {
      setActionLoading('');
    }
  }

  const isAdmin = address && stats && address.toLowerCase() === stats.admin.toLowerCase();

  if (loading) return <div className="text-center py-32 text-[#A4A7E3]">Loading…</div>;
  if (!stats) return null;

  if (!address) return (
    <div className="max-w-md mx-auto px-6 py-32 text-center space-y-6">
      <p className="font-display text-2xl text-[#E2ECF5]">Admin access required</p>
      <p className="text-sm text-[#A4A7E3]">Connect the admin wallet to continue.</p>
      <Button variant="gold" onClick={connect} disabled={!hasProvider || isConnecting}>
        {isConnecting ? 'Connecting…' : 'Connect Wallet'}
      </Button>
    </div>
  );

  if (!isAdmin) return (
    <div className="max-w-md mx-auto px-6 py-32 text-center space-y-4">
      <p className="font-display text-2xl text-[#E05D3F]">Access denied</p>
      <p className="text-sm text-[#A4A7E3]">
        Connected as <code className="font-mono text-[#63E6C2]">{address}</code>
      </p>
      <p className="text-sm text-[#A4A7E3]">Only the protocol admin can access this page.</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <div>
        <p className="font-mono text-xs text-[#A4A7E3] mb-1">ADMIN</p>
        <h1 className="font-display text-3xl text-[#E2ECF5]">Protocol Settings</h1>
        <p className="text-sm text-[#E05D3F] mt-2">Admin controls do not affect credit verdicts. GenLayer consensus is the sole underwriting authority.</p>
      </div>

      {msg && (
        <div className="p-3 rounded-lg bg-[rgba(246,197,107,0.1)] border border-[rgba(246,197,107,0.3)]">
          <p className="text-sm text-[#F6C56B]">{msg}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Cases', value: stats.total_cases },
          { label: 'Total Reviews', value: stats.total_reviews },
          { label: 'Total Appeals', value: stats.total_appeals },
        ].map((s, i) => (
          <Card key={i}>
            <p className="font-mono text-xs text-[#A4A7E3] mb-1">{s.label.toUpperCase()}</p>
            <p className="font-display text-2xl text-[#F6C56B]">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Pause/Unpause */}
      <Card>
        <h3 className="font-display text-lg text-[#E2ECF5] mb-3">Protocol Status</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${stats.paused ? 'bg-[#E05D3F]' : 'bg-[#7C9B63] animate-orb-pulse'}`} />
            <span className="font-mono text-sm text-[#E2ECF5]">{stats.paused ? 'PAUSED' : 'ACTIVE'}</span>
          </div>
          {stats.paused ? (
            <Button variant="moss" size="sm" loading={actionLoading === 'unpause'} onClick={() => act('unpause', unpauseProtocol)}>
              Unpause Protocol
            </Button>
          ) : (
            <Button variant="danger" size="sm" loading={actionLoading === 'pause'} onClick={() => act('pause', pauseProtocol)}>
              Pause Protocol
            </Button>
          )}
        </div>
      </Card>

      {/* Review Fee */}
      <Card>
        <h3 className="font-display text-lg text-[#E2ECF5] mb-1">Review Fee</h3>
        <p className="text-xs text-[#A4A7E3] mb-3">
          Current: <span className="text-[#F6C56B] font-mono">{Number(stats.review_fee) / 1e18} GEN</span>
        </p>
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <input
              type="number"
              min="0"
              step="0.001"
              value={newFee}
              onChange={(e) => setNewFee(e.target.value)}
              placeholder="e.g. 0.01"
              className="w-full font-mono pr-14"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#A4A7E3] pointer-events-none">
              GEN
            </span>
          </div>
          <Button
            variant="ghost"
            loading={actionLoading === 'fee'}
            onClick={() => {
              const wei = Math.round(parseFloat(newFee) * 1e18);
              act('fee', () => setReviewFee(wei));
            }}
          >
            Update
          </Button>
        </div>
        {newFee && !isNaN(parseFloat(newFee)) && (
          <p className="font-mono text-xs text-[#A4A7E3] mt-2">
            = {Math.round(parseFloat(newFee) * 1e18).toLocaleString()} wei
          </p>
        )}
      </Card>

      {/* Flag case */}
      <Card>
        <h3 className="font-display text-lg text-[#E2ECF5] mb-1">Flag a Case</h3>
        <p className="text-xs text-[#A4A7E3] mb-4">Flag spam or abusive cases. This does not alter the credit verdict.</p>
        <div className="space-y-3">
          <input type="text" value={flagCaseId} onChange={(e) => setFlagCaseId(e.target.value)} placeholder="Case ID" />
          <input type="text" value={flagReason} onChange={(e) => setFlagReason(e.target.value)} placeholder="Reason for flagging" />
          <Button
            variant="danger"
            size="sm"
            loading={actionLoading === 'flag'}
            onClick={() => act('flag', () => flagCase(flagCaseId, flagReason))}
          >
            Flag Case
          </Button>
        </div>
      </Card>

      {/* Evidence schema version */}
      <Card>
        <h3 className="font-display text-lg text-[#E2ECF5] mb-1">Evidence Schema</h3>
        <p className="font-mono text-xs text-[#63E6C2]">FIDUCIA_SANITISED_V1</p>
        <p className="text-xs text-[#A4A7E3] mt-2">Schema version is enforced at the contract level. Upgrade requires contract redeployment.</p>
      </Card>
    </div>
  );
}
