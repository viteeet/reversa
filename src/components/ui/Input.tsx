'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helper, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-[#1e293b]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            block w-full px-3 py-2 border rounded-md shadow-sm transition-colors bg-white text-[#1e293b]
            focus:outline-none focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1]
            ${error 
              ? 'border-[#ef4444] placeholder-red-300 bg-[#fee2e2]' 
              : 'border-[#cbd5e1] placeholder-gray-400 hover:border-[#0369a1]'
            }
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-sm text-[#ef4444]">{error}</p>
        )}
        {helper && !error && (
          <p className="text-sm text-[#64748b]">{helper}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
