-- ================================================================================
-- SCRIPT DE CORREÇÃO DO SUPABASE - Execute apenas se a verificação mostrar problemas
-- ================================================================================
-- Execute este script no Supabase SQL Editor APENAS se o script de verificação
-- identificar problemas. Este script cria/corrige tudo automaticamente.

-- ================================================================================
-- 1. GARANTIR QUE TABELA SACADOS TEM TODAS AS COLUNAS NECESSÁRIAS
-- ================================================================================

DO $$ 
BEGIN
  -- Adiciona colunas se não existirem
  ALTER TABLE sacados ADD COLUMN IF NOT EXISTS endereco_receita TEXT;
  ALTER TABLE sacados ADD COLUMN IF NOT EXISTS telefone_receita TEXT;
  ALTER TABLE sacados ADD COLUMN IF NOT EXISTS email_receita TEXT;
  ALTER TABLE sacados ADD COLUMN IF NOT EXISTS situacao TEXT;
  ALTER TABLE sacados ADD COLUMN IF NOT EXISTS data_abertura DATE;
  ALTER TABLE sacados ADD COLUMN IF NOT EXISTS capital_social DECIMAL(15,2);
  ALTER TABLE sacados ADD COLUMN IF NOT EXISTS atividade_principal_codigo TEXT;
  ALTER TABLE sacados ADD COLUMN IF NOT EXISTS atividade_principal_descricao TEXT;
  ALTER TABLE sacados ADD COLUMN IF NOT EXISTS atividades_secundarias TEXT;
  ALTER TABLE sacados ADD COLUMN IF NOT EXISTS simples_nacional BOOLEAN;
  ALTER TABLE sacados ADD COLUMN IF NOT EXISTS porte TEXT;
  ALTER TABLE sacados ADD COLUMN IF NOT EXISTS natureza_juridica TEXT;
  ALTER TABLE sacados ADD COLUMN IF NOT EXISTS ultima_atualizacao TIMESTAMP WITH TIME ZONE;
END $$;

-- ================================================================================
-- 2. GARANTIR QUE PESSOAS LIGADAS (SACADOS) TEM TODOS OS CAMPOS
-- ================================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sacados_pessoas_ligadas' AND column_name = 'telefone'
  ) THEN
    ALTER TABLE sacados_pessoas_ligadas ADD COLUMN telefone VARCHAR(20);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sacados_pessoas_ligadas' AND column_name = 'email'
  ) THEN
    ALTER TABLE sacados_pessoas_ligadas ADD COLUMN email VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sacados_pessoas_ligadas' AND column_name = 'endereco'
  ) THEN
    ALTER TABLE sacados_pessoas_ligadas ADD COLUMN endereco TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sacados_pessoas_ligadas' AND column_name = 'cidade'
  ) THEN
    ALTER TABLE sacados_pessoas_ligadas ADD COLUMN cidade VARCHAR(100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sacados_pessoas_ligadas' AND column_name = 'estado'
  ) THEN
    ALTER TABLE sacados_pessoas_ligadas ADD COLUMN estado VARCHAR(2);
  END IF;
END $$;

-- ================================================================================
-- 3. GARANTIR QUE OBSERVAÇÕES GERAIS TEM CAMPO processos_texto
-- ================================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sacados_observacoes_gerais' AND column_name = 'processos_texto'
  ) THEN
    ALTER TABLE sacados_observacoes_gerais ADD COLUMN processos_texto TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cedentes_observacoes_gerais' AND column_name = 'processos_texto'
  ) THEN
    ALTER TABLE cedentes_observacoes_gerais ADD COLUMN processos_texto TEXT;
  END IF;
END $$;

-- ================================================================================
-- 4. GARANTIR QUE TABELAS QSA_DETALHES EXISTEM
-- ================================================================================

-- Detalhes completos de cada pessoa do QSA - SACADOS
CREATE TABLE IF NOT EXISTS sacados_qsa_detalhes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qsa_id UUID NOT NULL REFERENCES sacados_qsa(id) ON DELETE CASCADE UNIQUE,
  sacado_cnpj VARCHAR(18) NOT NULL REFERENCES sacados(cnpj) ON DELETE CASCADE,
  detalhes_completos TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detalhes completos de cada pessoa do QSA - CEDENTES
CREATE TABLE IF NOT EXISTS cedentes_qsa_detalhes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qsa_id UUID NOT NULL REFERENCES cedentes_qsa(id) ON DELETE CASCADE UNIQUE,
  cedente_id UUID NOT NULL REFERENCES cedentes(id) ON DELETE CASCADE,
  detalhes_completos TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================================
-- 5. GARANTIR QUE TABELA OBSERVAÇÕES GERAIS EXISTE (SACADOS)
-- ================================================================================

