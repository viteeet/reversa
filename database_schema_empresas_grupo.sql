-- ================================================================================
-- GRUPOS DE EMPRESAS (MÚLTIPLOS CNPJs DA MESMA EMPRESA)
-- ================================================================================
-- Execute este script no Supabase SQL Editor

-- Tabela para agrupar CNPJs da mesma empresa
CREATE TABLE IF NOT EXISTS empresas_grupo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_grupo VARCHAR(255) NOT NULL, -- Ex: "Paradox Jeans"
  cnpj_matriz VARCHAR(18) NOT NULL, -- CNPJ principal (0001)
  observacoes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para vincular CNPJs ao grupo
CREATE TABLE IF NOT EXISTS empresas_grupo_cnpjs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id UUID NOT NULL REFERENCES empresas_grupo(id) ON DELETE CASCADE,
  cnpj VARCHAR(18) NOT NULL, -- CNPJ (sem formatação)
  tipo_entidade VARCHAR(20) NOT NULL, -- 'sacado' ou 'cedente'
  tipo_unidade VARCHAR(50) DEFAULT 'filial', -- 'matriz', 'filial', 'unidade'
  ordem INTEGER DEFAULT 0, -- Ordem de exibição
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cnpj, tipo_entidade) -- Um CNPJ só pode estar em um grupo
);

-- Adicionar campo opcional nas tabelas existentes
ALTER TABLE sacados ADD COLUMN IF NOT EXISTS grupo_empresa_id UUID REFERENCES empresas_grupo(id);
ALTER TABLE cedentes ADD COLUMN IF NOT EXISTS grupo_empresa_id UUID REFERENCES empresas_grupo(id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_empresas_grupo_cnpj_matriz ON empresas_grupo(cnpj_matriz);
CREATE INDEX IF NOT EXISTS idx_empresas_grupo_user_id ON empresas_grupo(user_id);
CREATE INDEX IF NOT EXISTS idx_empresas_grupo_cnpjs_grupo ON empresas_grupo_cnpjs(grupo_id);
CREATE INDEX IF NOT EXISTS idx_empresas_grupo_cnpjs_cnpj ON empresas_grupo_cnpjs(cnpj, tipo_entidade);
CREATE INDEX IF NOT EXISTS idx_sacados_grupo_empresa ON sacados(grupo_empresa_id);
CREATE INDEX IF NOT EXISTS idx_cedentes_grupo_empresa ON cedentes(grupo_empresa_id);

-- RLS (Row Level Security)
ALTER TABLE empresas_grupo ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas_grupo_cnpjs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para empresas_grupo
DROP POLICY IF EXISTS "Users can view own empresas_grupo" ON empresas_grupo;
DROP POLICY IF EXISTS "Users can insert own empresas_grupo" ON empresas_grupo;
DROP POLICY IF EXISTS "Users can update own empresas_grupo" ON empresas_grupo;
DROP POLICY IF EXISTS "Users can delete own empresas_grupo" ON empresas_grupo;

CREATE POLICY "Users can view own empresas_grupo" ON empresas_grupo FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own empresas_grupo" ON empresas_grupo FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own empresas_grupo" ON empresas_grupo FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own empresas_grupo" ON empresas_grupo FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para empresas_grupo_cnpjs
DROP POLICY IF EXISTS "Users can view own empresas_grupo_cnpjs" ON empresas_grupo_cnpjs;
DROP POLICY IF EXISTS "Users can insert own empresas_grupo_cnpjs" ON empresas_grupo_cnpjs;
DROP POLICY IF EXISTS "Users can update own empresas_grupo_cnpjs" ON empresas_grupo_cnpjs;
DROP POLICY IF EXISTS "Users can delete own empresas_grupo_cnpjs" ON empresas_grupo_cnpjs;

CREATE POLICY "Users can view own empresas_grupo_cnpjs" ON empresas_grupo_cnpjs FOR SELECT USING (
  EXISTS (SELECT 1 FROM empresas_grupo WHERE empresas_grupo.id = empresas_grupo_cnpjs.grupo_id AND empresas_grupo.user_id = auth.uid())
);
CREATE POLICY "Users can insert own empresas_grupo_cnpjs" ON empresas_grupo_cnpjs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM empresas_grupo WHERE empresas_grupo.id = empresas_grupo_cnpjs.grupo_id AND empresas_grupo.user_id = auth.uid())
);
CREATE POLICY "Users can update own empresas_grupo_cnpjs" ON empresas_grupo_cnpjs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM empresas_grupo WHERE empresas_grupo.id = empresas_grupo_cnpjs.grupo_id AND empresas_grupo.user_id = auth.uid())
);
CREATE POLICY "Users can delete own empresas_grupo_cnpjs" ON empresas_grupo_cnpjs FOR DELETE USING (
  EXISTS (SELECT 1 FROM empresas_grupo WHERE empresas_grupo.id = empresas_grupo_cnpjs.grupo_id AND empresas_grupo.user_id = auth.uid())
);

-- Comentários
COMMENT ON TABLE empresas_grupo IS 'Grupos de empresas (múltiplos CNPJs da mesma empresa)';
COMMENT ON TABLE empresas_grupo_cnpjs IS 'CNPJs vinculados a um grupo de empresas';
COMMENT ON COLUMN empresas_grupo_cnpjs.tipo_entidade IS 'Tipo da entidade: sacado ou cedente';
COMMENT ON COLUMN empresas_grupo_cnpjs.tipo_unidade IS 'Tipo da unidade: matriz, filial ou unidade';

-- Notificar PostgREST para recarregar schema
NOTIFY pgrst, 'reload schema';

