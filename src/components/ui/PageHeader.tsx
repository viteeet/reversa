'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = 'Voltar',
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <header className={className}>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 bg-white border border-gray-300 hover:bg-gray-50 text-[#0369a1] text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {backLabel}
        </Link>
      )}

      <div className="border-b-2 border-[#0369a1] pb-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0369a1] mb-1">{title}</h1>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
