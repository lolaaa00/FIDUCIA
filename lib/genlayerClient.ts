'use client';

// Fiducia — GenLayer Contract Adapter
// All contract interaction goes through this file.
// Set NEXT_PUBLIC_USE_MOCKS=true for mock mode.
// Set NEXT_PUBLIC_CONTRACT_ADDRESS to the deployed contract address.

import {
  CreditCase,
  SanitisedEvidence,
  CaseVerdict,
  Appeal,
  AppealVerdict,
  BorrowerReputation,
  ReviewedCaseRecord,
  ProtocolStats,
} from '@/types/fiducia';

import {
  MOCK_CASES,
  MOCK_VERDICTS,
  MOCK_APPEAL_VERDICTS,
  MOCK_REPUTATION,
  MOCK_REVIEWED_CASES,
  MOCK_PROTOCOL_STATS,
} from './mockData';

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';
const CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? '0x0000000000000000000000000000000000000000'
) as `0x${string}`;

// ─── Studionet chain config ───────────────────────────────────────────────────
// Chain ID 61999, imported from genlayer-js and explorer URL overridden.

async function getStudionet() {
  const { chains } = await import('genlayer-js');
  return {
    ...chains.studionet,
    id: 61999,
    rpcUrls: {
      default: { http: ['https://studio.genlayer.com/api'] as readonly string[] },
    },
    blockExplorers: {
      default: {
        name: 'GenLayer Studio Explorer',
        url: 'https://explorer-studio.genlayer.com',
      },
    },
  };
}

// ─── Read client (no wallet needed) ──────────────────────────────────────────
async function getClient() {
  if (USE_MOCKS) return null;
  const { createClient } = await import('genlayer-js');
  const chain = await getStudionet();
  return createClient({ chain } as Parameters<typeof createClient>[0]);
}

// ─── Write client (injected wallet via genlayer-js) ───────────────────────────
// Gets window.ethereum and passes it to genlayer-js. The SDK calls
// eth_sendTransaction on the injected provider, which triggers the wallet popup.
async function getWriteClient() {
  if (USE_MOCKS) return null;

  if (typeof window === 'undefined') {
    throw new Error('Write operations are only available in the browser.');
  }

  const ethereum = (window as Window & { ethereum?: unknown }).ethereum;
  if (!ethereum) {
    throw new Error('No injected wallet detected. Please install MetaMask or another Web3 wallet.');
  }

  // Request accounts — triggers the wallet connect popup if not already connected.
  const accounts = (await (ethereum as { request: (args: { method: string }) => Promise<string[]> })
    .request({ method: 'eth_requestAccounts' })) as string[];

  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts returned. Please unlock your wallet and try again.');
  }

  const address = accounts[0] as `0x${string}`;
  const { createClient } = await import('genlayer-js');
  const chain = await getStudionet();

  // provider: ethereum → genlayer-js uses it to sign & broadcast transactions.
  // account: address  → tells genlayer-js which account is signing.
  return createClient({
    chain,
    account: address,
    provider: ethereum as never,
  } as Parameters<typeof createClient>[0]);
}

// ─── Mock state ───────────────────────────────────────────────────────────────
const mockCases = [...MOCK_CASES];
const mockVerdicts = { ...MOCK_VERDICTS };
const mockAppealVerdicts = { ...MOCK_APPEAL_VERDICTS };
const mockReputation = { ...MOCK_REPUTATION };
const mockProtocolStats = { ...MOCK_PROTOCOL_STATS };

// ─── Write functions ──────────────────────────────────────────────────────────

export async function createCase(
  businessName: string,
  businessType: string,
  loanAmountRequested: number,
  loanDurationMonthsRequested: number,
  loanPurpose: string,
  businessAgeMonths: number,
  senderAddress: string,
): Promise<string> {
  if (USE_MOCKS) {
    const newId = String(mockCases.length + 1);
    mockCases.push({
      case_id: newId,
      borrower: senderAddress,
      business_name: businessName,
      business_type: businessType,
      loan_amount_requested: loanAmountRequested,
      loan_duration_months_requested: loanDurationMonthsRequested,
      loan_purpose: loanPurpose,
      business_age_months: businessAgeMonths,
      evidence_commitment: '',
      evidence_schema_version: 'FIDUCIA_SANITISED_V1',
      status: 'CREATED',
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000),
    });
    mockProtocolStats.total_cases += 1;
    return newId;
  }

  const client = await getWriteClient();
  const result = await client!.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'create_case',
    args: [businessName, businessType, loanAmountRequested, loanDurationMonthsRequested, loanPurpose, businessAgeMonths],
    value: BigInt(0),
  });
  return String(result);
}

