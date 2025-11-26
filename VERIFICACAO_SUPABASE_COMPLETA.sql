-- ================================================================================
-- SCRIPT DE VERIFICAÇÃO COMPLETA DO SUPABASE
-- ================================================================================
-- Execute este script no Supabase SQL Editor para verificar se tudo está OK
-- Este script verifica tabelas, colunas, relacionamentos, RLS e índices

-- ================================================================================
-- 1. VERIFICAR TABELAS PRINCIPAIS
-- ================================================================================

SELECT 
  'Tabelas Principais' as categoria,
  table_name,
  CASE 
    WHEN table_name IN ('cedentes', 'sacados') THEN '✅ OK' 
    ELSE '❌ FALTANDO' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('cedentes', 'sacados')
ORDER BY table_name;

-- ================================================================================
-- 2. VERIFICAR COLUNAS DA TABELA SACADOS
-- ================================================================================

SELECT 
  'Colunas Sacados' as categoria,
  column_name,
  data_type,
  is_nullable,
  CASE 
    WHEN column_name IN (
      'cnpj', 'razao_social', 'nome_fantasia', 
      'endereco_receita', 'telefone_receita', 'email_receita',
      'situacao', 'porte', 'natureza_juridica', 'data_abertura',
      'capital_social', 'atividade_principal_codigo', 
      'atividade_principal_descricao', 'atividades_secundarias',
      'simples_nacional', 'cedente_id', 'ultima_atualizacao'
    ) THEN '✅ OK'
    ELSE '⚠️ EXTRA'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sacados'
ORDER BY column_name;

-- ================================================================================
-- 3. VERIFICAR TABELAS COMPLEMENTARES DE SACADOS
-- ================================================================================

SELECT 
  'Tabelas Complementares Sacados' as categoria,
  table_name,
  CASE 
    WHEN table_name IN (
      'sacados_qsa',
      'sacados_enderecos',
      'sacados_telefones',
      'sacados_emails',
      'sacados_pessoas_ligadas',
      'sacados_empresas_ligadas',
      'sacados_processos',
      'sacados_observacoes_gerais',
      'sacados_qsa_detalhes'
    ) THEN '✅ OK'
    ELSE '❌ FALTANDO'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'sacados_%'
ORDER BY table_name;

-- ================================================================================
-- 4. VERIFICAR TABELAS COMPLEMENTARES DE CEDENTES
-- ================================================================================

SELECT 
  'Tabelas Complementares Cedentes' as categoria,
  table_name,
  CASE 
    WHEN table_name IN (
      'cedentes_qsa',
      'cedentes_enderecos',
      'cedentes_telefones',
      'cedentes_emails',
      'cedentes_pessoas_ligadas',
      'cedentes_empresas_ligadas',
      'cedentes_processos',
      'cedentes_observacoes_gerais',
      'cedentes_qsa_detalhes'
    ) THEN '✅ OK'
    ELSE '❌ FALTANDO'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'cedentes_%'
ORDER BY table_name;

-- ================================================================================
-- 5. VERIFICAR COLUNAS ESPECÍFICAS - PESSOAS LIGADAS (SACADOS)
-- ================================================================================

SELECT 
  'Colunas sacados_pessoas_ligadas' as categoria,
  column_name,
  data_type,
  CASE 
    WHEN column_name IN (
      'id', 'sacado_cnpj', 'cpf', 'nome', 'tipo_relacionamento',
      'telefone', 'email', 'endereco', 'cidade', 'estado', 
      'observacoes', 'origem', 'ativo'
    ) THEN '✅ OK'
    WHEN column_name IN ('telefone', 'email', 'endereco', 'cidade', 'estado') THEN '⚠️ VERIFICAR'
    ELSE '❌ FALTANDO'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sacados_pessoas_ligadas'
ORDER BY column_name;

-- ================================================================================
-- 6. VERIFICAR COLUNAS - OBSERVAÇÕES GERAIS (SACADOS)
-- ================================================================================