CREATE TABLE IF NOT EXISTS sacados_observacoes_gerais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacado_cnpj VARCHAR(18) NOT NULL REFERENCES sacados(cnpj) ON DELETE CASCADE UNIQUE,
  observacoes TEXT NOT NULL DEFAULT '',
  processos_texto TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================================
-- 6. GARANTIR QUE TABELA OBSERVAÇÕES GERAIS EXISTE (CEDENTES)
-- ================================================================================

CREATE TABLE IF NOT EXISTS cedentes_observacoes_gerais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedente_id UUID NOT NULL REFERENCES cedentes(id) ON DELETE CASCADE UNIQUE,
  observacoes TEXT NOT NULL DEFAULT '',
  processos_texto TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================================
-- 7. GARANTIR ÍNDICES NECESSÁRIOS
-- ================================================================================

CREATE INDEX IF NOT EXISTS idx_sacados_qsa_detalhes_qsa_id ON sacados_qsa_detalhes(qsa_id);
CREATE INDEX IF NOT EXISTS idx_sacados_qsa_detalhes_cnpj ON sacados_qsa_detalhes(sacado_cnpj);
CREATE INDEX IF NOT EXISTS idx_cedentes_qsa_detalhes_qsa_id ON cedentes_qsa_detalhes(qsa_id);
CREATE INDEX IF NOT EXISTS idx_cedentes_qsa_detalhes_cedente_id ON cedentes_qsa_detalhes(cedente_id);
CREATE INDEX IF NOT EXISTS idx_sacados_obs_cnpj ON sacados_observacoes_gerais(sacado_cnpj);
CREATE INDEX IF NOT EXISTS idx_cedentes_obs_cedente ON cedentes_observacoes_gerais(cedente_id);
CREATE INDEX IF NOT EXISTS idx_sacados_pessoas_ligadas_telefone ON sacados_pessoas_ligadas(telefone);
CREATE INDEX IF NOT EXISTS idx_sacados_pessoas_ligadas_email ON sacados_pessoas_ligadas(email);

-- ================================================================================
-- 8. GARANTIR QUE RLS ESTÁ HABILITADO
-- ================================================================================

ALTER TABLE sacados_qsa_detalhes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cedentes_qsa_detalhes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sacados_observacoes_gerais ENABLE ROW LEVEL SECURITY;
ALTER TABLE cedentes_observacoes_gerais ENABLE ROW LEVEL SECURITY;

-- ================================================================================
-- 9. GARANTIR POLÍTICAS RLS - SACADOS QSA DETALHES
-- ================================================================================

DO $$ 
BEGIN
  -- Verifica e cria políticas se não existirem
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sacados_qsa_detalhes' 
    AND policyname = 'Usuarios autenticados podem ver detalhes QSA sacados'
  ) THEN
    CREATE POLICY "Usuarios autenticados podem ver detalhes QSA sacados"
    ON sacados_qsa_detalhes FOR SELECT
    USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sacados_qsa_detalhes' 
    AND policyname = 'Usuarios autenticados podem inserir detalhes QSA sacados'
  ) THEN
    CREATE POLICY "Usuarios autenticados podem inserir detalhes QSA sacados"
    ON sacados_qsa_detalhes FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sacados_qsa_detalhes' 
    AND policyname = 'Usuarios autenticados podem atualizar detalhes QSA sacados'
  ) THEN
    CREATE POLICY "Usuarios autenticados podem atualizar detalhes QSA sacados"
    ON sacados_qsa_detalhes FOR UPDATE
    USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sacados_qsa_detalhes' 
    AND policyname = 'Usuarios autenticados podem deletar detalhes QSA sacados'
  ) THEN
    CREATE POLICY "Usuarios autenticados podem deletar detalhes QSA sacados"
    ON sacados_qsa_detalhes FOR DELETE
    USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- ================================================================================
-- 10. GARANTIR POLÍTICAS RLS - CEDENTES QSA DETALHES
-- ================================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cedentes_qsa_detalhes' 
    AND policyname = 'Usuarios autenticados podem ver detalhes QSA cedentes'
  ) THEN
    CREATE POLICY "Usuarios autenticados podem ver detalhes QSA cedentes"
    ON cedentes_qsa_detalhes FOR SELECT
    USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cedentes_qsa_detalhes' 
    AND policyname = 'Usuarios autenticados podem inserir detalhes QSA cedentes'
  ) THEN
    CREATE POLICY "Usuarios autenticados podem inserir detalhes QSA cedentes"
    ON cedentes_qsa_detalhes FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cedentes_qsa_detalhes' 
    AND policyname = 'Usuarios autenticados podem atualizar detalhes QSA cedentes'
  ) THEN
    CREATE POLICY "Usuarios autenticados podem atualizar detalhes QSA cedentes"
    ON cedentes_qsa_detalhes FOR UPDATE
    USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cedentes_qsa_detalhes' 
    AND policyname = 'Usuarios autenticados podem deletar detalhes QSA cedentes'
  ) THEN
    CREATE POLICY "Usuarios autenticados podem deletar detalhes QSA cedentes"
    ON cedentes_qsa_detalhes FOR DELETE
    USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- ================================================================================
