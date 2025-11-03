-- ================================================================================
-- REESTRUTURAÇÃO: HIERARQUIA CEDENTE → SACADOS
-- ================================================================================
-- Este script adiciona o relacionamento onde cada SACADO pertence a um CEDENTE
-- Estrutura: CEDENTE (cliente) → SACADOS (devedores do cedente)
-- Finalidade: Sistema de cobrança e recuperação de ativos

-- ================================================================================
-- 1. ADICIONAR COLUNA cedente_id NA TABELA sacados
-- ================================================================================

-- Adiciona a coluna cedente_id (pode ser NULL temporariamente para migração)
ALTER TABLE sacados 
ADD COLUMN IF NOT EXISTS cedente_id UUID REFERENCES cedentes(id) ON DELETE CASCADE;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_sacados_cedente_id ON sacados(cedente_id);

-- ================================================================================
-- 2. COMENTÁRIOS EXPLICATIVOS
-- ================================================================================

COMMENT ON COLUMN sacados.cedente_id IS 'ID do cedente ao qual este sacado pertence (devedor do cedente)';
COMMENT ON TABLE sacados IS 'Sacados (devedores) - Cada sacado pertence a um cedente e representa uma empresa/pessoa que deve pagar';
COMMENT ON TABLE cedentes IS 'Cedentes (clientes) - Empresas que contratam o serviço de cobrança e recuperação de ativos';

-- ================================================================================
-- 3. ATUALIZAR CONSTRAINT (Depois de popular dados)
-- ================================================================================
-- ATENÇÃO: Execute este comando APENAS depois de vincular todos os sacados a cedentes
-- 
-- ALTER TABLE sacados 
-- ALTER COLUMN cedente_id SET NOT NULL;

-- ================================================================================
-- 4. VERIFICAÇÃO
-- ================================================================================

-- Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sacados' AND column_name = 'cedente_id';

-- Verificar índice
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'sacados' AND indexname = 'idx_sacados_cedente_id';

-- Contar sacados sem cedente (devem ser vinculados)
SELECT COUNT(*) as sacados_sem_cedente 
FROM sacados 
WHERE cedente_id IS NULL;

-- ================================================================================
-- 5. EXEMPLO DE VINCULAÇÃO MANUAL (Se necessário migrar dados existentes)
-- ================================================================================

-- Opção 1: Criar um cedente padrão para sacados antigos
-- INSERT INTO cedentes (nome, razao_social, user_id) 
-- VALUES ('Cedente Padrão', 'Cedente Padrão LTDA', 'SEU_USER_ID_AQUI')
-- RETURNING id;

-- Opção 2: Vincular todos os sacados órfãos ao cedente padrão
-- UPDATE sacados 
-- SET cedente_id = 'ID_DO_CEDENTE_PADRAO_AQUI'
-- WHERE cedente_id IS NULL;

-- ================================================================================
-- 6. QUERIES ÚTEIS
-- ================================================================================

-- Listar cedentes com contagem de sacados
-- SELECT 
--   c.id,
--   c.nome,
--   c.razao_social,
--   COUNT(s.cnpj) as total_sacados
-- FROM cedentes c
-- LEFT JOIN sacados s ON s.cedente_id = c.id
-- GROUP BY c.id, c.nome, c.razao_social
-- ORDER BY total_sacados DESC;

-- Listar sacados de um cedente específico
-- SELECT 
--   s.cnpj,
--   s.razao_social,
--   s.nome_fantasia,
--   s.situacao,
--   s.porte
-- FROM sacados s
-- WHERE s.cedente_id = 'ID_DO_CEDENTE_AQUI'
-- ORDER BY s.razao_social;

-- ================================================================================
-- FIM DO SCRIPT
-- ================================================================================
