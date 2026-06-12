import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export default function Textarea({ label, hint, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm text-[#A4A7E3] font-medium">{label}</label>}
      <textarea
        className={`resize-none min-h-[100px] ${error ? 'border-[#E05D3F]' : ''} ${className}`}
        {...props}
      />
      {hint && !error && <p className="text-xs text-[#A4A7E3]">{hint}</p>}
      {error && <p className="text-xs text-[#E05D3F]">{error}</p>}
    </div>
  );
}
