-- ================================================================================
-- TABELA: criticas_titulos
-- ================================================================================
-- Armazena as classificações de críticas customizáveis para títulos negociados

CREATE TABLE IF NOT EXISTS criticas_titulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_criticas_titulos_ativo ON criticas_titulos(ativo);
CREATE INDEX IF NOT EXISTS idx_criticas_titulos_ordem ON criticas_titulos(ordem);

-- RLS (Row Level Security)
ALTER TABLE criticas_titulos ENABLE ROW LEVEL SECURITY;

-- Remove políticas existentes se houver
DROP POLICY IF EXISTS "Usuários autenticados podem ver críticas ativas" ON criticas_titulos;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir críticas" ON criticas_titulos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar críticas" ON criticas_titulos;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar críticas" ON criticas_titulos;

-- Política: usuários autenticados podem ver todas as críticas ativas
CREATE POLICY "Usuários autenticados podem ver críticas ativas"
  ON criticas_titulos
  FOR SELECT
  TO authenticated
  USING (ativo = true);

-- Política: usuários autenticados podem inserir críticas
CREATE POLICY "Usuários autenticados podem inserir críticas"
  ON criticas_titulos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política: usuários autenticados podem atualizar críticas
CREATE POLICY "Usuários autenticados podem atualizar críticas"
  ON criticas_titulos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política: usuários autenticados podem deletar críticas (soft delete)
CREATE POLICY "Usuários autenticados podem deletar críticas"
  ON criticas_titulos
  FOR DELETE
  TO authenticated
  USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_criticas_titulos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remove trigger existente se houver
DROP TRIGGER IF EXISTS trigger_update_criticas_titulos_updated_at ON criticas_titulos;

CREATE TRIGGER trigger_update_criticas_titulos_updated_at
  BEFORE UPDATE ON criticas_titulos
  FOR EACH ROW
  EXECUTE FUNCTION update_criticas_titulos_updated_at();

-- Inserir críticas padrão
INSERT INTO criticas_titulos (nome, descricao, ordem, ativo) VALUES
  ('Protestado', 'Título foi protestado', 1, true),
  ('Enviado a Cartório', 'Título foi enviado para cartório', 2, true),
  ('Recebido Instrumento de Protesto', 'Recebido instrumento de protesto', 3, true)
ON CONFLICT (nome) DO NOTHING;

COMMENT ON TABLE criticas_titulos IS 'Classificações de críticas customizáveis para títulos negociados';
COMMENT ON COLUMN criticas_titulos.nome IS 'Nome da crítica (ex: "Protestado", "Enviado a Cartório")';
COMMENT ON COLUMN criticas_titulos.descricao IS 'Descrição opcional da crítica';
COMMENT ON COLUMN criticas_titulos.ordem IS 'Ordem de exibição (menor número aparece primeiro)';

