import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'gold' | 'cyan' | 'ember' | 'none';
}

const glowClasses = {
  gold: 'verdict-gold-glow',
  cyan: 'signal-cyan-glow',
  ember: 'risk-ember-glow',
  none: '',
};

export default function Card({ children, className = '', glow = 'none' }: CardProps) {
  return (
    <div
      className={`glass-panel rounded-[8px] p-6 ${glowClasses[glow]} ${className}`}
    >
      {children}
    </div>
  );
}
