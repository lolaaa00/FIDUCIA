'use client';

// The contract computes: "0x" + sha256(evidence_json + salt)
// The frontend must produce identical commitments.

function sortedJson(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortedJson);
  if (obj !== null && typeof obj === 'object') {
    const sorted: Record<string, unknown> = {};
    Object.keys(obj as object)
      .sort()
      .forEach((k) => {
        sorted[k] = sortedJson((obj as Record<string, unknown>)[k]);
      });
    return sorted;
  }
  return obj;
}

export function canonicalJsonDeterministic(data: unknown): string {
  return JSON.stringify(sortedJson(data));
}

export function generateSalt(): string {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return (
    '0x' +
    Array.from(buf)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  );
}

export async function computeCommitmentAsync(evidenceJson: string, salt: string): Promise<string> {
  const raw = evidenceJson + salt;
  const encoded = new TextEncoder().encode(raw);
  const hashBuf = await crypto.subtle.digest('SHA-256', encoded);
  const hex = Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return '0x' + hex;
}

export async function computeEvidenceCommitment(evidence: unknown, salt: string): Promise<string> {
  const canonical = canonicalJsonDeterministic(evidence);
  return computeCommitmentAsync(canonical, salt);
}
