// Fiducia — Core Types

export type CaseStatus =
  | 'CREATED'
  | 'COMMITTED'
  | 'READY_FOR_REVIEW'
  | 'UNDER_REVIEW'
  | 'REVIEWED'
  | 'APPEAL_COMMITTED'
  | 'APPEAL_REVEALED'
  | 'READY_FOR_APPEAL_REVIEW'
  | 'APPEAL_UNDER_REVIEW'
  | 'APPEAL_REVIEWED'
  | 'CANCELLED'
  | 'FLAGGED';

export type RiskLevel = 'low' | 'medium' | 'high';
export type Decision = 'approve' | 'conditional_approve' | 'reject';
export type AppealOutcome = 'uphold' | 'improve' | 'worsen' | 'insufficient_new_evidence';

export interface CreditCase {
  case_id: string;
  borrower: string;
  business_name: string;
  business_type: string;
  loan_amount_requested: number;
  loan_duration_months_requested: number;
  loan_purpose: string;
  business_age_months: number;
  evidence_commitment: string;
  evidence_schema_version: string;
  status: CaseStatus;
  created_at: number;
  updated_at: number;
}

// Flexible sanitised evidence — matches contract's allowed_keys
export type SanitisedEvidence = Record<string, string | string[] | number | number[]>;

export interface RecommendedTerms {
  max_loan_amount: number;
  interest_rate: number;
  loan_duration_months: number;
  conditions: string[];
}

export interface CaseVerdict {
  case_id: string;
  credit_score: number;
  risk_level: RiskLevel;
  decision: Decision;
  confidence: number;
  repayment_probability: number;
  recommended_terms: RecommendedTerms;
  reasoning: string[];
  risk_flags: string[];
  positive_signals: string[];
  reviewed_by_trigger: string;
}

export interface Appeal {
  case_id: string;
  borrower: string;
  appeal_commitment: string;
  status: CaseStatus;
}

export interface AppealVerdict {
  case_id: string;
  appeal_outcome: AppealOutcome;
  revised_credit_score: number;
  revised_risk_level: RiskLevel;
  revised_decision: Decision;
  confidence: number;
  reasoning: string[];
  changed_terms: RecommendedTerms;
}

export interface BorrowerReputation {
  borrower: string;
  total_reviewed_cases: number;
  approved_count: number;
  conditional_count: number;
  rejected_count: number;
  average_credit_score: number;
  average_repayment_probability: number;
  last_risk_level: RiskLevel | '';
  last_decision: Decision | '';
  last_reviewed_case_id: string;
}

export interface ReviewedCaseRecord {
  case: CreditCase;
  verdict: CaseVerdict;
  appeal_verdict: AppealVerdict | null;
}

export interface ProtocolStats {
  total_cases: number;
  total_reviews: number;
  total_appeals: number;
  review_fee: number;
  paused: boolean;
  admin: string;
}

export interface LenderFilters {
  scoreMin?: number;
  scoreMax?: number;
  riskLevel?: RiskLevel | '';
  decision?: Decision | '';
  amountMin?: number;
  amountMax?: number;
  repaymentMin?: number;
  search?: string;
}
