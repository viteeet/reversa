'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const Card = ({ children, className = '', padding = 'md', hover = false }: CardProps) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div className={`
      bg-[#f0f7ff] rounded-lg border border-[#cbd5e1] shadow-sm
      ${paddingClasses[padding]}
      ${hover ? 'hover:shadow-md hover:border-[#0369a1] transition-all duration-200' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};

export default Card;
