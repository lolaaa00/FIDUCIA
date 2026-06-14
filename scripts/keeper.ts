/**
 * Fiducia Keeper — monitors the contract and triggers pending reviews / appeal reviews.
 *
 * Run manually:    npx tsx scripts/keeper.ts
 * Run in CI/CD:   see .github/workflows/keeper.yml (cron schedule)
 *
 * Required env vars:
 *   KEEPER_PRIVATE_KEY          — 0x-prefixed key of the funded keeper wallet
 *   NEXT_PUBLIC_CONTRACT_ADDRESS — deployed FiduciaProtocol address
 *   REVIEW_FEE_WEI              — fee to attach to trigger_review calls (default: 0 for Studionet)
 */

import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionStatus } from 'genlayer-js/types';

// ─── Config ───────────────────────────────────────────────────────────────────

const PRIVATE_KEY = process.env.KEEPER_PRIVATE_KEY as `0x${string}` | undefined;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined;

if (!PRIVATE_KEY) throw new Error('KEEPER_PRIVATE_KEY is required');
if (!CONTRACT_ADDRESS) throw new Error('NEXT_PUBLIC_CONTRACT_ADDRESS is required');

const chain = {
  ...studionet,
  blockExplorers: {
    default: { name: 'GenLayer Studio Explorer', url: 'https://explorer-studio.genlayer.com' },
  },
};

// ─── Clients ─────────────────────────────────────────────────────────────────

const account = createAccount(PRIVATE_KEY);
const readClient  = createClient({ chain } as Parameters<typeof createClient>[0]);
const writeClient = createClient({ chain, account } as Parameters<typeof createClient>[0]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function readContract(functionName: string, args: unknown[] = []): Promise<unknown> {
  return readClient.readContract({
    address: CONTRACT_ADDRESS!,
    functionName,
    args,
  } as Parameters<typeof readClient.readContract>[0]);
}

async function writeContract(functionName: string, args: unknown[], value = BigInt(0)): Promise<string> {
  const hash = await writeClient.writeContract({
    address: CONTRACT_ADDRESS!,
    functionName,
    args,
    value,
  } as Parameters<typeof writeClient.writeContract>[0]);
  return String(hash);
}

async function waitAccepted(hash: string): Promise<void> {
  await writeClient.waitForTransactionReceipt({
    hash: hash as `0x${string}`,
    status: TransactionStatus.ACCEPTED,
    retries: 60,
    interval: 4000,
  } as Parameters<typeof writeClient.waitForTransactionReceipt>[0]);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface CaseRecord {
  case_id: string;
  status: string;
  business_name: string;
  borrower: string;
}

async function run() {
  console.log(`[keeper] Starting — contract: ${CONTRACT_ADDRESS}`);
  console.log(`[keeper] Keeper wallet: ${account.address}`);

  // 1. Get total number of cases
  const statsRaw = await readContract('get_protocol_stats') as string;
  const stats = JSON.parse(statsRaw) as { total_cases: number; paused: boolean; review_fee: number };

  if (stats.paused) {
    console.log('[keeper] Protocol is paused — skipping.');
    return;
  }

  // Read fee directly from contract so the keeper always sends the right amount
  const REVIEW_FEE = BigInt(stats.review_fee);
  console.log(`[keeper] Total cases on-chain: ${stats.total_cases}`);
  console.log(`[keeper] Review fee from contract: ${REVIEW_FEE} wei`);

  // 2. Fetch every case and collect the ones needing action
  const pendingReview: CaseRecord[] = [];
  const pendingAppealReview: CaseRecord[] = [];

  for (let id = 1; id <= stats.total_cases; id++) {
    const raw = await readContract('get_case', [String(id)]) as string;
    if (raw === 'null') continue;
    const c = JSON.parse(raw) as CaseRecord;
    if (c.status === 'READY_FOR_REVIEW')        pendingReview.push(c);
    if (c.status === 'READY_FOR_APPEAL_REVIEW') pendingAppealReview.push(c);
  }

  console.log(`[keeper] Pending review:        ${pendingReview.length}`);
  console.log(`[keeper] Pending appeal review: ${pendingAppealReview.length}`);

  // 3. Trigger reviews
  for (const c of pendingReview) {
    console.log(`\n[keeper] → trigger_review  case #${c.case_id} (${c.business_name})`);
    try {
      const hash = await writeContract('trigger_review', [c.case_id], REVIEW_FEE);
      console.log(`[keeper]   tx: ${hash}`);
      console.log('[keeper]   waiting for ACCEPTED…');
      await waitAccepted(hash);
      console.log('[keeper]   ✓ accepted');
    } catch (err) {
      console.error(`[keeper]   ✗ failed: ${(err as Error).message}`);
    }
  }

  // 4. Trigger appeal reviews
  for (const c of pendingAppealReview) {
    console.log(`\n[keeper] → trigger_appeal_review  case #${c.case_id} (${c.business_name})`);
    try {
      const hash = await writeContract('trigger_appeal_review', [c.case_id], REVIEW_FEE);
      console.log(`[keeper]   tx: ${hash}`);
      console.log('[keeper]   waiting for ACCEPTED…');
      await waitAccepted(hash);
      console.log('[keeper]   ✓ accepted');
    } catch (err) {
      console.error(`[keeper]   ✗ failed: ${(err as Error).message}`);
    }
  }

  console.log('\n[keeper] Done.');
}

run().catch((err) => {
  console.error('[keeper] Fatal:', err);
  process.exit(1);
});
