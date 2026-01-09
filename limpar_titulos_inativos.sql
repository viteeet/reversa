-- ================================================================================
-- SCRIPT PARA LIMPAR TÍTULOS MARCADOS COMO INATIVOS (ativo = false)
-- ================================================================================
-- Este script deleta permanentemente os títulos que foram marcados como inativos
-- ATENÇÃO: Esta ação não pode ser desfeita!
-- Execute este script no Supabase SQL Editor
-- ================================================================================

-- 1. Primeiro, deleta as atividades relacionadas aos títulos inativos
DELETE FROM titulos_atividades
WHERE titulo_id IN (
  SELECT id FROM titulos_negociados WHERE ativo = false
);

-- 2. Deleta o histórico de críticas relacionadas aos títulos inativos
DELETE FROM titulos_criticas_historico
WHERE titulo_id IN (
  SELECT id FROM titulos_negociados WHERE ativo = false
);

-- 3. Deleta os relacionamentos com parcelamentos (parcelamentos_titulos)
-- Nota: ON DELETE CASCADE deve fazer isso automaticamente, mas vamos garantir
DELETE FROM parcelamentos_titulos
WHERE titulo_id IN (
  SELECT id FROM titulos_negociados WHERE ativo = false
);

-- 4. Finalmente, deleta os títulos inativos
DELETE FROM titulos_negociados
WHERE ativo = false;

-- ================================================================================
-- VERIFICAÇÃO: Conta quantos títulos ainda estão marcados como inativos
-- ================================================================================
SELECT COUNT(*) as titulos_inativos_restantes
FROM titulos_negociados
WHERE ativo = false;

-- Se retornar 0, todos os títulos inativos foram deletados com sucesso!