export async function commitEvidence(caseId: string, commitment: string): Promise<void> {
  if (USE_MOCKS) {
    const c = mockCases.find((x) => x.case_id === caseId);
    if (c) { c.evidence_commitment = commitment; c.status = 'COMMITTED'; }
    return;
  }
  const client = await getWriteClient();
  await client!.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'commit_evidence',
    args: [caseId, commitment],
    value: BigInt(0),
  });
}

export async function revealEvidence(caseId: string, evidenceJson: string, salt: string): Promise<void> {
  if (USE_MOCKS) {
    const c = mockCases.find((x) => x.case_id === caseId);
    if (c) c.status = 'READY_FOR_REVIEW';
    return;
  }
  const client = await getWriteClient();
  await client!.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'reveal_evidence',
    args: [caseId, evidenceJson, salt],
    value: BigInt(0),
  });
}

export async function cancelCase(caseId: string): Promise<void> {
  if (USE_MOCKS) {
    const c = mockCases.find((x) => x.case_id === caseId);
    if (c) c.status = 'CANCELLED';
    return;
  }
  const client = await getWriteClient();
  await client!.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'cancel_case',
    args: [caseId],
    value: BigInt(0),
  });
}

export async function triggerReview(caseId: string, fee: bigint): Promise<void> {
  if (USE_MOCKS) {
    const c = mockCases.find((x) => x.case_id === caseId);
    if (c) c.status = 'UNDER_REVIEW';
    return;
  }
  const client = await getWriteClient();
  await client!.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'trigger_review',
    args: [caseId],
    value: fee,
  });
}

export async function commitAppeal(caseId: string, appealCommitment: string): Promise<void> {
  if (USE_MOCKS) {
    const c = mockCases.find((x) => x.case_id === caseId);
    if (c) c.status = 'APPEAL_COMMITTED';
    return;
  }
  const client = await getWriteClient();
  await client!.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'commit_appeal',
    args: [caseId, appealCommitment],
    value: BigInt(0),
  });
}

export async function revealAppeal(caseId: string, appealEvidenceJson: string, salt: string): Promise<void> {
  if (USE_MOCKS) {
    const c = mockCases.find((x) => x.case_id === caseId);
    if (c) c.status = 'READY_FOR_APPEAL_REVIEW';
    return;
  }
  const client = await getWriteClient();
  await client!.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'reveal_appeal',
    args: [caseId, appealEvidenceJson, salt],
    value: BigInt(0),
  });
}

export async function triggerAppealReview(caseId: string, fee: bigint): Promise<void> {
  if (USE_MOCKS) {
    const c = mockCases.find((x) => x.case_id === caseId);
    if (c) c.status = 'APPEAL_UNDER_REVIEW';
    return;
  }
  const client = await getWriteClient();
  await client!.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'trigger_appeal_review',
    args: [caseId],
    value: fee,
  });
}

export async function setReviewFee(newFee: number): Promise<void> {
  if (USE_MOCKS) { mockProtocolStats.review_fee = newFee; return; }
  const client = await getWriteClient();
  await client!.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'set_review_fee',
    args: [newFee],
    value: BigInt(0),
  });
}

export async function pauseProtocol(): Promise<void> {
  if (USE_MOCKS) { mockProtocolStats.paused = true; return; }
  const client = await getWriteClient();
  await client!.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'pause',
    args: [],
    value: BigInt(0),
  });
}

export async function unpauseProtocol(): Promise<void> {
  if (USE_MOCKS) { mockProtocolStats.paused = false; return; }
  const client = await getWriteClient();
  await client!.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'unpause',
    args: [],
    value: BigInt(0),
  });
}

