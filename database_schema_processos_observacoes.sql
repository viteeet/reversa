-- ================================================================================
-- PROCESSOS JUDICIAIS E OBSERVAÇÕES GERAIS
-- ================================================================================
-- Execute este script no Supabase SQL Editor

-- Tabela de processos encontrados no Jusbrasil - CEDENTES
CREATE TABLE IF NOT EXISTS cedentes_processos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedente_id UUID NOT NULL REFERENCES cedentes(id) ON DELETE CASCADE,
  numero_processo VARCHAR(50) NOT NULL,
  tribunal VARCHAR(100),
  vara VARCHAR(255),
  tipo_acao VARCHAR(255),
  valor_causa DECIMAL(15,2),
  data_distribuicao DATE,
  status VARCHAR(100),
  parte_contraria TEXT,
  observacoes TEXT,
  link_processo TEXT,
  origem VARCHAR(50) DEFAULT 'manual', -- 'manual', 'jusbrasil', 'api'
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de processos encontrados no Jusbrasil - SACADOS
CREATE TABLE IF NOT EXISTS sacados_processos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacado_cnpj VARCHAR(18) NOT NULL REFERENCES sacados(cnpj) ON DELETE CASCADE,
  numero_processo VARCHAR(50) NOT NULL,
  tribunal VARCHAR(100),
  vara VARCHAR(255),
  tipo_acao VARCHAR(255),
  valor_causa DECIMAL(15,2),
  data_distribuicao DATE,
  status VARCHAR(100),
  parte_contraria TEXT,
  observacoes TEXT,
  link_processo TEXT,
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de observações gerais - CEDENTES (UMA OBSERVAÇÃO POR EMPRESA)
CREATE TABLE IF NOT EXISTS cedentes_observacoes_gerais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedente_id UUID NOT NULL REFERENCES cedentes(id) ON DELETE CASCADE UNIQUE,
  observacoes TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de observações gerais - SACADOS (UMA OBSERVAÇÃO POR EMPRESA)
CREATE TABLE IF NOT EXISTS sacados_observacoes_gerais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacado_cnpj VARCHAR(18) NOT NULL REFERENCES sacados(cnpj) ON DELETE CASCADE UNIQUE,
  observacoes TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_cedentes_processos_cedente_id ON cedentes_processos(cedente_id);
CREATE INDEX IF NOT EXISTS idx_cedentes_processos_numero ON cedentes_processos(numero_processo);
CREATE INDEX IF NOT EXISTS idx_sacados_processos_cnpj ON sacados_processos(sacado_cnpj);
CREATE INDEX IF NOT EXISTS idx_sacados_processos_numero ON sacados_processos(numero_processo);
CREATE INDEX IF NOT EXISTS idx_cedentes_obs_cedente ON cedentes_observacoes_gerais(cedente_id);
CREATE INDEX IF NOT EXISTS idx_sacados_obs_cnpj ON sacados_observacoes_gerais(sacado_cnpj);

-- Habilitar RLS
ALTER TABLE cedentes_processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE sacados_processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cedentes_observacoes_gerais ENABLE ROW LEVEL SECURITY;
ALTER TABLE sacados_observacoes_gerais ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - Cedentes Processos
CREATE POLICY "Usuarios autenticados podem ver processos cedentes"
ON cedentes_processos FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados podem inserir processos cedentes"
ON cedentes_processos FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados podem atualizar processos cedentes"
ON cedentes_processos FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados podem deletar processos cedentes"
ON cedentes_processos FOR DELETE
USING (auth.role() = 'authenticated');

-- Políticas RLS - Sacados Processos
CREATE POLICY "Usuarios autenticados podem ver processos sacados"
ON sacados_processos FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados podem inserir processos sacados"
ON sacados_processos FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados podem atualizar processos sacados"
ON sacados_processos FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados podem deletar processos sacados"
ON sacados_processos FOR DELETE
USING (auth.role() = 'authenticated');

-- Políticas RLS - Cedentes Observações Gerais
CREATE POLICY "Usuarios autenticados podem ver observacoes gerais cedentes"
ON cedentes_observacoes_gerais FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados podem inserir observacoes gerais cedentes"
ON cedentes_observacoes_gerais FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados podem atualizar observacoes gerais cedentes"
ON cedentes_observacoes_gerais FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados podem deletar observacoes gerais cedentes"
ON cedentes_observacoes_gerais FOR DELETE
USING (auth.role() = 'authenticated');

-- Políticas RLS - Sacados Observações Gerais
CREATE POLICY "Usuarios autenticados podem ver observacoes gerais sacados"
ON sacados_observacoes_gerais FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados podem inserir observacoes gerais sacados"
ON sacados_observacoes_gerais FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados podem atualizar observacoes gerais sacados"
ON sacados_observacoes_gerais FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados podem deletar observacoes gerais sacados"
ON sacados_observacoes_gerais FOR DELETE
USING (auth.role() = 'authenticated');

-- Comentários
COMMENT ON TABLE cedentes_processos IS 'Processos judiciais encontrados no Jusbrasil ou outras fontes - Cedentes';
COMMENT ON TABLE sacados_processos IS 'Processos judiciais encontrados no Jusbrasil ou outras fontes - Sacados';
COMMENT ON TABLE cedentes_observacoes_gerais IS 'Observações gerais únicas para cada cedente (visão global da empresa)';
COMMENT ON TABLE sacados_observacoes_gerais IS 'Observações gerais únicas para cada sacado (visão global da empresa)';

-- ================================================================================
-- VERIFICAÇÃO
-- ================================================================================

-- Verificar tabelas criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('cedentes_processos', 'sacados_processos', 'cedentes_observacoes_gerais', 'sacados_observacoes_gerais');

-- Verificar índices
SELECT tablename, indexname FROM pg_indexes 
WHERE tablename IN ('cedentes_processos', 'sacados_processos', 'cedentes_observacoes_gerais', 'sacados_observacoes_gerais');

-- Verificar políticas
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('cedentes_processos', 'sacados_processos', 'cedentes_observacoes_gerais', 'sacados_observacoes_gerais');
