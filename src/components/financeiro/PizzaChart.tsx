'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

type PizzaChartData = {
  name: string;
  value: number;
  color: string;
};

type PizzaChartProps = {
  data: PizzaChartData[];
  title: string;
  height?: number;
};

const COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#ec4899', // pink-500
  '#6b7280', // gray-500
];

export default function PizzaChart({ data, title, height = 300 }: PizzaChartProps) {
  const formatValue = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Valor: {formatValue(data.value)}
          </p>
          <p className="text-sm text-gray-600">
            Percentual: {((data.value / data.payload.total) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[#0369a1]">{title}</h3>
        <p className="text-sm text-[#64748b]">
          Total: {formatValue(total)}
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value: string, entry: any) => (
              <span style={{ color: entry.color }}>
                {value} - {formatValue(entry.value)}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
