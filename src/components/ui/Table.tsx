'use client';

import { ReactNode } from 'react';
import Card from './Card';

interface TableColumn<T> {
  key: keyof T;
  label: string;
  render?: (value: unknown, item: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  emptyMessage?: string;
  className?: string;
}

const Table = <T,>({ data, columns, emptyMessage = 'Nenhum item encontrado', className = '' }: TableProps<T>) => {
  return (
    <Card padding="none" className={`overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider ${column.className || ''}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-slate-900 ${column.className || ''}`}
                    >
                      {column.render 
                        ? column.render((item as Record<string, unknown>)[column.key as string], item)
                        : String((item as Record<string, unknown>)[column.key as string] || '')
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default Table;
