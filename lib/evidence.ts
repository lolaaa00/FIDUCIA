'use client';

export const PRIVATE_DATA_WARNINGS = [
  'BVN / NIN / passport numbers',
  'Full bank statements with counterparty names',
  'Full customer lists',
  'Home address',
  'Private invoices with vendor details',
  'Raw transaction exports with counterparties',
];

// Flexible evidence shape matching contract's allowed_keys
export interface SanitisedEvidenceV1 {
  monthly_revenue?: string;
  monthly_expenses?: string;
  cashflow_summary?: string;
  bank_statement_summary?: string;
  sales_records_summary?: string;
  existing_debts?: string;
  repayment_history?: string;
  business_assets?: string;
  customer_concentration?: string;
  supplier_reliability?: string;
  owner_experience?: string;
  business_location?: string;
  market_context?: string;
  negative_events?: string;
  positive_events?: string;
  notes?: string;
}

export function validateEvidenceShape(evidence: Partial<SanitisedEvidenceV1>): string[] {
  const errors: string[] = [];
  const meaningful = [
    'monthly_revenue',
    'cashflow_summary',
    'bank_statement_summary',
    'sales_records_summary',
    'existing_debts',
    'repayment_history',
  ] as const;

  const hasMeaningful = meaningful.some(
    (k) => evidence[k] && String(evidence[k]).trim().length > 0,
  );

  if (!hasMeaningful) {
    errors.push('At least one financial signal is required (revenue, cashflow, bank summary, etc.)');
  }

  for (const [key, val] of Object.entries(evidence)) {
    if (val && String(val).length > 300) {
      errors.push(`${key} is too long (max 300 chars per field)`);
    }
  }

  return errors;
}

export function stripEmptyFields(evidence: Partial<SanitisedEvidenceV1>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(evidence).filter(([, v]) => v && String(v).trim().length > 0),
  );
}
