'use client';

import { useState } from 'react';
import Button from './Button';
import Card from './Card';

interface FilterBarProps {
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClear: () => void;
  children: React.ReactNode;
}

const FilterBar = ({ filters, onFilterChange, onClear, children }: FilterBarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== null && value !== undefined);

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={onClear}
            >
              Limpar filtros
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Ocultar' : 'Mostrar'} filtros
          </Button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {children}
        </div>
      )}
    </Card>
  );
};

export default FilterBar;
