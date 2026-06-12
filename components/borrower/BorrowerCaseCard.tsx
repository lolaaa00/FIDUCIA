import Link from 'next/link';
import { CreditCase } from '@/types/fiducia';
import { statusLabel, formatAmount } from '@/lib/format';

const statusColors: Record<string, string> = {
  CREATED: '#A4A7E3',
  COMMITTED: '#63E6C2',
  READY_FOR_REVIEW: '#F6C56B',
  UNDER_REVIEW: '#F6C56B',
  REVIEWED: '#7C9B63',
  APPEAL_REVIEWED: '#7C9B63',
  CANCELLED: '#E05D3F',
  FLAGGED: '#E05D3F',
};

export default function BorrowerCaseCard({ c }: { c: CreditCase }) {
  const color = statusColors[c.status] ?? '#A4A7E3';
  return (
    <Link href={`/borrower/cases/${c.case_id}`} className="block">
      <div className="glass-panel rounded-[8px] p-5 hover:border-[rgba(246,197,107,0.3)] transition-all duration-200 group">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-xs text-[#A4A7E3] mb-1">CASE #{c.case_id}</p>
            <h3 className="font-display text-lg text-[#E2ECF5] group-hover:text-[#F6C56B] transition-colors truncate">
              {c.business_name}
            </h3>
            <p className="text-sm text-[#A4A7E3] mt-1">{c.business_type}</p>
          </div>
          <span
            className="shrink-0 px-2.5 py-1 rounded-full text-xs font-mono"
            style={{ color, border: `1px solid ${color}40`, background: `${color}15` }}
          >
            {statusLabel(c.status)}
          </span>
        </div>
        <div className="flex gap-6 mt-4 pt-4 border-t border-[rgba(255,255,255,0.07)]">
          <div>
            <p className="font-mono text-xs text-[#A4A7E3]">REQUESTED</p>
            <p className="font-mono text-sm text-[#E2ECF5] mt-0.5">{formatAmount(c.loan_amount_requested)}</p>
          </div>
          <div>
            <p className="font-mono text-xs text-[#A4A7E3]">DURATION</p>
            <p className="font-mono text-sm text-[#E2ECF5] mt-0.5">{c.loan_duration_months_requested}mo</p>
          </div>
          <div>
            <p className="font-mono text-xs text-[#A4A7E3]">PURPOSE</p>
            <p className="text-sm text-[#E2ECF5] mt-0.5 truncate max-w-[180px]">{c.loan_purpose}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
