import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export default function Input({ label, hint, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm text-[#A4A7E3] font-medium">{label}</label>}
      <input
        className={`${error ? 'border-[#E05D3F]' : ''} ${className}`}
        {...props}
      />
      {hint && !error && <p className="text-xs text-[#A4A7E3]">{hint}</p>}
      {error && <p className="text-xs text-[#E05D3F]">{error}</p>}
    </div>
  );
}
