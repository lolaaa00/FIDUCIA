'use client';

import { LenderFilters, Decision, RiskLevel } from '@/types/fiducia';

interface Props {
  filters: LenderFilters;
  onChange: (f: LenderFilters) => void;
}

export default function ReportFilters({ filters, onChange }: Props) {
  const set = (patch: Partial<LenderFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="glass-panel rounded-[8px] p-5">
      <h3 className="font-mono text-xs text-[#A4A7E3] uppercase tracking-widest mb-4">Filter Reports</h3>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div>
          <label className="text-xs text-[#A4A7E3] block mb-1.5">Search</label>
          <input
            type="text"
            value={filters.search ?? ''}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Business or wallet…"
          />
        </div>

        <div>
          <label className="text-xs text-[#A4A7E3] block mb-1.5">Decision</label>
          <select value={filters.decision ?? ''} onChange={(e) => set({ decision: e.target.value as Decision | '' })}>
            <option value="">All</option>
            <option value="approve">Approved</option>
            <option value="conditional_approve">Conditional</option>
            <option value="reject">Rejected</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-[#A4A7E3] block mb-1.5">Risk Level</label>
          <select value={filters.riskLevel ?? ''} onChange={(e) => set({ riskLevel: e.target.value as RiskLevel | '' })}>
            <option value="">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-[#A4A7E3] block mb-1.5">Min Credit Score</label>
          <input
            type="number"
            value={filters.scoreMin ?? ''}
            onChange={(e) => set({ scoreMin: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="0"
            min={0}
            max={100}
          />
        </div>

        <div>
          <label className="text-xs text-[#A4A7E3] block mb-1.5">Max Credit Score</label>
          <input
            type="number"
            value={filters.scoreMax ?? ''}
            onChange={(e) => set({ scoreMax: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="100"
            min={0}
            max={100}
          />
        </div>

        <div>
          <label className="text-xs text-[#A4A7E3] block mb-1.5">Min Repayment %</label>
          <input
            type="number"
            value={filters.repaymentMin ?? ''}
            onChange={(e) => set({ repaymentMin: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="0"
            min={0}
            max={100}
          />
        </div>
      </div>

      <button
        className="mt-4 text-xs font-mono text-[#A4A7E3] hover:text-[#E05D3F] transition-colors"
        onClick={() => onChange({})}
      >
        Clear filters
      </button>
    </div>
  );
}
