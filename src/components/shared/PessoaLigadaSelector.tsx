'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj } from '@/lib/format';

type PessoaFisica = {
  id: string;
  cpf: string;
  nome: string;
  nome_mae?: string;
  data_nascimento?: string;
  rg?: string;
};

type PessoaLigadaSelectorProps = {
  value: string; // CPF atual
  onSelect: (pessoa: PessoaFisica | null) => void;
  onCpfChange: (cpf: string) => void;
  onNomeChange?: (nome: string) => void; // Callback para atualizar nome automaticamente
  disabled?: boolean;
};

export default function PessoaLigadaSelector({
  value,
  onSelect,
  onCpfChange,
  onNomeChange,
  disabled = false
}: PessoaLigadaSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PessoaFisica[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPessoa, setSelectedPessoa] = useState<PessoaFisica | null>(null);

  useEffect(() => {
    // Quando o CPF muda, buscar pessoa física
    if (value && value.replace(/\D+/g, '').length === 11) {
      buscarPessoaFisica(value.replace(/\D+/g, ''));
    } else {
      setSelectedPessoa(null);
    }
  }, [value]);

  async function buscarPessoaFisica(cpf: string) {
    if (!cpf || cpf.length !== 11) {
      setSelectedPessoa(null);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pessoas_fisicas')
        .select('id, cpf, nome, nome_mae, data_nascimento, rg')
        .eq('cpf', cpf)
        .eq('ativo', true)
        .single();

      if (data && !error) {
        setSelectedPessoa(data);
        onSelect(data);
        // Preencher nome automaticamente se callback disponível
        if (onNomeChange) {
          onNomeChange(data.nome);
        }
      } else {
        setSelectedPessoa(null);
        onSelect(null);
      }
    } catch (err) {
      console.error('Erro ao buscar pessoa física:', err);
      setSelectedPessoa(null);
      onSelect(null);
    } finally {
      setLoading(false);
    }
  }

  async function buscarSugestoes(query: string) {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      const cpfLimpo = query.replace(/\D+/g, '');
      const nomeQuery = query.replace(/\d/g, '').trim();

      let queryBuilder = supabase
        .from('pessoas_fisicas')
        .select('id, cpf, nome, nome_mae, data_nascimento, rg')
        .eq('ativo', true)
        .limit(10);

      if (cpfLimpo.length >= 3) {
        queryBuilder = queryBuilder.ilike('cpf', `%${cpfLimpo}%`);
      } else if (nomeQuery.length >= 3) {
        queryBuilder = queryBuilder.ilike('nome', `%${nomeQuery}%`);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setLoading(false);
        return;
      }

      const { data, error } = await queryBuilder.order('nome');

      if (data && !error) {
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (err) {
      console.error('Erro ao buscar sugestões:', err);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onCpfChange(newValue);
    
    // Buscar sugestões enquanto digita
    if (newValue.length >= 3) {
      buscarSugestoes(newValue);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  function handleSelectPessoa(pessoa: PessoaFisica) {
    setSelectedPessoa(pessoa);
    setSearchQuery(formatCpfCnpj(pessoa.cpf));
    onCpfChange(pessoa.cpf);
    onSelect(pessoa);
    // Preencher nome automaticamente
    if (onNomeChange) {
      onNomeChange(pessoa.nome);
    }
    setShowSuggestions(false);
    setSuggestions([]);
  }

  function handleBlur() {
    // Delay para permitir clique nas sugestões
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Digite CPF ou nome para buscar..."
          value={searchQuery || formatCpfCnpj(value || '')}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={handleBlur}
          disabled={disabled}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
          </div>
        )}
        {selectedPessoa && !loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="text-xs text-green-600 font-medium">✓ Cadastrada</span>
          </div>
        )}
      </div>

      {/* Sugestões */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((pessoa) => (
            <button
              key={pessoa.id}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
              onClick={() => handleSelectPessoa(pessoa)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{pessoa.nome}</div>
                  <div className="text-xs text-gray-600">CPF: {formatCpfCnpj(pessoa.cpf)}</div>
                </div>
                <span className="text-xs text-blue-600">Selecionar</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Informação da pessoa selecionada */}
      {selectedPessoa && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
          <div className="text-green-800 font-medium">Pessoa física encontrada:</div>
          <div className="text-green-700 mt-1">
            <strong>{selectedPessoa.nome}</strong> - CPF: {formatCpfCnpj(selectedPessoa.cpf)}
            {selectedPessoa.nome_mae && ` | Mãe: ${selectedPessoa.nome_mae}`}
          </div>
        </div>
      )}
    </div>
  );
}

