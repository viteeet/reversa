-- ================================================================================
-- VINCULAÇÕES DE PESSOAS FÍSICAS COM CEDENTES E SACADOS
-- ================================================================================
-- Execute este script no Supabase SQL Editor

-- Tabela de vinculação de pessoas físicas com cedentes
CREATE TABLE IF NOT EXISTS pessoas_fisicas_cedentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID NOT NULL REFERENCES pessoas_fisicas(id) ON DELETE CASCADE,
  cedente_id UUID NOT NULL REFERENCES cedentes(id) ON DELETE CASCADE,
  tipo_relacionamento VARCHAR(100), -- 'socio', 'administrador', 'funcionario', 'contato', 'representante', 'outro'
  cargo VARCHAR(255), -- cargo/função no cedente
  data_inicio DATE,
  data_fim DATE,
  observacoes TEXT,
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pessoa_id, cedente_id)
);

-- Tabela de vinculação de pessoas físicas com sacados
CREATE TABLE IF NOT EXISTS pessoas_fisicas_sacados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID NOT NULL REFERENCES pessoas_fisicas(id) ON DELETE CASCADE,
  sacado_cnpj VARCHAR(18) NOT NULL REFERENCES sacados(cnpj) ON DELETE CASCADE,
  tipo_relacionamento VARCHAR(100), -- 'socio', 'administrador', 'funcionario', 'contato', 'representante', 'outro'
  cargo VARCHAR(255), -- cargo/função no sacado
  data_inicio DATE,
  data_fim DATE,
  observacoes TEXT,
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pessoa_id, sacado_cnpj)
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_pessoas_fisicas_cedentes_pessoa ON pessoas_fisicas_cedentes(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_pessoas_fisicas_cedentes_cedente ON pessoas_fisicas_cedentes(cedente_id);
CREATE INDEX IF NOT EXISTS idx_pessoas_fisicas_sacados_pessoa ON pessoas_fisicas_sacados(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_pessoas_fisicas_sacados_sacado ON pessoas_fisicas_sacados(sacado_cnpj);

-- RLS (Row Level Security)
ALTER TABLE pessoas_fisicas_cedentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pessoas_fisicas_sacados ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pessoas_fisicas_cedentes
DROP POLICY IF EXISTS "Users can view own pessoas_fisicas_cedentes" ON pessoas_fisicas_cedentes;
DROP POLICY IF EXISTS "Users can insert own pessoas_fisicas_cedentes" ON pessoas_fisicas_cedentes;
DROP POLICY IF EXISTS "Users can update own pessoas_fisicas_cedentes" ON pessoas_fisicas_cedentes;
DROP POLICY IF EXISTS "Users can delete own pessoas_fisicas_cedentes" ON pessoas_fisicas_cedentes;

CREATE POLICY "Users can view own pessoas_fisicas_cedentes" ON pessoas_fisicas_cedentes FOR SELECT USING (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_cedentes.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);

CREATE POLICY "Users can insert own pessoas_fisicas_cedentes" ON pessoas_fisicas_cedentes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_cedentes.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);

CREATE POLICY "Users can update own pessoas_fisicas_cedentes" ON pessoas_fisicas_cedentes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_cedentes.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);

CREATE POLICY "Users can delete own pessoas_fisicas_cedentes" ON pessoas_fisicas_cedentes FOR DELETE USING (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_cedentes.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);

-- Políticas RLS para pessoas_fisicas_sacados
DROP POLICY IF EXISTS "Users can view own pessoas_fisicas_sacados" ON pessoas_fisicas_sacados;
DROP POLICY IF EXISTS "Users can insert own pessoas_fisicas_sacados" ON pessoas_fisicas_sacados;
DROP POLICY IF EXISTS "Users can update own pessoas_fisicas_sacados" ON pessoas_fisicas_sacados;
DROP POLICY IF EXISTS "Users can delete own pessoas_fisicas_sacados" ON pessoas_fisicas_sacados;

CREATE POLICY "Users can view own pessoas_fisicas_sacados" ON pessoas_fisicas_sacados FOR SELECT USING (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_sacados.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);

CREATE POLICY "Users can insert own pessoas_fisicas_sacados" ON pessoas_fisicas_sacados FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_sacados.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);

CREATE POLICY "Users can update own pessoas_fisicas_sacados" ON pessoas_fisicas_sacados FOR UPDATE USING (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_sacados.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);

CREATE POLICY "Users can delete own pessoas_fisicas_sacados" ON pessoas_fisicas_sacados FOR DELETE USING (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_sacados.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);

-- Comentários
COMMENT ON TABLE pessoas_fisicas_cedentes IS 'Vinculação de pessoas físicas com cedentes';
COMMENT ON TABLE pessoas_fisicas_sacados IS 'Vinculação de pessoas físicas com sacados';

-- Notificar PostgREST para recarregar schema
NOTIFY pgrst, 'reload schema';

