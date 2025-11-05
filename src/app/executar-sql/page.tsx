'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function ExecutarSQLPage() {
  const [copied, setCopied] = useState(false);

  const sqlScript = `-- ================================================================================
-- ATUALIZAÇÃO: Adicionar coluna cedente_id na tabela sacados
-- ================================================================================
-- Execute este script no Supabase SQL Editor para corrigir o erro:
-- "Could not find the 'cedente_id' column of 'sacados' in the schema cache"
-- ================================================================================

-- 1. Adicionar a coluna cedente_id na tabela sacados
-- (Permite NULL temporariamente para migração de dados existentes)
ALTER TABLE sacados 
ADD COLUMN IF NOT EXISTS cedente_id UUID REFERENCES cedentes(id) ON DELETE CASCADE;

-- 2. Criar índice para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS idx_sacados_cedente_id ON sacados(cedente_id);

-- 3. Adicionar comentários explicativos
COMMENT ON COLUMN sacados.cedente_id IS 'ID do cedente ao qual este sacado pertence (devedor do cedente)';

-- ================================================================================
-- VERIFICAÇÃO (Execute estas queries para confirmar que funcionou)
-- ================================================================================

-- Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sacados' AND column_name = 'cedente_id';

-- Verificar índice criado
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'sacados' AND indexname = 'idx_sacados_cedente_id';

-- Contar sacados sem cedente (NULL é permitido temporariamente)
SELECT COUNT(*) as sacados_sem_cedente 
FROM sacados 
WHERE cedente_id IS NULL;`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen p-6 bg-white">
      <div className="container max-w-4xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-[#0369a1] mb-2">
            🔧 Atualizar Supabase - Adicionar Coluna cedente_id
          </h1>
          <p className="text-[#64748b]">
            Execute este script SQL no Supabase para corrigir o erro
          </p>
        </header>

        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">📋 Script SQL</h2>
              <Button variant="primary" onClick={copyToClipboard}>
                {copied ? '✅ Copiado!' : '📋 Copiar Script'}
              </Button>
            </div>

            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm font-mono whitespace-pre-wrap">{sqlScript}</pre>
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">📝 Passo a Passo</h2>
            
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
            <h2 className="text-xl font-semibold text-gray-800">✅ O que o Script Faz?</h2>
            
            <ul className="space-y-2 list-disc list-inside text-gray-700">
              <li><strong>Adiciona a coluna <code>cedente_id</code></strong> na tabela <code>sacados</code></li>
              <li><strong>Cria um índice</strong> para melhorar performance nas consultas</li>
              <li><strong>Adiciona comentários</strong> explicativos</li>
              <li><strong>Executa queries de verificação</strong> para confirmar que tudo funcionou</li>
            </ul>
          </div>
        </Card>

        <Card>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Dica</h3>
            <p className="text-blue-800 text-sm">
              Após executar o script, o erro desaparecerá e você poderá adicionar sacados vinculados a cedentes normalmente.
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}

