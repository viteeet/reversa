'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type LineChartData = {
  periodo: string;
  receitas: number;
  despesas: number;
  saldo: number;
};

type LineChartProps = {
  data: LineChartData[];
  title: string;
  height?: number;
};

export default function FinanceLineChart({ data, title, height = 300 }: LineChartProps) {
  const formatValue = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatValue(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[#0369a1]">{title}</h3>
        <p className="text-sm text-[#64748b]">
          Evolução financeira por período
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="periodo" 
            stroke="#64748b"
            fontSize={12}
          />
          <YAxis 
            stroke="#64748b"
            fontSize={12}
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="receitas" 
            stroke="#10b981" 
            strokeWidth={3}
            name="Receitas"
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="despesas" 
            stroke="#ef4444" 
            strokeWidth={3}
            name="Despesas"
            dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="saldo" 
            stroke="#3b82f6" 
            strokeWidth={3}
            name="Saldo"
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
