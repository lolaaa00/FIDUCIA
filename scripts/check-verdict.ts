/**
 * Poll a submitted trigger_review tx and read the verdict once the case is REVIEWED.
 * Usage: CASE_ID=1 TX_HASH=0x1cd7452a... npx tsx scripts/check-verdict.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionStatus } from 'genlayer-js/types';

const envPath = join(process.cwd(), '.env.local');
const envLines = readFileSync(envPath, 'utf-8').split('\n');
for (const line of envLines) {
  const [k, ...rest] = line.split('=');
  if (k && !k.startsWith('#')) process.env[k.trim()] = rest.join('=').trim();
}

const CONTRACT = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
const CASE_ID = process.env.CASE_ID ?? '1';
const TX_HASH = process.env.TX_HASH as `0x${string}` | undefined;

async function callRead(client: ReturnType<typeof createClient>, method: string, args: unknown[] = []) {
  const result = await client.readContract({
    address: CONTRACT,
    functionName: method,
    args,
  } as Parameters<typeof client.readContract>[0]);
  return JSON.parse(result as string);
}

async function main() {
  const account = createAccount(PRIVATE_KEY);
  const client = createClient({ chain: studionet, account } as Parameters<typeof createClient>[0]);

  // If a tx hash was provided, wait for it first
  if (TX_HASH) {
    console.log(`Waiting for tx ${TX_HASH} → ACCEPTED (retrying up to 10 min)…`);
    try {
      await client.waitForTransactionReceipt({
        hash: TX_HASH,
        status: TransactionStatus.ACCEPTED,
        retries: 120,
        interval: 5000,
      } as Parameters<typeof client.waitForTransactionReceipt>[0]);
      console.log('✓ Transaction accepted');
    } catch (e) {
      console.warn('waitForTransactionReceipt failed, polling case status directly:', e);
    }
  }

  // Poll case status until REVIEWED
  for (let i = 0; i < 60; i++) {
    const c = await callRead(client, 'get_case', [CASE_ID]);
    console.log(`[${new Date().toISOString()}] Case ${CASE_ID} status: ${c.status}`);

    if (c.status === 'REVIEWED' || c.status === 'APPEAL_REVIEWED') {
      const verdict = await callRead(client, 'get_case_verdict', [CASE_ID]);
      console.log('\n══ VERDICT ══════════════════════════════════════');
      console.log(JSON.stringify(verdict, null, 2));

      const rep = await callRead(client, 'get_borrower_reputation', [account.address]);
      console.log('\n══ REPUTATION ═══════════════════════════════════');
      console.log(JSON.stringify(rep, null, 2));
      return;
    }

    if (['CANCELLED', 'FLAGGED'].includes(c.status)) {
      console.error(`Case ended with status: ${c.status}`);
      process.exit(1);
    }

    await new Promise((r) => setTimeout(r, 5000));
  }

  console.error('Timed out waiting for verdict');
  process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
