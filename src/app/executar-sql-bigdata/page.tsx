'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/ui/PageHeader';

export default function ExecutarSQLBigDataPage() {
  const [copied, setCopied] = useState(false);
  const [executando, setExecutando] = useState(false);
  const [resultado, setResultado] = useState<{ sucesso: boolean; mensagem: string } | null>(null);

  const sqlScript = `-- ================================================================================
-- CRIAÇÃO: Tabela bigdata_consultas para controle de consultas à API BigData
-- ================================================================================
-- Esta tabela armazena histórico de consultas para prevenir consultas duplicadas
-- em 24 horas (um CNPJ ou CPF não pode ser consultado 2x no mesmo intervalo)
-- ================================================================================

CREATE TABLE IF NOT EXISTS bigdata_consultas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento TEXT NOT NULL,
  tipo TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data_consulta TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índice para busca rápida por documento e tipo
CREATE INDEX IF NOT EXISTS idx_bigdata_consultas_documento_tipo 
ON bigdata_consultas(documento, tipo, data_consulta DESC);

-- Índice para busca por usuário
CREATE INDEX IF NOT EXISTS idx_bigdata_consultas_user_id 
ON bigdata_consultas(user_id, data_consulta DESC);

-- Função para limpar consultas antigas (mais de 7 dias)
CREATE OR REPLACE FUNCTION limpar_consultas_antigas_bigdata()
RETURNS void AS $$
BEGIN
  DELETE FROM bigdata_consultas 
  WHERE data_consulta < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE bigdata_consultas IS 'Armazena histórico de consultas à API BigData para prevenir consultas duplicadas em 24h';
COMMENT ON COLUMN bigdata_consultas.documento IS 'CNPJ ou CPF sem formatação (apenas números)';
COMMENT ON COLUMN bigdata_consultas.tipo IS 'Tipo de consulta: basico, qsa, enderecos, telefones, emails, processos, pessoa_fisica';
COMMENT ON COLUMN bigdata_consultas.data_consulta IS 'Data e hora da consulta à API BigData';

-- ================================================================================
-- VERIFICAÇÃO (Execute estas queries para confirmar que funcionou)
-- ================================================================================

-- Verificar se a tabela foi criada
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'bigdata_consultas';

-- Verificar índices criados
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'bigdata_consultas';

-- Verificar função criada
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'limpar_consultas_antigas_bigdata';`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const executarSQL = async () => {
    setExecutando(true);
    setResultado(null);

    try {
      // Tenta executar via API
      const response = await fetch('/api/admin/executar-sql-bigdata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql: sqlScript }),
      });

      const data = await response.json();

      if (response.ok && data.sucesso) {
        setResultado({
          sucesso: true,
          mensagem: 'Tabela criada com sucesso! A trava de segurança está ativa.',
        });
      } else {
        setResultado({
          sucesso: false,
          mensagem: data.mensagem || 'Não foi possível executar automaticamente. Use a opção manual abaixo.',
        });
      }
    } catch (error: any) {
      setResultado({
        sucesso: false,
        mensagem: `Erro: ${error.message}. Use a opção manual abaixo.`,
      });
    } finally {
      setExecutando(false);
    }
  };

  return (
    <main className="min-h-screen p-6 bg-white">
      <div className="container max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Criar Trava de Segurança BigData"
          subtitle="Cria a tabela para controlar consultas à API BigData e prevenir consultas duplicadas"
          backHref="/settings/bigdata"
        />

        {resultado && (
          <Card>
            <div className={`p-4 rounded-lg ${
              resultado.sucesso 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <p className={resultado.sucesso ? 'text-green-800' : 'text-yellow-800'}>
                {resultado.mensagem}
              </p>
            </div>
          </Card>
        )}

        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Script SQL</h2>
              <div className="flex gap-2">
                <Button 
                  variant="primary" 
                  onClick={executarSQL}
                  disabled={executando}
                >
                  {executando ? 'Executando...' : 'Executar Automaticamente'}
                </Button>
                <Button variant="secondary" onClick={copyToClipboard}>
                  {copied ? 'Copiado' : 'Copiar Script'}
                </Button>
              </div>
            </div>

            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm font-mono whitespace-pre-wrap">{sqlScript}</pre>
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Executar Manualmente (Recomendado)</h2>
            
            <ol className="space-y-3 list-decimal list-inside text-gray-700">
              <li>
                <strong>Acesse o Supabase Dashboard:</strong>
                <br />
                <a 
                  href="https://supabase.com/dashboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  https://supabase.com/dashboard
                </a>
              </li>
              <li>
                <strong>Selecione seu projeto</strong>
              </li>
              <li>
                <strong>No menu lateral, clique em "SQL Editor"</strong>
              </li>
              <li>
                <strong>Cole o script SQL acima</strong> (ou clique em "Copiar Script")
              </li>
              <li>
                <strong>Clique em "RUN"</strong> (ou pressione Ctrl+Enter)
              </li>
              <li>
                <strong>Verifique os resultados</strong> - você verá as queries de verificação retornando os resultados
              </li>
            </ol>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">O que o Script Faz</h2>
            
            <ul className="space-y-2 list-disc list-inside text-gray-700">
              <li><strong>Cria a tabela <code>bigdata_consultas</code></strong> para armazenar histórico de consultas</li>
              <li><strong>Cria índices</strong> para melhorar performance nas buscas</li>
              <li><strong>Cria função</strong> para limpeza automática de registros antigos (7 dias)</li>
              <li><strong>Adiciona comentários</strong> explicativos</li>
              <li><strong>Executa queries de verificação</strong> para confirmar que tudo funcionou</li>
            </ul>
          </div>
        </Card>

        <Card>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Como Funciona a Trava</h3>
            <p className="text-blue-800 text-sm mb-2">
              Após criar esta tabela, o sistema irá:
            </p>
            <ul className="text-blue-800 text-sm list-disc list-inside space-y-1">
              <li>Verificar se um CNPJ/CPF já foi consultado nas últimas 24 horas</li>
              <li>Bloquear consultas duplicadas retornando erro 429</li>
              <li>Registrar todas as consultas bem-sucedidas</li>
              <li>Permitir consultas diferentes (ex: enderecos e qsa) do mesmo documento</li>
            </ul>
          </div>
        </Card>
      </div>
    </main>
  );
}
