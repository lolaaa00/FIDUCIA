'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gold' | 'ghost' | 'danger' | 'moss' | 'cyan';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-[#6A4DD4] text-[#E2ECF5] hover:bg-[#5a3fb5] font-semibold shadow-[0_4px_20px_rgba(106,77,212,0.3)] hover:shadow-[0_8px_32px_rgba(106,77,212,0.5)]',
  gold:    'bg-[#6A4DD4] text-[#E2ECF5] hover:bg-[#5a3fb5] font-semibold shadow-[0_4px_20px_rgba(106,77,212,0.3)]',
  ghost:   'border border-[rgba(164,167,227,0.2)] text-[#E2ECF5] hover:border-[#6A4DD4] hover:bg-[rgba(106,77,212,0.08)]',
  danger:  'bg-[#E05D3F] text-white hover:bg-[#c74e33] font-semibold',
  moss:    'bg-[#7C9B63] text-[#000229] hover:bg-[#6a8655] font-semibold',
  cyan:    'border border-[#6E3377] text-[#A4A7E3] hover:bg-[rgba(110,51,119,0.12)] hover:text-[#E2ECF5]',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-full',
  md: 'px-5 py-2.5 text-sm rounded-full',
  lg: 'px-7 py-3.5 text-base rounded-full',
};

export default function Button({
  variant = 'ghost',
  size = 'md',
  loading,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-interface ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
