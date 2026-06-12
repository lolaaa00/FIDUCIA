import { Decision, RiskLevel, AppealOutcome, CaseStatus } from '@/types/fiducia';

export function shortAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function formatAmount(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function decisionLabel(d: Decision): string {
  return { approve: 'Approved', conditional_approve: 'Conditional', reject: 'Rejected' }[d] ?? d;
}

export function riskLabel(r: RiskLevel): string {
  return { low: 'Low Risk', medium: 'Medium Risk', high: 'High Risk' }[r] ?? r;
}

export function appealOutcomeLabel(o: AppealOutcome): string {
  return {
    uphold: 'Upheld',
    improve: 'Improved',
    worsen: 'Worsened',
    insufficient_new_evidence: 'Insufficient New Evidence',
  }[o] ?? o;
}

export function statusLabel(s: CaseStatus): string {
  const map: Record<CaseStatus, string> = {
    CREATED: 'Created',
    COMMITTED: 'Evidence Committed',
    READY_FOR_REVIEW: 'Ready for Review',
    UNDER_REVIEW: 'Under Review',
    REVIEWED: 'Reviewed',
    APPEAL_COMMITTED: 'Appeal Committed',
    APPEAL_REVEALED: 'Appeal Revealed',
    READY_FOR_APPEAL_REVIEW: 'Ready for Appeal Review',
    APPEAL_UNDER_REVIEW: 'Appeal Under Review',
    APPEAL_REVIEWED: 'Appeal Reviewed',
    CANCELLED: 'Cancelled',
    FLAGGED: 'Flagged',
  };
  return map[s] ?? s;
}

export function decisionColor(d: Decision): string {
  return { approve: '#7C9B63', conditional_approve: '#F6C56B', reject: '#E05D3F' }[d] ?? '#A4A7E3';
}

export function riskColor(r: RiskLevel): string {
  return { low: '#7C9B63', medium: '#F6C56B', high: '#E05D3F' }[r] ?? '#A4A7E3';
}

export function scoreColor(score: number): string {
  if (score >= 70) return '#7C9B63';
  if (score >= 50) return '#F6C56B';
  return '#E05D3F';
}
