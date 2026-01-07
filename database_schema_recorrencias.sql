-- ================================================================================
-- RECORRÊNCIAS FINANCEIRAS
-- ================================================================================
-- Execute este script no Supabase SQL Editor
-- https://supabase.com/dashboard/project/[seu-projeto]/sql

-- Tabela de recorrências financeiras
CREATE TABLE IF NOT EXISTS recorrencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  valor DECIMAL(15,2) NOT NULL,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  conta_id UUID REFERENCES contas(id) ON DELETE SET NULL,
  meio_pagamento_id UUID REFERENCES meios_pagamento(id) ON DELETE SET NULL,
  dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
  frequencia VARCHAR(20) NOT NULL CHECK (frequencia IN ('diaria', 'semanal', 'mensal', 'trimestral', 'semestral', 'anual')),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_recorrencias_user_id ON recorrencias(user_id);
CREATE INDEX IF NOT EXISTS idx_recorrencias_tipo ON recorrencias(tipo);
CREATE INDEX IF NOT EXISTS idx_recorrencias_ativo ON recorrencias(ativo);
CREATE INDEX IF NOT EXISTS idx_recorrencias_data_inicio ON recorrencias(data_inicio);
CREATE INDEX IF NOT EXISTS idx_recorrencias_categoria_id ON recorrencias(categoria_id);
CREATE INDEX IF NOT EXISTS idx_recorrencias_conta_id ON recorrencias(conta_id);

-- RLS (Row Level Security)
ALTER TABLE recorrencias ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Users can view own recorrencias" ON recorrencias;
DROP POLICY IF EXISTS "Users can insert own recorrencias" ON recorrencias;
DROP POLICY IF EXISTS "Users can update own recorrencias" ON recorrencias;
DROP POLICY IF EXISTS "Users can delete own recorrencias" ON recorrencias;

CREATE POLICY "Users can view own recorrencias" ON recorrencias FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recorrencias" ON recorrencias FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recorrencias" ON recorrencias FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recorrencias" ON recorrencias FOR DELETE USING (auth.uid() = user_id);

-- Tabela de lançamentos gerados por recorrência (opcional, para rastreamento)
CREATE TABLE IF NOT EXISTS recorrencias_lancamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recorrencia_id UUID NOT NULL REFERENCES recorrencias(id) ON DELETE CASCADE,
  lancamento_id UUID NOT NULL REFERENCES lancamentos(id) ON DELETE CASCADE,
  data_geracao DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recorrencia_id, lancamento_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_recorrencias_lancamentos_recorrencia ON recorrencias_lancamentos(recorrencia_id);
CREATE INDEX IF NOT EXISTS idx_recorrencias_lancamentos_lancamento ON recorrencias_lancamentos(lancamento_id);

-- RLS para recorrencias_lancamentos
ALTER TABLE recorrencias_lancamentos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para recorrencias_lancamentos
DROP POLICY IF EXISTS "Users can view own recorrencias_lancamentos" ON recorrencias_lancamentos;
DROP POLICY IF EXISTS "Users can insert own recorrencias_lancamentos" ON recorrencias_lancamentos;
DROP POLICY IF EXISTS "Users can delete own recorrencias_lancamentos" ON recorrencias_lancamentos;

CREATE POLICY "Users can view own recorrencias_lancamentos" ON recorrencias_lancamentos FOR SELECT USING (
  EXISTS (SELECT 1 FROM recorrencias WHERE recorrencias.id = recorrencias_lancamentos.recorrencia_id AND recorrencias.user_id = auth.uid())
);
CREATE POLICY "Users can insert own recorrencias_lancamentos" ON recorrencias_lancamentos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM recorrencias WHERE recorrencias.id = recorrencias_lancamentos.recorrencia_id AND recorrencias.user_id = auth.uid())
);
CREATE POLICY "Users can delete own recorrencias_lancamentos" ON recorrencias_lancamentos FOR DELETE USING (
  EXISTS (SELECT 1 FROM recorrencias WHERE recorrencias.id = recorrencias_lancamentos.recorrencia_id AND recorrencias.user_id = auth.uid())
);

-- Comentários
COMMENT ON TABLE recorrencias IS 'Recorrências financeiras (receitas e despesas recorrentes)';
COMMENT ON TABLE recorrencias_lancamentos IS 'Rastreamento de lançamentos gerados por recorrências';

-- Notificar PostgREST para recarregar schema
NOTIFY pgrst, 'reload schema';

-- ================================================================================
-- VERIFICAÇÃO
-- ================================================================================

-- Verificar se a tabela foi criada
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'recorrencias'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'recorrencias'
ORDER BY policyname;