export async function flagCase(caseId: string, reason: string): Promise<void> {
  if (USE_MOCKS) {
    const c = mockCases.find((x) => x.case_id === caseId);
    if (c) c.status = 'FLAGGED';
    return;
  }
  const client = await getWriteClient();
  await client!.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'flag_case',
    args: [caseId, reason],
    value: BigInt(0),
  });
}

// ─── Read functions ───────────────────────────────────────────────────────────

export async function getCase(caseId: string): Promise<CreditCase | null> {
  if (USE_MOCKS) return mockCases.find((c) => c.case_id === caseId) ?? null;
  const client = await getClient();
  const raw = await client!.readContract({ address: CONTRACT_ADDRESS, functionName: 'get_case', args: [caseId] });
  return raw ? JSON.parse(raw as string) : null;
}

export async function getCaseEvidence(caseId: string): Promise<SanitisedEvidence | null> {
  if (USE_MOCKS) return null;
  const client = await getClient();
  const raw = await client!.readContract({ address: CONTRACT_ADDRESS, functionName: 'get_case_evidence', args: [caseId] });
  return raw ? JSON.parse(raw as string) : null;
}

export async function getCaseVerdict(caseId: string): Promise<CaseVerdict | null> {
  if (USE_MOCKS) return mockVerdicts[caseId] ?? null;
  const client = await getClient();
  const raw = await client!.readContract({ address: CONTRACT_ADDRESS, functionName: 'get_case_verdict', args: [caseId] });
  return raw ? JSON.parse(raw as string) : null;
}

export async function getAppeal(caseId: string): Promise<Appeal | null> {
  if (USE_MOCKS) return null;
  const client = await getClient();
  const raw = await client!.readContract({ address: CONTRACT_ADDRESS, functionName: 'get_appeal', args: [caseId] });
  return raw ? JSON.parse(raw as string) : null;
}

export async function getAppealVerdict(caseId: string): Promise<AppealVerdict | null> {
  if (USE_MOCKS) return mockAppealVerdicts[caseId] ?? null;
  const client = await getClient();
  const raw = await client!.readContract({ address: CONTRACT_ADDRESS, functionName: 'get_appeal_verdict', args: [caseId] });
  return raw ? JSON.parse(raw as string) : null;
}

export async function getBorrowerCases(address: string): Promise<CreditCase[]> {
  if (USE_MOCKS) return mockCases.filter((c) => c.borrower.toLowerCase() === address.toLowerCase());
  const client = await getClient();
  const raw = await client!.readContract({ address: CONTRACT_ADDRESS, functionName: 'get_borrower_cases', args: [address] });
  return JSON.parse(raw as string) as CreditCase[];
}

export async function getBorrowerReputation(address: string): Promise<BorrowerReputation | null> {
  if (USE_MOCKS) {
    return Object.values(mockReputation).find((r) => r.borrower.toLowerCase() === address.toLowerCase()) ?? null;
  }
  const client = await getClient();
  const raw = await client!.readContract({ address: CONTRACT_ADDRESS, functionName: 'get_borrower_reputation', args: [address] });
  return raw ? JSON.parse(raw as string) : null;
}

export async function getReviewedCases(): Promise<ReviewedCaseRecord[]> {
  if (USE_MOCKS) return MOCK_REVIEWED_CASES;
  const client = await getClient();
  const raw = await client!.readContract({ address: CONTRACT_ADDRESS, functionName: 'get_reviewed_cases', args: [] });
  return JSON.parse(raw as string) as ReviewedCaseRecord[];
}

export async function getProtocolStats(): Promise<ProtocolStats> {
  if (USE_MOCKS) return mockProtocolStats;
  const client = await getClient();
  const raw = await client!.readContract({ address: CONTRACT_ADDRESS, functionName: 'get_protocol_stats', args: [] });
  return JSON.parse(raw as string) as ProtocolStats;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the connected address from the injected wallet, or null if none. */
export async function getConnectedAddress(): Promise<`0x${string}` | null> {
  if (typeof window === 'undefined') return null;
  const ethereum = (window as Window & { ethereum?: { request: (args: { method: string }) => Promise<string[]> } }).ethereum;
  if (!ethereum) return null;
  try {
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    return (accounts?.[0] as `0x${string}` | undefined) ?? null;
  } catch {
    return null;
  }
}
