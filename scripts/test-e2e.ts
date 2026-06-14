/**
 * End-to-end contract test against Studionet.
 * Tests the full flow: create → commit → reveal → trigger_review → read verdict
 *
 * Usage:
 *   npx tsx scripts/test-e2e.ts
 *
 * Reads DEPLOYER_PRIVATE_KEY and NEXT_PUBLIC_CONTRACT_ADDRESS from .env.local
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionStatus } from 'genlayer-js/types';

// Load .env.local manually
const envPath = join(process.cwd(), '.env.local');
const envLines = readFileSync(envPath, 'utf-8').split('\n');
for (const line of envLines) {
  const [k, ...rest] = line.split('=');
  if (k && !k.startsWith('#')) process.env[k.trim()] = rest.join('=').trim();
}

const CONTRACT = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;

if (!CONTRACT || !PRIVATE_KEY) {
  console.error('Missing NEXT_PUBLIC_CONTRACT_ADDRESS or DEPLOYER_PRIVATE_KEY in .env.local');
  process.exit(1);
}

function log(msg: string) { console.log(`\n[${new Date().toISOString()}] ${msg}`); }

async function waitTx(
  client: ReturnType<typeof createClient>,
  hash: string,
  label: string,
) {
  log(`  Waiting for "${label}" (${hash.slice(0, 10)}…) → ACCEPTED`);
  const receipt = await client.waitForTransactionReceipt({
    hash: hash as `0x${string}`,
    status: TransactionStatus.ACCEPTED,
    retries: 120,
    interval: 5000,
  } as Parameters<typeof client.waitForTransactionReceipt>[0]);
  log(`  ✓ ${label} accepted`);
  return receipt;
}

async function callWrite(
  client: ReturnType<typeof createClient>,
  method: string,
  args: unknown[],
  value = BigInt(0),
) {
  const hash = await client.writeContract({
    address: CONTRACT,
    functionName: method,
    args,
    value,
  } as Parameters<typeof client.writeContract>[0]);
  await waitTx(client, hash as string, method);
  return hash;
}

async function callRead(
  client: ReturnType<typeof createClient>,
  method: string,
  args: unknown[] = [],
) {
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

  log(`Account : ${account.address}`);
  log(`Contract: ${CONTRACT}`);

  // ── 1. Read current stats ──────────────────────────────────────────────────
  const statsBefore = await callRead(client, 'get_protocol_stats');
  log(`Protocol stats before: ${JSON.stringify(statsBefore)}`);

  // ── 2. Create a strong case to avoid rejection ──────────────────────────────
  log('Step 1: create_case');
  await callWrite(client, 'create_case', [
    'Sunrise Bakery Co.',       // business_name
    'Food & Beverage Retail',   // business_type
    50000,                       // loan_amount ($50k)
    24,                          // loan_duration_months
    'Expand kitchen equipment and hire 2 staff for new catering line', // loan_purpose
    36,                          // business_age_months (3 yrs — established)
  ]);

  // Get the new case ID
  const statsAfter1 = await callRead(client, 'get_protocol_stats');
  const caseId = String(statsAfter1.total_cases);
  log(`  Case ID: ${caseId}`);

  // ── 3. Build strong evidence JSON ─────────────────────────────────────────
  const evidence = JSON.stringify({
    schema_version: 'FIDUCIA_SANITISED_V1',
    monthly_revenue_usd: 28000,            // solid revenue
    monthly_expenses_usd: 18000,
    monthly_net_profit_usd: 10000,
    existing_debt_usd: 8000,               // low existing debt
    business_age_months: 36,
    employees: 4,
    industry_sector: 'Food & Beverage',
    credit_history: 'no_defaults',
    collateral_available: true,
    collateral_value_usd: 35000,
    repayment_history: 'on_time_all_payments',
    bank_statements_months: 12,
    avg_monthly_bank_balance_usd: 15000,
    largest_customer_concentration_pct: 20,
    seasonal_business: false,
    owner_personal_credit_score: 740,
    loan_to_annual_revenue_ratio: 0.15,    // very healthy ratio
  });

  const salt = `salt_${Date.now()}_fiducia_test`;
  const raw = evidence + salt;
  const commitment = '0x' + createHash('sha256').update(raw).digest('hex');

  log(`Step 2: commit_evidence (commitment: ${commitment.slice(0, 18)}…)`);
  await callWrite(client, 'commit_evidence', [caseId, commitment]);

  // ── 4. Reveal evidence ────────────────────────────────────────────────────
  log('Step 3: reveal_evidence');
  await callWrite(client, 'reveal_evidence', [caseId, evidence, salt]);

  // Confirm status is READY_FOR_REVIEW
  const caseAfterReveal = await callRead(client, 'get_case', [caseId]);
  log(`  Status after reveal: ${caseAfterReveal.status}`);

  // ── 5. Trigger review (the LLM + consensus step) ─────────────────────────
  const fee = BigInt(statsBefore.review_fee ?? 0);
  log(`Step 4: trigger_review (fee: ${fee} wei) — this runs GenLayer consensus, may take 1–3 min`);
  await callWrite(client, 'trigger_review', [caseId], fee);

  // ── 6. Read verdict ───────────────────────────────────────────────────────
  log('Step 5: read verdict');
  const verdict = await callRead(client, 'get_case_verdict', [caseId]);
  log(`\n${'═'.repeat(60)}`);
  log('VERDICT:');
  console.log(JSON.stringify(verdict, null, 2));

  const statsAfterFinal = await callRead(client, 'get_protocol_stats');
  log(`\nProtocol stats after: ${JSON.stringify(statsAfterFinal)}`);

  const rep = await callRead(client, 'get_borrower_reputation', [account.address]);
  log(`\nReputation for ${account.address}:`);
  console.log(JSON.stringify(rep, null, 2));

  log('\n✓ End-to-end test complete!');
}

main().catch((err) => {
  console.error('\n✗ Test failed:', err);
  process.exit(1);
});
