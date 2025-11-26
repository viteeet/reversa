'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type LineChartData = {
  periodo: string;
  receitas: number;
  despesas: number;
  saldo: number;
  saldo_acumulado?: number;
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
          {/* Eixo Y esquerdo - para Receitas e Despesas */}
          <YAxis 
            yAxisId="left"
            stroke="#64748b"
            fontSize={12}
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
            label={{ value: 'Receitas / Despesas', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b' } }}
          />
          {/* Eixo Y direito - para Saldo Acumulado */}
          {data.some(d => d.saldo_acumulado !== undefined) && (
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#3b82f6"
              fontSize={12}
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              label={{ value: 'Saldo Acumulado', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#3b82f6' } }}
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {data.some(d => d.saldo_acumulado !== undefined) ? (
            <>
              {/* Linhas do eixo esquerdo - Receitas e Despesas */}
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="receitas" 
                stroke="#10b981" 
                strokeWidth={2}
                strokeDasharray="3 3"
                name="Receitas do Dia"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#10b981', strokeWidth: 2 }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="despesas" 
                stroke="#ef4444" 
                strokeWidth={2}
                strokeDasharray="3 3"
                name="Despesas do Dia"
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#ef4444', strokeWidth: 2 }}
              />
              {/* Linha do eixo direito - Saldo Acumulado */}
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="saldo_acumulado" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Saldo Acumulado (Caixa)"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </>
          ) : (
            <>
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="receitas" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Receitas"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="despesas" 
                stroke="#ef4444" 
                strokeWidth={3}
                name="Despesas"
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="saldo" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Saldo"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
