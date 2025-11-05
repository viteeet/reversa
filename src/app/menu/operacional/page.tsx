'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Stats = {
  totalCedentes: number;
  totalSacados: number;
  cedentesAtivos: number;
  cedentesInativos: number;
  sacadosPorCedente: number;
};

export default function MenuOperacionalPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalCedentes: 0,
    totalSacados: 0,
    cedentesAtivos: 0,
    cedentesInativos: 0,
    sacadosPorCedente: 0,
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) { router.replace('/login'); return; }
      loadStats();
    });
  }, [router]);

  async function loadStats() {
    try {
      setLoading(true);

      // Buscar estatísticas dos cedentes
      const { count: totalCedentes } = await supabase
        .from('cedentes')
        .select('*', { count: 'exact', head: true });

      const { count: cedentesAtivos } = await supabase
        .from('cedentes')
        .select('*', { count: 'exact', head: true })
        .eq('situacao', 'ATIVA');

      const { count: cedentesInativos } = await supabase
        .from('cedentes')
        .select('*', { count: 'exact', head: true })
        .neq('situacao', 'ATIVA');

      // Buscar estatísticas dos sacados
      const { count: totalSacados } = await supabase
        .from('sacados')
        .select('*', { count: 'exact', head: true });

      const sacadosPorCedente = totalCedentes && totalCedentes > 0 
        ? Math.round((totalSacados || 0) / totalCedentes * 10) / 10 
        : 0;

      setStats({
        totalCedentes: totalCedentes || 0,
        totalSacados: totalSacados || 0,
        cedentesAtivos: cedentesAtivos || 0,
        cedentesInativos: cedentesInativos || 0,
        sacadosPorCedente,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header com botão de voltar */}
        <header className="mb-8">
          <button 
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-lg bg-white border border-gray-200 hover:border-[#0369a1] hover:bg-blue-50 transition-all shadow-sm hover:shadow-md text-[#0369a1] font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
          <div>
            <h1 className="text-5xl font-bold text-[#0369a1] mb-2">Menu Operacional</h1>
            <p className="text-[#64748b] text-xl">Gestão de Cedentes e seus Sacados</p>
          </div>
        </header>

        {/* Estatísticas Operacionais */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Cedentes */}
          <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-5 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-xl">🏢</span>
              </div>
              {loading && <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>}
            </div>
            <p className="text-sm font-medium text-[#64748b] mb-1">Total Cedentes</p>
            <p className="text-2xl font-bold text-[#0369a1]">{stats.totalCedentes}</p>
          </div>

          {/* Cedentes Ativos */}
          <div className="bg-white rounded-xl shadow-lg border border-green-100 p-5 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-xl">✓</span>
              </div>
              {loading && <div className="animate-spin w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full"></div>}
            </div>
            <p className="text-sm font-medium text-[#64748b] mb-1">Cedentes Ativos</p>
            <p className="text-2xl font-bold text-green-600">{stats.cedentesAtivos}</p>
          </div>

          {/* Total Sacados */}
          <div className="bg-white rounded-xl shadow-lg border border-indigo-100 p-5 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-xl">👥</span>
              </div>
              {loading && <div className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>}
            </div>
            <p className="text-sm font-medium text-[#64748b] mb-1">Total Sacados</p>
            <p className="text-2xl font-bold text-[#0369a1]">{stats.totalSacados}</p>
          </div>

          {/* Média Sacados/Cedente */}
          <div className="bg-white rounded-xl shadow-lg border border-purple-100 p-5 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              {loading && <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>}
            </div>
            <p className="text-sm font-medium text-[#64748b] mb-1">Média Sacados</p>
            <p className="text-2xl font-bold text-purple-600">{stats.sacadosPorCedente}</p>
            <p className="text-xs text-[#64748b] mt-1">Por cedente</p>
          </div>
        </div>

        {/* Menu de Opções - Cards Principais */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Card Cedentes */}
          <Link href="/cedentes" className="group">
            <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden">
              {/* Efeito de gradiente no hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative p-8">
                {/* Ícone */}
                <div className="w-16 h-16 bg-gradient-to-br from-[#0369a1] to-[#0284c7] rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">🏢</span>
                </div>
                
                {/* Conteúdo */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#0369a1] mb-2">Cedentes</h2>
                    <p className="text-[#64748b] text-base">Gestão completa de cedentes e seus sacados</p>
                  </div>
                  
                  <p className="text-[#64748b] leading-relaxed text-sm">
                    Cadastro, edição e visualização de cedentes. Consulta de CNPJ, dados complementares e histórico completo.
                  </p>
                  
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="px-3 py-1 bg-blue-50 text-[#0369a1] rounded-lg text-xs font-semibold border border-blue-100">📋 Cadastro</span>
                    <span className="px-3 py-1 bg-blue-50 text-[#0369a1] rounded-lg text-xs font-semibold border border-blue-100">👥 Sacados</span>
                    <span className="px-3 py-1 bg-blue-50 text-[#0369a1] rounded-lg text-xs font-semibold border border-blue-100">🔍 CNPJ</span>
                    <span className="px-3 py-1 bg-blue-50 text-[#0369a1] rounded-lg text-xs font-semibold border border-blue-100">📊 Dados</span>
                  </div>
                  
                  {/* Estatísticas */}
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <p className="text-xs text-[#64748b] mb-1">Total</p>
                      <p className="text-xl font-bold text-[#0369a1]">{stats.totalCedentes}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                      <p className="text-xs text-[#64748b] mb-1">Ativos</p>
                      <p className="text-xl font-bold text-green-600">{stats.cedentesAtivos}</p>
                    </div>
                  </div>
                  
                  {/* Botão de ação */}
                  <div className="flex items-center gap-2 text-[#0369a1] font-semibold pt-4 border-t border-gray-100">
                    <span>Acessar Cedentes</span>
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Card Sacados */}
          <Link href="/sacados" className="group">
            <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">👥</span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#0369a1] mb-2">Sacados</h2>
                    <p className="text-[#64748b] text-base">Visualização e gestão de todos os sacados</p>
                  </div>
                  
                  <p className="text-[#64748b] leading-relaxed text-sm">
                    Acesse a lista completa de sacados, consulte dados via CNPJ, visualize relacionamentos com cedentes e histórico de operações.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-100">📋 Lista Completa</span>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-100">🔗 Relacionamentos</span>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-100">🔍 Consultas</span>
                  </div>
                  
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                    <p className="text-xs text-[#64748b] mb-1">Total de Sacados</p>
                    <p className="text-2xl font-bold text-indigo-600">{stats.totalSacados}</p>
                    <p className="text-xs text-[#64748b] mt-2">Cadastrados no sistema</p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[#0369a1] font-semibold pt-4 border-t border-gray-100">
                    <span>Acessar Sacados</span>
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Links Rápidos */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <h3 className="text-xl font-bold text-[#0369a1] mb-4 flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            Ações Rápidas
          </h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/cedentes" className="group flex items-center gap-3 p-4 rounded-xl hover:bg-blue-50 transition-all border border-transparent hover:border-blue-200">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-xl">➕</span>
              </div>
              <div>
                <p className="font-semibold text-[#0369a1]">Novo Cedente</p>
                <p className="text-xs text-[#64748b]">Cadastrar novo cedente</p>
              </div>
            </Link>

            <Link href="/sacados/new" className="group flex items-center gap-3 p-4 rounded-xl hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-200">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-xl">➕</span>
              </div>
              <div>
                <p className="font-semibold text-[#0369a1]">Novo Sacado</p>
                <p className="text-xs text-[#64748b]">Cadastrar novo sacado</p>
              </div>
            </Link>

            <Link href="/utilitarios/bi-cvm" className="group flex items-center gap-3 p-4 rounded-xl hover:bg-purple-50 transition-all border border-transparent hover:border-purple-200">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-xl">🔍</span>
              </div>
              <div>
                <p className="font-semibold text-[#0369a1]">Consulta BI/CVM</p>
                <p className="text-xs text-[#64748b]">Dados externos</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Informação adicional */}
        <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">💡</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#0369a1]">Sobre o Sistema</h3>
              <p className="text-[#64748b] leading-relaxed">
                <strong className="text-[#0369a1]">Cedentes</strong> são os clientes principais do sistema. Cada cedente pode ter múltiplos <strong className="text-[#0369a1]">Sacados</strong> associados, permitindo uma gestão completa e organizada de relacionamentos comerciais e recuperação de recebíveis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
