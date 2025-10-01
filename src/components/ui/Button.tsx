'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', loading = false, children, disabled, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-[#0369a1] text-white hover:bg-[#075985] focus:ring-[#0369a1] border border-[#0369a1]',
      secondary: 'bg-[#f1f5f9] text-[#1e293b] hover:bg-[#e2e8f0] focus:ring-[#64748b] border border-[#cbd5e1]',
      success: 'bg-[#10b981] text-white hover:bg-[#059669] focus:ring-[#10b981] border border-[#10b981]',
      warning: 'bg-[#f59e0b] text-white hover:bg-[#d97706] focus:ring-[#f59e0b] border border-[#f59e0b]',
      error: 'bg-[#ef4444] text-white hover:bg-[#dc2626] focus:ring-[#ef4444] border border-[#ef4444]',
      neutral: 'bg-[#64748b] text-white hover:bg-[#475569] focus:ring-[#64748b] border border-[#64748b]',
      outline: 'border-2 border-[#0369a1] text-[#0369a1] hover:bg-[#f0f7ff] hover:border-[#075985] focus:ring-[#0369a1] bg-white',
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };
    
    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;