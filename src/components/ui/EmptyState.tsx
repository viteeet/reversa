'use client';

interface EmptyStateProps {
  title: string;
  description?: string;
  className?: string;
}

export default function EmptyState({ title, description, className = '' }: EmptyStateProps) {
  return (
    <div className={`text-center py-8 ${className}`}>
      <p className="text-base font-medium text-gray-700">{title}</p>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    </div>
  );
}
