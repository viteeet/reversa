-- ================================================================================
-- DADOS ENCONTRADOS PARA CEDENTES
-- ================================================================================
-- Script para criar tabela de dados encontrados manualmente para CEDENTES
-- Execute este script no Supabase SQL Editor

-- Tabela de dados encontrados (informações adicionadas manualmente sobre cedentes)
CREATE TABLE IF NOT EXISTS cedentes_dados_encontrados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedente_id UUID NOT NULL REFERENCES cedentes(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'telefone', 'email', 'endereco', 'pessoa', 'empresa', 'processo', 'outros'
  titulo VARCHAR(255) NOT NULL, -- ex: "Telefone Contato Comercial", "Email do Responsável"
  conteudo TEXT NOT NULL, -- o dado em si
  observacoes TEXT, -- notas adicionais
  fonte VARCHAR(255), -- 'google', 'indicacao', 'linkedin', 'site', 'outros'
  data_encontrado DATE DEFAULT CURRENT_DATE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_cedentes_dados_encontrados_cedente_id ON cedentes_dados_encontrados(cedente_id);
CREATE INDEX IF NOT EXISTS idx_cedentes_dados_encontrados_tipo ON cedentes_dados_encontrados(tipo);

-- RLS (Row Level Security)
ALTER TABLE cedentes_dados_encontrados ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permite acesso autenticado)
CREATE POLICY "Usuários autenticados podem ver dados encontrados de cedentes" 
  ON cedentes_dados_encontrados FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir dados encontrados de cedentes" 
  ON cedentes_dados_encontrados FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar dados encontrados de cedentes" 
  ON cedentes_dados_encontrados FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar dados encontrados de cedentes" 
  ON cedentes_dados_encontrados FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Comentários da tabela
COMMENT ON TABLE cedentes_dados_encontrados IS 'Armazena dados encontrados manualmente sobre cedentes de fontes diversas';
COMMENT ON COLUMN cedentes_dados_encontrados.tipo IS 'Categoria do dado: telefone, email, endereco, pessoa, empresa, processo, outros';
COMMENT ON COLUMN cedentes_dados_encontrados.titulo IS 'Título descritivo do dado encontrado';
COMMENT ON COLUMN cedentes_dados_encontrados.conteudo IS 'O dado/informação propriamente dito';
COMMENT ON COLUMN cedentes_dados_encontrados.fonte IS 'Fonte de onde foi obtida a informação';

-- ================================================================================
-- VERIFICAÇÃO
-- ================================================================================

-- Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cedentes_dados_encontrados';

-- Verificar índices
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'cedentes_dados_encontrados';
