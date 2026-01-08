-- ================================================================================
-- TABELA: titulos_criticas_historico
-- ================================================================================
-- Armazena o histórico de mudanças de críticas nos títulos negociados

CREATE TABLE IF NOT EXISTS titulos_criticas_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo_id UUID NOT NULL REFERENCES titulos_negociados(id) ON DELETE CASCADE,
  critica_anterior VARCHAR(100),
  critica_nova VARCHAR(100),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_titulos_criticas_historico_titulo_id ON titulos_criticas_historico(titulo_id);
CREATE INDEX IF NOT EXISTS idx_titulos_criticas_historico_created_at ON titulos_criticas_historico(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE titulos_criticas_historico ENABLE ROW LEVEL SECURITY;

-- Remove políticas existentes se houver
DROP POLICY IF EXISTS "Usuários autenticados podem ver histórico de críticas" ON titulos_criticas_historico;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir histórico de críticas" ON titulos_criticas_historico;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar histórico de críticas" ON titulos_criticas_historico;

-- Política: usuários autenticados podem ver o histórico
CREATE POLICY "Usuários autenticados podem ver histórico de críticas"
  ON titulos_criticas_historico
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: usuários autenticados podem inserir histórico
CREATE POLICY "Usuários autenticados podem inserir histórico de críticas"
  ON titulos_criticas_historico
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política: usuários autenticados podem deletar histórico
-- Permite deletar qualquer registro do histórico (sem restrição de user_id)
CREATE POLICY "Usuários autenticados podem deletar histórico de críticas"
  ON titulos_criticas_historico
  FOR DELETE
  TO authenticated
  USING (true);

-- Trigger para registrar automaticamente mudanças de crítica
CREATE OR REPLACE FUNCTION registrar_historico_critica()
RETURNS TRIGGER AS $$
BEGIN
  -- Só registra se a crítica realmente mudou
  IF OLD.critica IS DISTINCT FROM NEW.critica THEN
    -- Verifica se já existe um registro idêntico recente (últimos 5 segundos) para evitar duplicatas
    IF NOT EXISTS (
      SELECT 1 FROM titulos_criticas_historico
      WHERE titulo_id = NEW.id
        AND critica_anterior IS NOT DISTINCT FROM OLD.critica
        AND critica_nova IS NOT DISTINCT FROM NEW.critica
        AND created_at > NOW() - INTERVAL '5 seconds'
    ) THEN
      INSERT INTO titulos_criticas_historico (
        titulo_id,
        critica_anterior,
        critica_nova,
        user_id
      ) VALUES (
        NEW.id,
        OLD.critica,
        NEW.critica,
        COALESCE(NEW.user_id, auth.uid())
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove trigger existente se houver
DROP TRIGGER IF EXISTS trigger_registrar_historico_critica ON titulos_negociados;

-- Cria o trigger
CREATE TRIGGER trigger_registrar_historico_critica
  AFTER UPDATE ON titulos_negociados
  FOR EACH ROW
  WHEN (OLD.critica IS DISTINCT FROM NEW.critica)
  EXECUTE FUNCTION registrar_historico_critica();

COMMENT ON TABLE titulos_criticas_historico IS 'Histórico de mudanças de críticas nos títulos negociados';
COMMENT ON COLUMN titulos_criticas_historico.critica_anterior IS 'Crítica anterior (NULL se não havia crítica)';
COMMENT ON COLUMN titulos_criticas_historico.critica_nova IS 'Nova crítica (NULL se foi removida)';
COMMENT ON COLUMN titulos_criticas_historico.user_id IS 'Usuário que fez a alteração';

