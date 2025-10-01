-- Script para adicionar constraints e evitar duplicatas
-- Execute este script no Supabase SQL Editor APÓS criar as tabelas

-- IMPORTANTE: Este script previne duplicatas ao nível de banco de dados

-- ============================================================================
-- QSA: Mesmo CPF + CNPJ + Qualificação = duplicata
-- ============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_qsa 
ON sacados_qsa(sacado_cnpj, cpf, qualificacao) 
WHERE ativo = true;

-- ============================================================================
-- ENDEREÇOS: Mesmo endereço + CEP para mesmo CNPJ = duplicata
-- ============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_endereco 
ON sacados_enderecos(sacado_cnpj, endereco, cep) 
WHERE ativo = true;

-- ============================================================================
-- TELEFONES: Mesmo telefone para mesmo CNPJ = duplicata
-- ============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_telefone 
ON sacados_telefones(sacado_cnpj, telefone) 
WHERE ativo = true;

-- ============================================================================
-- E-MAILS: Mesmo e-mail para mesmo CNPJ = duplicata
-- ============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_email 
ON sacados_emails(sacado_cnpj, email) 
WHERE ativo = true;

-- ============================================================================
-- PESSOAS LIGADAS: Mesmo CPF + tipo relacionamento = duplicata
-- ============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pessoa_ligada 
ON sacados_pessoas_ligadas(sacado_cnpj, cpf, tipo_relacionamento) 
WHERE ativo = true;

-- ============================================================================
-- EMPRESAS LIGADAS: Mesmo CNPJ relacionado + tipo = duplicata
-- ============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_empresa_ligada 
ON sacados_empresas_ligadas(sacado_cnpj, cnpj_relacionado, tipo_relacionamento) 
WHERE ativo = true;

-- ============================================================================
-- PROCESSOS: Mesmo número de processo = duplicata
-- ============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_processo 
ON sacados_processos(sacado_cnpj, numero_processo) 
WHERE ativo = true;

-- ============================================================================
-- Verificação
-- ============================================================================
-- Para verificar se as constraints foram criadas, execute:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename LIKE 'sacados_%' AND indexname LIKE 'idx_unique%';