SELECT 
  'Colunas sacados_observacoes_gerais' as categoria,
  column_name,
  data_type,
  CASE 
    WHEN column_name IN ('id', 'sacado_cnpj', 'observacoes', 'processos_texto', 'created_at', 'updated_at') 
    THEN '✅ OK'
    WHEN column_name = 'processos_texto' THEN '⚠️ VERIFICAR'
    ELSE '❌ FALTANDO'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sacados_observacoes_gerais'
ORDER BY column_name;

-- ================================================================================
-- 7. VERIFICAR COLUNAS - OBSERVAÇÕES GERAIS (CEDENTES)
-- ================================================================================

SELECT 
  'Colunas cedentes_observacoes_gerais' as categoria,
  column_name,
  data_type,
  CASE 
    WHEN column_name IN ('id', 'cedente_id', 'observacoes', 'processos_texto', 'created_at', 'updated_at') 
    THEN '✅ OK'
    WHEN column_name = 'processos_texto' THEN '⚠️ VERIFICAR'
    ELSE '❌ FALTANDO'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'cedentes_observacoes_gerais'
ORDER BY column_name;

-- ================================================================================
-- 8. VERIFICAR FOREIGN KEYS (RELACIONAMENTOS)
-- ================================================================================

SELECT 
  'Foreign Keys' as categoria,
  tc.table_name as tabela_filha,
  kcu.column_name as coluna_fk,
  ccu.table_name AS tabela_pai,
  ccu.column_name AS coluna_pai,
  CASE 
    WHEN tc.table_name LIKE 'sacados_%' AND ccu.table_name = 'sacados' THEN '✅ OK'
    WHEN tc.table_name LIKE 'cedentes_%' AND ccu.table_name = 'cedentes' THEN '✅ OK'
    WHEN tc.table_name LIKE '%_qsa_detalhes' THEN '✅ OK'
    ELSE '⚠️ VERIFICAR'
  END as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND (tc.table_name LIKE 'sacados_%' OR tc.table_name LIKE 'cedentes_%')
ORDER BY tc.table_name, kcu.column_name;

-- ================================================================================
-- 9. VERIFICAR POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ================================================================================

SELECT 
  'Políticas RLS' as categoria,
  tablename as tabela,
  policyname as politica,
  permissive,
  roles,
  CASE 
    WHEN roles::text LIKE '%authenticated%' THEN '✅ OK'
    ELSE '⚠️ VERIFICAR'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
AND (tablename LIKE 'sacados_%' OR tablename LIKE 'cedentes_%' OR tablename IN ('sacados', 'cedentes'))
ORDER BY tablename, policyname;

-- ================================================================================
-- 10. VERIFICAR ÍNDICES IMPORTANTES
-- ================================================================================

SELECT 
  'Índices' as categoria,
  tablename as tabela,
  indexname as indice,
  indexdef,
  CASE 
    WHEN indexname LIKE 'idx_%' OR indexname LIKE '%_pkey' THEN '✅ OK'
    ELSE '⚠️ VERIFICAR'
  END as status
FROM pg_indexes
WHERE schemaname = 'public'
AND (
  tablename LIKE 'sacados_%' OR 
  tablename LIKE 'cedentes_%' OR 
  tablename IN ('sacados', 'cedentes')
)
ORDER BY tablename, indexname;

-- ================================================================================
-- 11. VERIFICAR SE RLS ESTÁ HABILITADO
-- ================================================================================

SELECT 
  'RLS Habilitado' as categoria,
  schemaname,
  tablename,
  rowsecurity as rls_habilitado,
  CASE 
    WHEN rowsecurity = true THEN '✅ OK'
    ELSE '❌ DESABILITADO'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
AND (
  tablename LIKE 'sacados_%' OR 
  tablename LIKE 'cedentes_%' OR 
  tablename IN ('sacados', 'cedentes')
)
ORDER BY tablename;

