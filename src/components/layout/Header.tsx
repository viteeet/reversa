"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import NotificationBell from "@/components/notifications/NotificationBell";
import { formatCpfCnpj } from "@/lib/format";

type SearchResult = {
  tipo: 'sacado' | 'cedente' | 'atividade' | 'pagina';
  id: string;
  titulo: string;
  subtitulo: string;
  link: string;
  badge?: string;
};

export default function Header() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);
  
  // Busca global
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const user = data.user;
      setEmail(user?.email ?? null);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  // Função de busca global
  async function performGlobalSearch(query: string) {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    setIsSearching(true);
    setIsSearchOpen(true);

    try {
      const promises: Promise<any>[] = [];
      const resultsList: SearchResult[] = [];

      // Buscar sacados
      promises.push(
        Promise.resolve(
          supabase
            .from('sacados')
            .select('cnpj, razao_social, nome_fantasia, situacao')
            .or(`razao_social.ilike.%${query}%,nome_fantasia.ilike.%${query}%,cnpj.ilike.%${query}%`)
            .limit(10)
        ).then(({ data, error }) => {
          if (data) {
            data.forEach((sacado: any) => {
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
          return { data, error };
        }).catch(() => ({ data: null, error: null }))
      );

      // Buscar cedentes
      promises.push(
        Promise.resolve(
          supabase
            .from('cedentes')
            .select('id, nome, razao_social, cnpj, situacao')
            .or(`nome.ilike.%${query}%,razao_social.ilike.%${query}%,cnpj.ilike.%${query}%`)
            .limit(10)
        ).then(({ data, error }) => {
          if (data) {
            data.forEach((cedente: any) => {
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
          return { data, error };
        }).catch(() => ({ data: null, error: null }))
      );

      // Buscar atividades de sacados
      promises.push(
        Promise.resolve(
          supabase
            .from('sacados_atividades')
            .select('id, descricao, tipo, status, sacado_cnpj')
            .ilike('descricao', `%${query}%`)
            .limit(5)
        ).then(({ data, error }) => {
          if (data) {
            data.forEach((atividade: any) => {
              resultsList.push({
                tipo: 'atividade',
                id: atividade.id,
                titulo: atividade.descricao,
                subtitulo: `Sacado: ${formatCpfCnpj(atividade.sacado_cnpj)}`,
                link: `/sacados/${encodeURIComponent(atividade.sacado_cnpj)}`,
                badge: atividade.status
              });
            });
          }
          return { data, error };
        }).catch(() => ({ data: null, error: null }))
      );

      // Buscar atividades de cedentes
      promises.push(
        Promise.resolve(
          supabase
            .from('cedentes_atividades')
            .select('id, descricao, tipo, status, cedente_id')
            .ilike('descricao', `%${query}%`)
            .limit(5)
        ).then(({ data, error }) => {
          if (data) {
            data.forEach((atividade: any) => {
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
          return { data, error };
        }).catch(() => ({ data: null, error: null }))
      );

      await Promise.all(promises);

      // Adicionar páginas que correspondem à busca
      const pages = [
        { nome: 'Dashboard', link: '/dashboard', termos: ['dashboard', 'início', 'inicio', 'home'] },
        { nome: 'Sacados', link: '/sacados', termos: ['sacados', 'sacado', 'devedores', 'devedor'] },
        { nome: 'Cedentes', link: '/cedentes', termos: ['cedentes', 'cedente', 'credores', 'credor'] },
        { nome: 'Atividades Agendadas', link: '/atividades-agendadas', termos: ['atividades', 'atividade', 'agendadas', 'agendada'] },
        { nome: 'A Receber', link: '/financeiro/a-receber', termos: ['receber', 'a receber', 'receitas'] },
        { nome: 'A Pagar', link: '/contas-pagar', termos: ['pagar', 'a pagar', 'despesas', 'contas'] },
        { nome: 'Fluxo de Caixa', link: '/financeiro/fluxo-caixa', termos: ['fluxo', 'caixa', 'financeiro'] },
        { nome: 'Configurações', link: '/menu/configuracoes', termos: ['configurações', 'configuracoes', 'settings', 'config'] },
      ];

      const queryLower = query.toLowerCase();
      pages.forEach(page => {
        if (page.termos.some(termo => queryLower.includes(termo))) {
          resultsList.push({
            tipo: 'pagina',
            id: page.link,
            titulo: page.nome,
            subtitulo: 'Página do sistema',
            link: page.link,
          });
        }
      });

      setSearchResults(resultsList);
    } catch (error) {
      console.error('Erro na busca:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  // Debounce da busca
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performGlobalSearch(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Fechar busca ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (searchInputRef.current && !searchInputRef.current.contains(target) && 
          !target.closest('.search-results-dropdown')) {
        setIsSearchOpen(false);
      }
    }

    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isSearchOpen]);

  function getTipoIcon(tipo: SearchResult['tipo']) {
    switch (tipo) {
      case 'sacado':
        return '🏢';
      case 'cedente':
        return '👤';
      case 'atividade':
        return '📋';
      case 'pagina':
        return '📄';
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
      case 'pagina':
        return 'Página';
      default:
        return '';
    }
  }

  function handleSearchResultClick(link: string) {
    setIsSearchOpen(false);
    setSearchQuery('');
    router.push(link);
  }

  return (
    <header className="reversa-header sticky top-0 z-40" style={{display: 'block', visibility: 'visible'}}>
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/dashboard" className="reversa-logo shrink-0" style={{display: 'block', visibility: 'visible'}}>
          REVERSA
        </Link>

        {/* Busca Global */}
        {(!loading && email) && (
          <div className="flex-1 max-w-xl relative" ref={searchInputRef}>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                onFocus={() => {
                  if (searchResults.length > 0) setIsSearchOpen(true);
                }}
                placeholder="Buscar por sacados, cedentes, atividades ou páginas..."
                className="w-full px-4 py-2 pl-10 pr-10 text-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                </div>
              )}
              {searchQuery && !isSearching && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Dropdown de Resultados */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="search-results-dropdown absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                <div className="p-2">
                  {searchResults.map((result, index) => (
                    <button
                      key={`${result.tipo}-${result.id}-${index}`}
                      onClick={() => handleSearchResultClick(result.link)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-start gap-3"
                    >
                      <div className="text-xl shrink-0">{getTipoIcon(result.tipo)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-gray-900 truncate">{result.titulo}</span>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded shrink-0">
                            {getTipoLabel(result.tipo)}
                          </span>
                          {result.badge && (
                            <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${
                              result.badge === 'ATIVA' || result.badge === 'concluida' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {result.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 truncate">{result.subtitulo}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Menu Hambúrguer */}
        {(!loading && email) ? (
          <div className="flex items-center gap-2 shrink-0">
            {/* Notificações */}
            <NotificationBell />
            
            {/* Botão Menu de Apps (Quebra-cabeça) */}
            <div className="relative">
              <button
                onClick={() => setIsAppsMenuOpen(!isAppsMenuOpen)}
                className="p-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors"
                title="Apps"
              >
                <svg 
                  className="w-6 h-6 text-white" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"/>
                </svg>
              </button>
              
              {/* Menu Dropdown de Apps */}
              {isAppsMenuOpen && (
                <div 
                  className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                  style={{ animation: 'slideDown 0.2s ease-out' }}
                >
                  <div className="p-1">
                    <div className="px-3 py-1.5 border-b border-gray-200">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Apps</div>
                    </div>
                    
                    <a 
                      href="https://www.redecnpj.com.br/demo/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={() => setIsAppsMenuOpen(false)}
                      className="block px-3 py-2 rounded hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="text-sm font-medium text-gray-900">RedeCNPJ</div>
                      <div className="text-xs text-gray-500">Mapa de relacionamentos</div>
                    </a>
                  </div>
                </div>
              )}
            </div>
            
            {/* Botão Menu Hambúrguer */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors"
            >
                     <div className="w-6 h-6 flex flex-col justify-center items-center gap-1">
                       <div
                         className={`w-5 h-0.5 bg-white transition-all duration-300 ${
                           isMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                         }`}
                       />
                       <div
                         className={`w-5 h-0.5 bg-white transition-all duration-300 ${
                           isMenuOpen ? 'opacity-0' : ''
                         }`}
                       />
                       <div
                         className={`w-5 h-0.5 bg-white transition-all duration-300 ${
                           isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
                         }`}
                       />
                     </div>
                   </button>
                 </div>
               ) : (
                 <div />
               )}

        {/* Menu Dropdown */}
        {isMenuOpen && (
          <div 
            className="absolute top-16 right-4 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[calc(100vh-5rem)] overflow-y-auto"
            style={{ animation: 'slideDown 0.2s ease-out' }}
          >
            <div className="p-1">
              <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                <div className="px-3 py-2 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="text-sm font-medium text-gray-900">Dashboard</div>
                </div>
              </Link>
              
              {/* Seção Operacional */}
              <div className="px-3 py-1.5 border-t border-gray-100 mt-1">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Operacional</div>
                <Link href="/menu/operacional" onClick={() => setIsMenuOpen(false)}>
                  <div className="px-2 py-1.5 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="text-sm text-gray-700">Menu Operacional</div>
                  </div>
                </Link>
                <Link href="/cedentes" onClick={() => setIsMenuOpen(false)}>
                  <div className="px-2 py-1.5 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="text-sm text-gray-700">Cedentes</div>
                  </div>
                </Link>
                <Link href="/sacados" onClick={() => setIsMenuOpen(false)}>
                  <div className="px-2 py-1.5 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="text-sm text-gray-700">Sacados</div>
                  </div>
                </Link>
                <Link href="/pessoas-fisicas" onClick={() => setIsMenuOpen(false)}>
                  <div className="px-2 py-1.5 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="text-sm text-gray-700">Pessoas Físicas</div>
                  </div>
                </Link>
                <Link href="/empresas-grupo" onClick={() => setIsMenuOpen(false)}>
                  <div className="px-2 py-1.5 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="text-sm text-gray-700">Grupos de Empresas</div>
                  </div>
                </Link>
                <Link href="/atividades-agendadas" onClick={() => setIsMenuOpen(false)}>
                  <div className="px-2 py-1.5 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="text-sm text-gray-700">Atividades Agendadas</div>
                  </div>
                </Link>
                <Link href="/relatorios/vencidos" onClick={() => setIsMenuOpen(false)}>
                  <div className="px-2 py-1.5 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="text-sm text-gray-700">Relatório de Vencidos</div>
                  </div>
                </Link>
              </div>
              
              {/* Seção Financeiro */}
              <div className="px-3 py-1.5 border-t border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Financeiro</div>
                <Link href="/menu/financeiro" onClick={() => setIsMenuOpen(false)}>
                  <div className="px-2 py-1.5 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="text-sm text-gray-700">Menu Financeiro</div>
                  </div>
                </Link>
                <Link href="/financeiro/a-receber" onClick={() => setIsMenuOpen(false)}>
                  <div className="px-2 py-1.5 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="text-sm text-gray-700">A Receber</div>
                  </div>
                </Link>
                <Link href="/contas-pagar" onClick={() => setIsMenuOpen(false)}>
                  <div className="px-2 py-1.5 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="text-sm text-gray-700">A Pagar</div>
                  </div>
                </Link>
                <Link href="/financeiro/fluxo-caixa" onClick={() => setIsMenuOpen(false)}>
                  <div className="px-2 py-1.5 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="text-sm text-gray-700">Fluxo de Caixa</div>
                  </div>
                </Link>
              </div>
              
              <div className="border-t border-gray-100 mt-1">
                <Link href="/menu/configuracoes" onClick={() => setIsMenuOpen(false)}>
                  <div className="px-3 py-2 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="text-sm font-medium text-gray-900">Configurações</div>
                  </div>
                </Link>
              </div>

              <div className="border-t border-gray-200 mt-1 pt-2">
                <div className="px-3 py-1">
                  <div className="text-xs text-gray-500 font-medium mb-1">Logado como:</div>
                  <div className="text-xs text-gray-700 truncate">{email}</div>
                </div>
                
                {/* Botão Sair */}
                <div className="px-3 pb-2 pt-1">
                  <button
                    onClick={signOut}
                    className="w-full px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shadow-sm border"
                    style={{
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      borderColor: '#dc2626',
                      fontWeight: '600'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#dc2626';
                      e.currentTarget.style.borderColor = '#b91c1c';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ef4444';
                      e.currentTarget.style.borderColor = '#dc2626';
                    }}
                  >
                    Sair
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overlay para fechar os menus */}
        {(isMenuOpen || isAppsMenuOpen) && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => {
              setIsMenuOpen(false);
              setIsAppsMenuOpen(false);
            }}
          />
        )}
      </div>
    </header>
  );
}