-- 11. GARANTIR POLÍTICAS RLS - OBSERVAÇÕES GERAIS
-- ================================================================================

DO $$ 
BEGIN
  -- Sacados Observações Gerais
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sacados_observacoes_gerais' 
    AND policyname = 'Usuarios autenticados podem ver observacoes gerais sacados'
  ) THEN
    CREATE POLICY "Usuarios autenticados podem ver observacoes gerais sacados"
    ON sacados_observacoes_gerais FOR SELECT
    USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sacados_observacoes_gerais' 
    AND policyname = 'Usuarios autenticados podem inserir observacoes gerais sacados'
  ) THEN
    CREATE POLICY "Usuarios autenticados podem inserir observacoes gerais sacados"
    ON sacados_observacoes_gerais FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sacados_observacoes_gerais' 
    AND policyname = 'Usuarios autenticados podem atualizar observacoes gerais sacados'
  ) THEN
    CREATE POLICY "Usuarios autenticados podem atualizar observacoes gerais sacados"
    ON sacados_observacoes_gerais FOR UPDATE
    USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sacados_observacoes_gerais' 
    AND policyname = 'Usuarios autenticados podem deletar observacoes gerais sacados'
  ) THEN
    CREATE POLICY "Usuarios autenticados podem deletar observacoes gerais sacados"
    ON sacados_observacoes_gerais FOR DELETE
    USING (auth.role() = 'authenticated');
  END IF;

  -- Cedentes Observações Gerais
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cedentes_observacoes_gerais' 
    AND policyname = 'Usuarios autenticados podem ver observacoes gerais cedentes'
  ) THEN
    CREATE POLICY "Usuarios autenticados podem ver observacoes gerais cedentes"
    ON cedentes_observacoes_gerais FOR SELECT
    USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cedentes_observacoes_gerais' 
    AND policyname = 'Usuarios autenticados podem inserir observacoes gerais cedentes'
  ) THEN
    CREATE POLICY "Usuarios autenticados podem inserir observacoes gerais cedentes"
    ON cedentes_observacoes_gerais FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cedentes_observacoes_gerais' 
    AND policyname = 'Usuarios autenticados podem atualizar observacoes gerais cedentes'
  ) THEN
    CREATE POLICY "Usuarios autenticados podem atualizar observacoes gerais cedentes"
    ON cedentes_observacoes_gerais FOR UPDATE
    USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cedentes_observacoes_gerais' 
    AND policyname = 'Usuarios autenticados podem deletar observacoes gerais cedentes'
  ) THEN
    CREATE POLICY "Usuarios autenticados podem deletar observacoes gerais cedentes"
    ON cedentes_observacoes_gerais FOR DELETE
    USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- ================================================================================
-- 12. COMENTÁRIOS NAS COLUNAS
-- ================================================================================

COMMENT ON COLUMN sacados_observacoes_gerais.processos_texto IS 'Campo de texto livre para colar todas as informações de processos judiciais e informações relevantes';
COMMENT ON COLUMN cedentes_observacoes_gerais.processos_texto IS 'Campo de texto livre para colar todas as informações de processos judiciais e informações relevantes';
COMMENT ON TABLE sacados_qsa_detalhes IS 'Detalhes completos de investigação de cada pessoa do QSA (endereços, telefones, emails, familiares, processos, etc)';
COMMENT ON TABLE cedentes_qsa_detalhes IS 'Detalhes completos de investigação de cada pessoa do QSA (endereços, telefones, emails, familiares, processos, etc)';
COMMENT ON COLUMN sacados_pessoas_ligadas.telefone IS 'Telefone de contato da pessoa ligada';
COMMENT ON COLUMN sacados_pessoas_ligadas.email IS 'E-mail de contato da pessoa ligada';
COMMENT ON COLUMN sacados_pessoas_ligadas.endereco IS 'Endereço completo da pessoa ligada';
COMMENT ON COLUMN sacados_pessoas_ligadas.cidade IS 'Cidade do endereço';
COMMENT ON COLUMN sacados_pessoas_ligadas.estado IS 'Estado (UF) do endereço';

-- ================================================================================
-- 13. RECARREGAR CACHE DO POSTGREST (IMPORTANTE!)
-- ================================================================================
-- Isso força o PostgREST a reconhecer as mudanças no schema imediatamente
NOTIFY pgrst, 'reload schema';

-- ================================================================================
-- FIM DO SCRIPT DE CORREÇÃO
-- ================================================================================
-- Após executar este script, execute novamente o script de verificação
-- para confirmar que tudo está OK

