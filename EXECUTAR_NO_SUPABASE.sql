-- ================================================================================
-- DADOS ENCONTRADOS PARA CEDENTES
-- ================================================================================
-- Execute este script completo no Supabase SQL Editor
-- https://supabase.com/dashboard/project/[seu-projeto]/sql

-- Criar tabela de dados encontrados para cedentes
CREATE TABLE IF NOT EXISTS cedentes_dados_encontrados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedente_id UUID NOT NULL REFERENCES cedentes(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('telefone', 'email', 'endereco', 'pessoa', 'empresa', 'processo', 'outros')),
  titulo VARCHAR(255) NOT NULL,
  conteudo TEXT NOT NULL,
  observacoes TEXT,
  fonte VARCHAR(255),
  data_encontrado DATE DEFAULT CURRENT_DATE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_cedentes_dados_encontrados_cedente_id 
ON cedentes_dados_encontrados(cedente_id);

CREATE INDEX IF NOT EXISTS idx_cedentes_dados_encontrados_tipo 
ON cedentes_dados_encontrados(tipo);

CREATE INDEX IF NOT EXISTS idx_cedentes_dados_encontrados_ativo 
ON cedentes_dados_encontrados(ativo);

-- Habilitar Row Level Security
ALTER TABLE cedentes_dados_encontrados ENABLE ROW LEVEL SECURITY;

-- Política: Usuários autenticados podem visualizar
CREATE POLICY "Usuarios autenticados podem ver dados encontrados de cedentes"
ON cedentes_dados_encontrados FOR SELECT
USING (auth.role() = 'authenticated');

-- Política: Usuários autenticados podem inserir
CREATE POLICY "Usuarios autenticados podem inserir dados encontrados de cedentes"
ON cedentes_dados_encontrados FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Política: Usuários autenticados podem atualizar
CREATE POLICY "Usuarios autenticados podem atualizar dados encontrados de cedentes"
ON cedentes_dados_encontrados FOR UPDATE
USING (auth.role() = 'authenticated');

-- Política: Usuários autenticados podem deletar
CREATE POLICY "Usuarios autenticados podem deletar dados encontrados de cedentes"
ON cedentes_dados_encontrados FOR DELETE
USING (auth.role() = 'authenticated');

-- Adicionar comentários para documentação
COMMENT ON TABLE cedentes_dados_encontrados IS 
'Armazena informações encontradas manualmente sobre cedentes de diversas fontes (Google, indicação, LinkedIn, etc.)';

COMMENT ON COLUMN cedentes_dados_encontrados.cedente_id IS 
'Referência ao cedente ao qual os dados pertencem';

COMMENT ON COLUMN cedentes_dados_encontrados.tipo IS 
'Categoria do dado: telefone, email, endereco, pessoa, empresa, processo, outros';

COMMENT ON COLUMN cedentes_dados_encontrados.titulo IS 
'Título descritivo do dado (ex: Telefone do Sócio, Email Financeiro)';

COMMENT ON COLUMN cedentes_dados_encontrados.conteudo IS 
'Conteúdo da informação encontrada';

COMMENT ON COLUMN cedentes_dados_encontrados.fonte IS 
'Fonte de onde a informação foi obtida (ex: Google, Indicação, LinkedIn)';

COMMENT ON COLUMN cedentes_dados_encontrados.ativo IS 
'Flag de soft delete - false indica que o registro foi "excluído"';

-- ================================================================================
-- VERIFICAÇÃO E TESTES
-- ================================================================================

-- 1. Verificar se a tabela foi criada corretamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'cedentes_dados_encontrados'
ORDER BY ordinal_position;

-- 2. Verificar índices criados
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE tablename = 'cedentes_dados_encontrados';

-- 3. Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'cedentes_dados_encontrados';

-- 4. Verificar constraints
SELECT
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  CASE con.contype
    WHEN 'c' THEN 'CHECK'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    ELSE con.contype::text
  END AS constraint_description
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'cedentes_dados_encontrados';

-- 5. Teste de inserção (exemplo)
-- Descomente as linhas abaixo para testar após ter um cedente cadastrado
/*
INSERT INTO cedentes_dados_encontrados (
  cedente_id,
  tipo,
  titulo,
  conteudo,
  fonte,
  observacoes
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- Substituir por um UUID válido de cedente
  'telefone',
  'Telefone Comercial Principal',
  '(11) 98765-4321',
  'Google',
  'Encontrado no site da empresa'
);
*/

-- 6. Consulta de exemplo
-- Descomente para ver dados de um cedente específico
/*
SELECT 
  tipo,
  titulo,
  conteudo,
  fonte,
  data_encontrado,
  created_at
FROM cedentes_dados_encontrados
WHERE cedente_id = '00000000-0000-0000-0000-000000000000'  -- Substituir por UUID válido
  AND ativo = true
ORDER BY created_at DESC;
*/

-- ================================================================================
-- SCRIPT CONCLUÍDO
-- ================================================================================
-- ✅ Tabela criada
-- ✅ Índices criados
-- ✅ RLS habilitado
-- ✅ Políticas configuradas
-- ✅ Comentários adicionados
-- 
-- Próximo passo: Testar no sistema!
-- ================================================================================