-- ================================================================================
-- 12. RESUMO GERAL - VERIFICAR COLUNAS ESPERADAS VS EXISTENTES
-- ================================================================================

-- Verificar se coluna processos_texto existe
SELECT 
  'Campo processos_texto' as verificacao,
  table_name,
  column_name,
  CASE 
    WHEN column_name = 'processos_texto' THEN '✅ EXISTE'
    ELSE '❌ FALTANDO'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('cedentes_observacoes_gerais', 'sacados_observacoes_gerais')
AND column_name = 'processos_texto';

-- Verificar se campos de pessoas ligadas existem (sacados)
SELECT 
  'Campos pessoas_ligadas (sacados)' as verificacao,
  column_name,
  CASE 
    WHEN column_name IN ('telefone', 'email', 'endereco', 'cidade', 'estado') THEN '✅ EXISTE'
    ELSE '❌ FALTANDO'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'sacados_pessoas_ligadas'
AND column_name IN ('telefone', 'email', 'endereco', 'cidade', 'estado');

-- Verificar se campos de pessoas ligadas existem (cedentes)
SELECT 
  'Campos pessoas_ligadas (cedentes)' as verificacao,
  column_name,
  CASE 
    WHEN column_name IN ('telefone', 'email', 'endereco', 'cidade', 'estado') THEN '✅ EXISTE'
    ELSE '❌ FALTANDO'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'cedentes_pessoas_ligadas'
AND column_name IN ('telefone', 'email', 'endereco', 'cidade', 'estado');

-- ================================================================================
-- 13. VERIFICAR UNIQUE CONSTRAINTS (para observacoes_gerais)
-- ================================================================================

SELECT 
  'Unique Constraints' as categoria,
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  CASE 
    WHEN tc.constraint_type = 'UNIQUE' THEN '✅ OK'
    ELSE '⚠️ VERIFICAR'
  END as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('cedentes_observacoes_gerais', 'sacados_observacoes_gerais')
AND tc.constraint_type = 'UNIQUE';

-- ================================================================================
-- 14. VERIFICAR COLUNAS ESPECÍFICAS - SACADOS QSA DETALHES
-- ================================================================================

SELECT 
  'Tabela sacados_qsa_detalhes' as categoria,
  column_name,
  data_type,
  CASE 
    WHEN column_name IN ('id', 'qsa_id', 'sacado_cnpj', 'detalhes_completos', 'created_at', 'updated_at') 
    THEN '✅ OK'
    ELSE '❌ FALTANDO'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sacados_qsa_detalhes'
ORDER BY column_name;

-- ================================================================================
-- 15. VERIFICAR COLUNAS ESPECÍFICAS - CEDENTES QSA DETALHES
-- ================================================================================

SELECT 
  'Tabela cedentes_qsa_detalhes' as categoria,
  column_name,
  data_type,
  CASE 
    WHEN column_name IN ('id', 'qsa_id', 'cedente_id', 'detalhes_completos', 'created_at', 'updated_at') 
    THEN '✅ OK'
    ELSE '❌ FALTANDO'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'cedentes_qsa_detalhes'
ORDER BY column_name;

-- ================================================================================
-- RESUMO FINAL - CONTAGEM DE TABELAS
-- ================================================================================

SELECT 
  'RESUMO FINAL' as categoria,
  COUNT(*) FILTER (WHERE table_name LIKE 'sacados_%') as total_tabelas_sacados,
  COUNT(*) FILTER (WHERE table_name LIKE 'cedentes_%') as total_tabelas_cedentes,
  COUNT(*) FILTER (WHERE table_name IN ('sacados', 'cedentes')) as total_tabelas_principais,
  COUNT(*) as total_geral
FROM information_schema.tables
WHERE table_schema = 'public'
AND (
  table_name LIKE 'sacados_%' OR 
  table_name LIKE 'cedentes_%' OR 
  table_name IN ('sacados', 'cedentes')
);

