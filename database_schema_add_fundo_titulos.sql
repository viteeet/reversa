-- ================================================================================
-- ADICIONAR CAMPO FUNDO NA TABELA TITULOS_NEGOCIADOS
-- ================================================================================
-- Execute este script no Supabase SQL Editor
-- Este script adiciona o campo 'fundo' na tabela titulos_negociados para identificar
-- qual fundo é responsável por cada título

-- Adicionar coluna fundo se não existir
ALTER TABLE titulos_negociados 
ADD COLUMN IF NOT EXISTS fundo VARCHAR(255);

-- Criar índice para melhorar performance de filtros
CREATE INDEX IF NOT EXISTS idx_titulos_negociados_fundo ON titulos_negociados(fundo);

-- Comentário na coluna
COMMENT ON COLUMN titulos_negociados.fundo IS 'Nome do fundo responsável pelo título';

-- ================================================================================
-- TABELA DE FUNDOS DISPONÍVEIS (OPCIONAL - para manter lista de fundos)
-- ================================================================================
CREATE TABLE IF NOT EXISTS fundos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_fundos_nome ON fundos(nome);
CREATE INDEX IF NOT EXISTS idx_fundos_ativo ON fundos(ativo);

-- Comentários
COMMENT ON TABLE fundos IS 'Lista de fundos disponíveis no sistema';
COMMENT ON COLUMN fundos.nome IS 'Nome do fundo (deve ser único)';
COMMENT ON COLUMN fundos.ativo IS 'Indica se o fundo está ativo';

-- RLS Policies para fundos
ALTER TABLE fundos ENABLE ROW LEVEL SECURITY;

-- Política: Usuários autenticados podem ver todos os fundos ativos
CREATE POLICY "Usuários autenticados podem ver fundos ativos" ON fundos
  FOR SELECT
  USING (auth.role() = 'authenticated' AND ativo = true);

-- Política: Usuários autenticados podem inserir novos fundos
CREATE POLICY "Usuários autenticados podem inserir fundos" ON fundos
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Política: Usuários autenticados podem atualizar fundos
CREATE POLICY "Usuários autenticados podem atualizar fundos" ON fundos
  FOR UPDATE
  USING (auth.role() = 'authenticated');

