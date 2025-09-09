'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

type Sacado = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  situacao: string | null;
  porte: string | null;
  natureza_juridica: string | null;
  data_abertura: string | null;
  capital_social: number | null;
  atividade_principal_descricao: string | null;
  endereco_receita: string | null;
  telefone_receita: string | null;
  email_receita: string | null;
};

export default function CobrancaReportPage() {
  const router = useRouter();
  const params = useParams();
  const cnpj = decodeURIComponent(params.cnpj as string);
  
  const [sacado, setSacado] = useState<Sacado | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [cnpj]);

  async function loadData() {
    setLoading(true);
    
    const { data: sacadoData } = await supabase
      .from('sacados')
      .select('*')
      .eq('cnpj', cnpj)
      .single();
    
    setSacado(sacadoData);
    setLoading(false);
  }

  function printReport() {
    window.print();
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="container max-w-6xl">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-slate-600">Carregando...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!sacado) {
    return (
      <main className="min-h-screen p-6">
        <div className="container max-w-6xl">
          <div className="text-center py-8">
            <p className="text-slate-600">Sacado não encontrado</p>
            <Button variant="primary" onClick={() => router.back()} className="mt-4">
              Voltar
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="container max-w-4xl space-y-6">
        <header className="flex items-center justify-between print:hidden">
          <h1 className="text-2xl font-bold text-slate-800">Ficha de Cobrança</h1>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.back()}>
              Voltar
            </Button>
            <Button variant="primary" onClick={printReport}>
              Imprimir
            </Button>
          </div>
        </header>

        <Card className="print:shadow-none print:border-none">
          <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="text-center border-b pb-4">
              <h1 className="text-2xl font-bold text-slate-800">FICHA DE COBRANÇA</h1>
              <p className="text-sm text-slate-600">Relatório gerado em {new Date().toLocaleDateString('pt-BR')}</p>
            </div>

            {/* DEVEDOR */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 border-b">DEVEDOR</h2>
              
              <div className="grid gap-3">
                <div>
                  <span className="font-semibold">DEVEDOR:</span> {sacado.razao_social}
                </div>
                <div>
                  <span className="font-semibold">CNPJ:</span> {sacado.cnpj}
                </div>
                {sacado.nome_fantasia && (
                  <div>
                    <span className="font-semibold">NOME FANTASIA:</span> {sacado.nome_fantasia}
                  </div>
                )}
                <div>
                  <span className="font-semibold">ABERTURA:</span> {sacado.data_abertura || '—'}
                </div>
                <div>
                  <span className="font-semibold">ENDEREÇO RECEITA:</span> {sacado.endereco_receita || '—'}
                </div>
                <div>
                  <span className="font-semibold">TELEFONE RECEITA:</span> {sacado.telefone_receita || '—'}
                </div>
                <div>
                  <span className="font-semibold">E-MAIL RECEITA:</span> {sacado.email_receita || '—'}
                </div>
                <div>
                  <span className="font-semibold">SITUAÇÃO:</span> {sacado.situacao || '—'}
                </div>
                <div>
                  <span className="font-semibold">PORTE:</span> {sacado.porte || '—'}
                </div>
                <div>
                  <span className="font-semibold">NATUREZA JURÍDICA:</span> {sacado.natureza_juridica || '—'}
                </div>
                <div>
                  <span className="font-semibold">CAPITAL SOCIAL:</span> {
                    sacado.capital_social ? sacado.capital_social.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'
                  }
                </div>
                <div>
                  <span className="font-semibold">ATIVIDADE PRINCIPAL:</span> {sacado.atividade_principal_descricao || '—'}
                </div>
              </div>
            </div>

            {/* QSA */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 border-b">QSA (Quadro de Sócios e Administradores)</h2>
              <div className="text-center py-4 text-slate-600">
                <p>Dados de QSA serão implementados em breve</p>
                <p className="text-sm">Integração com API BIGDATA em desenvolvimento</p>
              </div>
            </div>

            {/* ENDEREÇOS ENCONTRADOS */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 border-b">ENDEREÇOS ENCONTRADOS</h2>
              <div className="text-center py-4 text-slate-600">
                <p>Múltiplos endereços serão implementados em breve</p>
                <p className="text-sm">Integração com API BIGDATA em desenvolvimento</p>
              </div>
            </div>

            {/* TELEFONES ENCONTRADOS */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 border-b">TELEFONES ENCONTRADOS</h2>
              <div className="text-center py-4 text-slate-600">
                <p>Múltiplos telefones serão implementados em breve</p>
                <p className="text-sm">Integração com API BIGDATA em desenvolvimento</p>
              </div>
            </div>

            {/* E-MAILS ENCONTRADOS */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 border-b">E-MAILS ENCONTRADOS</h2>
              <div className="text-center py-4 text-slate-600">
                <p>Múltiplos e-mails serão implementados em breve</p>
                <p className="text-sm">Integração com API BIGDATA em desenvolvimento</p>
              </div>
            </div>

            {/* PESSOAS LIGADAS */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 border-b">PESSOAS LIGADAS</h2>
              <div className="text-center py-4 text-slate-600">
                <p>Pessoas ligadas serão implementadas em breve</p>
                <p className="text-sm">Integração com API BIGDATA em desenvolvimento</p>
              </div>
            </div>

            {/* EMPRESAS LIGADAS */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 border-b">EMPRESAS LIGADAS</h2>
              <div className="text-center py-4 text-slate-600">
                <p>Empresas ligadas serão implementadas em breve</p>
                <p className="text-sm">Integração com API BIGDATA em desenvolvimento</p>
              </div>
            </div>

            {/* PROCESSOS */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 border-b">PROCESSOS</h2>
              <div className="text-center py-4 text-slate-600">
                <p>DIVERSOS</p>
                <p className="text-sm">Histórico de processos será implementado em breve</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
