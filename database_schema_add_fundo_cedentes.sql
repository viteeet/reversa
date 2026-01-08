-- ================================================================================
-- ADICIONAR CAMPO FUNDO NA TABELA CEDENTES
-- ================================================================================
-- Execute este script no Supabase SQL Editor
-- Este script adiciona o campo 'fundo' na tabela cedentes para identificar
-- qual fundo é responsável pelo cedente

-- Adicionar coluna fundo se não existir
ALTER TABLE cedentes 
ADD COLUMN IF NOT EXISTS fundo VARCHAR(255);

-- Criar índice para melhorar performance de filtros
CREATE INDEX IF NOT EXISTS idx_cedentes_fundo ON cedentes(fundo);

-- Comentário na coluna
COMMENT ON COLUMN cedentes.fundo IS 'Nome do fundo responsável pelo cedente';

-- IMPORTANTE: Após preencher todos os cedentes existentes com o campo fundo,
-- execute o comando abaixo para tornar o campo obrigatório:
-- ALTER TABLE cedentes ALTER COLUMN fundo SET NOT NULL;

