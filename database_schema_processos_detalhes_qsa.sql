-- ================================================================================
-- PROCESSOS (TEXTO SIMPLES) E DETALHES DO QSA
-- ================================================================================
-- Execute este script no Supabase SQL Editor

-- ================================================================================
-- 1. ADICIONAR CAMPO DE PROCESSOS NA TABELA DE OBSERVAÇÕES GERAIS
-- ================================================================================

-- Adiciona coluna processos_texto na tabela cedentes_observacoes_gerais
ALTER TABLE cedentes_observacoes_gerais 
ADD COLUMN IF NOT EXISTS processos_texto TEXT;

-- Adiciona coluna processos_texto na tabela sacados_observacoes_gerais  
ALTER TABLE sacados_observacoes_gerais 
ADD COLUMN IF NOT EXISTS processos_texto TEXT;

COMMENT ON COLUMN cedentes_observacoes_gerais.processos_texto IS 'Campo de texto livre para colar todas as informações de processos judiciais e informações relevantes';
COMMENT ON COLUMN sacados_observacoes_gerais.processos_texto IS 'Campo de texto livre para colar todas as informações de processos judiciais e informações relevantes';

-- ================================================================================
-- 2. TABELA DE DETALHES COMPLETOS DE PESSOAS DO QSA
-- ================================================================================

-- Detalhes completos de cada pessoa do QSA - CEDENTES
CREATE TABLE IF NOT EXISTS cedentes_qsa_detalhes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qsa_id UUID NOT NULL REFERENCES cedentes_qsa(id) ON DELETE CASCADE UNIQUE,
  cedente_id UUID NOT NULL REFERENCES cedentes(id) ON DELETE CASCADE,
  detalhes_completos TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detalhes completos de cada pessoa do QSA - SACADOS
CREATE TABLE IF NOT EXISTS sacados_qsa_detalhes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qsa_id UUID NOT NULL REFERENCES sacados_qsa(id) ON DELETE CASCADE UNIQUE,
  sacado_cnpj VARCHAR(18) NOT NULL REFERENCES sacados(cnpj) ON DELETE CASCADE,
  detalhes_completos TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cedentes_qsa_detalhes_qsa_id ON cedentes_qsa_detalhes(qsa_id);
CREATE INDEX IF NOT EXISTS idx_cedentes_qsa_detalhes_cedente_id ON cedentes_qsa_detalhes(cedente_id);
CREATE INDEX IF NOT EXISTS idx_sacados_qsa_detalhes_qsa_id ON sacados_qsa_detalhes(qsa_id);
CREATE INDEX IF NOT EXISTS idx_sacados_qsa_detalhes_cnpj ON sacados_qsa_detalhes(sacado_cnpj);

-- Habilitar RLS
ALTER TABLE cedentes_qsa_detalhes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sacados_qsa_detalhes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - Cedentes QSA Detalhes
CREATE POLICY "Usuarios autenticados podem ver detalhes QSA cedentes"
ON cedentes_qsa_detalhes FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados podem inserir detalhes QSA cedentes"
ON cedentes_qsa_detalhes FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados podem atualizar detalhes QSA cedentes"
ON cedentes_qsa_detalhes FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados podem deletar detalhes QSA cedentes"
ON cedentes_qsa_detalhes FOR DELETE
USING (auth.role() = 'authenticated');

-- Políticas RLS - Sacados QSA Detalhes
CREATE POLICY "Usuarios autenticados podem ver detalhes QSA sacados"
ON sacados_qsa_detalhes FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados podem inserir detalhes QSA sacados"
ON sacados_qsa_detalhes FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados podem atualizar detalhes QSA sacados"
ON sacados_qsa_detalhes FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados podem deletar detalhes QSA sacados"
ON sacados_qsa_detalhes FOR DELETE
USING (auth.role() = 'authenticated');

-- Comentários
COMMENT ON TABLE cedentes_qsa_detalhes IS 'Detalhes completos de investigação de cada pessoa do QSA (endereços, telefones, emails, familiares, processos, etc)';
COMMENT ON TABLE sacados_qsa_detalhes IS 'Detalhes completos de investigação de cada pessoa do QSA (endereços, telefones, emails, familiares, processos, etc)';

-- ================================================================================
-- VERIFICAÇÃO
-- ================================================================================

-- Verificar colunas adicionadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('cedentes_observacoes_gerais', 'sacados_observacoes_gerais')
AND column_name = 'processos_texto';

-- Verificar tabelas criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('cedentes_qsa_detalhes', 'sacados_qsa_detalhes');

-- Verificar índices
SELECT tablename, indexname FROM pg_indexes 
WHERE tablename IN ('cedentes_qsa_detalhes', 'sacados_qsa_detalhes');

-- Verificar políticas
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('cedentes_qsa_detalhes', 'sacados_qsa_detalhes');

