import React from 'react';
import { Decision, RiskLevel } from '@/types/fiducia';
import { decisionLabel, riskLabel } from '@/lib/format';

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export function Badge({ children, color = '#A4A7E3', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-medium ${className}`}
      style={{ color, border: `1px solid ${color}33`, background: `${color}15` }}
    >
      {children}
    </span>
  );
}

export function DecisionBadge({ decision }: { decision: Decision }) {
  const colors: Record<Decision, string> = {
    approve: '#7C9B63',
    conditional_approve: '#F6C56B',
    reject: '#E05D3F',
  };
  return <Badge color={colors[decision]}>{decisionLabel(decision)}</Badge>;
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const colors: Record<RiskLevel, string> = {
    low: '#7C9B63',
    medium: '#F6C56B',
    high: '#E05D3F',
  };
  return <Badge color={colors[risk]}>{riskLabel(risk)}</Badge>;
}
