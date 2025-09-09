'use client';

interface StatCardProps {
  title: string;
  value: string | number;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard = ({ title, value, variant = 'neutral', icon, trend }: StatCardProps) => {
  const variants = {
    success: 'border-l-4 border-l-green-500 bg-white',
    warning: 'border-l-4 border-l-yellow-500 bg-white',
    error: 'border-l-4 border-l-red-500 bg-white',
    info: 'border-l-4 border-l-blue-500 bg-white',
    neutral: 'border-l-4 border-l-gray-500 bg-white',
  };

  return (
    <div className={`rounded-lg p-4 shadow-sm border border-gray-200 ${variants[variant]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : value}
          </p>
          {trend && (
            <div className={`mt-2 flex items-center text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <span className="mr-1">{trend.isPositive ? '↗' : '↘'}</span>
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        {icon && (
          <div className="text-2xl opacity-60">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;