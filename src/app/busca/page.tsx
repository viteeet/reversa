'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatCpfCnpj } from '@/lib/format';

type SearchResult = {
  tipo: 'sacado' | 'cedente' | 'atividade';
  id: string;
  titulo: string;
  subtitulo: string;
  link: string;
  badge?: string;
};

export default function BuscaPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'todos' | 'sacados' | 'cedentes' | 'atividades'>('todos');

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const searchLower = searchQuery.toLowerCase().trim();

    try {
      const promises: Promise<any>[] = [];

      // Buscar sacados
      promises.push(
        Promise.resolve(
          supabase
            .from('sacados')
            .select('cnpj, razao_social, nome_fantasia, situacao')
            .or(`razao_social.ilike.%${searchQuery}%,nome_fantasia.ilike.%${searchQuery}%,cnpj.ilike.%${searchQuery}%`)
            .limit(20)
        ).then(result => ({ data: result.data, error: result.error }))
        .catch(() => ({ data: null, error: null }))
      );

      // Buscar cedentes
      promises.push(
        Promise.resolve(
          supabase
            .from('cedentes')
            .select('id, nome, razao_social, cnpj, situacao')
            .or(`nome.ilike.%${searchQuery}%,razao_social.ilike.%${searchQuery}%,cnpj.ilike.%${searchQuery}%`)
            .limit(20)
        ).then(result => ({ data: result.data, error: result.error }))
        .catch(() => ({ data: null, error: null }))
      );

      // Buscar atividades de sacados (sem join para evitar erros)
      promises.push(
        Promise.resolve(
          supabase
            .from('sacados_atividades')
            .select('id, descricao, tipo, status, sacado_cnpj')
            .ilike('descricao', `%${searchQuery}%`)
            .limit(20)
        ).then(result => ({ data: result.data, error: result.error }))
        .catch(() => ({ data: null, error: null }))
      );

      // Buscar atividades de cedentes (sem join para evitar erros)
      promises.push(
        Promise.resolve(
          supabase
            .from('cedentes_atividades')
            .select('id, descricao, tipo, status, cedente_id')
            .ilike('descricao', `%${searchQuery}%`)
            .limit(20)
        ).then(result => ({ data: result.data, error: result.error }))
        .catch(() => ({ data: null, error: null }))
      );

      const [sacadosResult, cedentesResult, atividadesSacadosResult, atividadesCedentesResult] = await Promise.all(promises);

      const resultsList: SearchResult[] = [];

      // Processar sacados
      if (sacadosResult.data) {
        sacadosResult.data.forEach((sacado: any) => {
          resultsList.push({
            tipo: 'sacado',
            id: sacado.cnpj,
            titulo: sacado.razao_social,
            subtitulo: `CNPJ: ${formatCpfCnpj(sacado.cnpj)}${sacado.nome_fantasia ? ` | ${sacado.nome_fantasia}` : ''}`,
            link: `/sacados/${encodeURIComponent(sacado.cnpj)}`,
            badge: sacado.situacao
          });
        });
      }

      // Processar cedentes
      if (cedentesResult.data) {
        cedentesResult.data.forEach((cedente: any) => {
          resultsList.push({
            tipo: 'cedente',
            id: cedente.id,
            titulo: cedente.nome,
            subtitulo: cedente.razao_social || cedente.cnpj ? `${cedente.razao_social || ''} ${cedente.cnpj ? `| CNPJ: ${formatCpfCnpj(cedente.cnpj)}` : ''}`.trim() : 'Sem informações adicionais',
            link: `/cedentes/${cedente.id}`,
            badge: cedente.situacao
          });
        });
      }

      // Processar atividades de sacados
      if (atividadesSacadosResult.data) {
        atividadesSacadosResult.data.forEach((atividade: any) => {
          resultsList.push({
            tipo: 'atividade',
            id: atividade.id,
            titulo: atividade.descricao,
            subtitulo: `Sacado: ${atividade.sacado_cnpj}`,
            link: `/sacados/${encodeURIComponent(atividade.sacado_cnpj)}`,
            badge: atividade.status
          });
        });
      }

      // Processar atividades de cedentes
      if (atividadesCedentesResult.data) {
        atividadesCedentesResult.data.forEach((atividade: any) => {
          resultsList.push({
            tipo: 'atividade',
            id: atividade.id,
            titulo: atividade.descricao,
            subtitulo: `Cedente: ${atividade.cedente_id}`,
            link: `/cedentes/${atividade.cedente_id}`,
            badge: atividade.status
          });
        });
      }

      setResults(resultsList);
    } catch (error) {
      console.error('Erro na busca:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  const filteredResults = useMemo(() => {
    if (activeTab === 'todos') return results;
    return results.filter(r => {
      if (activeTab === 'sacados') return r.tipo === 'sacado';
      if (activeTab === 'cedentes') return r.tipo === 'cedente';
      if (activeTab === 'atividades') return r.tipo === 'atividade';
      return true;
    });
  }, [results, activeTab]);

  const counts = useMemo(() => {
    return {
      todos: results.length,
      sacados: results.filter(r => r.tipo === 'sacado').length,
      cedentes: results.filter(r => r.tipo === 'cedente').length,
      atividades: results.filter(r => r.tipo === 'atividade').length
    };
  }, [results]);

  function getTipoIcon(tipo: SearchResult['tipo']) {
    switch (tipo) {
      case 'sacado':
        return '🏢';
      case 'cedente':
        return '👤';
      case 'atividade':
        return '📋';
      default:
        return '📄';
    }
  }

  function getTipoLabel(tipo: SearchResult['tipo']) {
    switch (tipo) {
      case 'sacado':
        return 'Sacado';
      case 'cedente':
        return 'Cedente';
      case 'atividade':
        return 'Atividade';
      default:
        return '';
    }
  }

  return (
    <main className="min-h-screen p-6">
      <div className="container max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Busca Global</h1>
          <p className="text-slate-600">Busque por sacados, cedentes e atividades</p>
        </div>

        <Card className="mb-6">
          <div className="space-y-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Digite CNPJ, nome, telefone, email..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="text-lg"
              />
              {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            {query.length > 0 && (
              <div className="flex gap-2 border-b border-gray-200">
                {(['todos', 'sacados', 'cedentes', 'atividades'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === tab
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab === 'todos' ? 'Todos' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {counts[tab] > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        activeTab === tab ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {counts[tab]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        {query.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-600">Digite ao menos 2 caracteres para buscar</p>
            </div>
          </Card>
        ) : filteredResults.length === 0 && !loading ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">😕</div>
              <p className="text-gray-600">Nenhum resultado encontrado</p>
              <p className="text-sm text-gray-500 mt-2">Tente buscar com outros termos</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredResults.map((result) => (
              <div
                key={`${result.tipo}-${result.id}`}
                onClick={() => router.push(result.link)}
                className="cursor-pointer"
              >
                <Card className="hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{getTipoIcon(result.tipo)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{result.titulo}</h3>
                        <Badge variant="neutral" size="sm">{getTipoLabel(result.tipo)}</Badge>
                        {result.badge && (
                          <Badge
                            variant={result.badge === 'ATIVA' || result.badge === 'concluida' ? 'success' : 'warning'}
                            size="sm"
                          >
                            {result.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{result.subtitulo}</p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

