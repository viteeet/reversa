'use client';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

const Badge = ({ children, variant = 'neutral', size = 'md', className = '' }: BadgeProps) => {
  const baseClasses = 'inline-flex items-center font-semibold rounded-full border';
  
  const variants = {
    success: 'bg-[#d1fae5] text-[#065f46] border-[#10b981]',
    warning: 'bg-[#fef3c7] text-[#92400e] border-[#f59e0b]',
    error: 'bg-[#fee2e2] text-[#991b1b] border-[#ef4444]',
    info: 'bg-[#dbeafe] text-[#1e40af] border-[#3b82f6]',
    neutral: 'bg-[#f1f5f9] text-[#1e293b] border-[#64748b]',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };
  
  return (
    <span className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
