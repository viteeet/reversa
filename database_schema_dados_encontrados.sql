-- Script para criar tabela de dados encontrados manualmente
-- Execute este script no Supabase SQL Editor

-- Tabela de dados encontrados (informações adicionadas manualmente pelo usuário)
CREATE TABLE IF NOT EXISTS sacados_dados_encontrados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacado_cnpj VARCHAR(18) NOT NULL REFERENCES sacados(cnpj) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'telefone', 'email', 'endereco', 'pessoa', 'empresa', 'processo', 'outros'
  titulo VARCHAR(255) NOT NULL, -- ex: "Telefone Residencial", "Email Financeiro", "Endereço da Filial"
  conteudo TEXT NOT NULL, -- o dado em si
  observacoes TEXT, -- notas adicionais
  fonte VARCHAR(255), -- 'google', 'indicacao', 'linkedin', 'site', 'outros'
  data_encontrado DATE DEFAULT CURRENT_DATE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_sacados_dados_encontrados_cnpj ON sacados_dados_encontrados(sacado_cnpj);
CREATE INDEX IF NOT EXISTS idx_sacados_dados_encontrados_tipo ON sacados_dados_encontrados(tipo);

-- RLS (Row Level Security)
ALTER TABLE sacados_dados_encontrados ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permite acesso autenticado)
CREATE POLICY "Usuários autenticados podem ver dados encontrados" 
  ON sacados_dados_encontrados FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir dados encontrados" 
  ON sacados_dados_encontrados FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar dados encontrados" 
  ON sacados_dados_encontrados FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar dados encontrados" 
  ON sacados_dados_encontrados FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Comentários da tabela
COMMENT ON TABLE sacados_dados_encontrados IS 'Armazena dados encontrados manualmente sobre sacados de fontes diversas';
COMMENT ON COLUMN sacados_dados_encontrados.tipo IS 'Categoria do dado: telefone, email, endereco, pessoa, empresa, processo, outros';
COMMENT ON COLUMN sacados_dados_encontrados.titulo IS 'Título descritivo do dado encontrado';
COMMENT ON COLUMN sacados_dados_encontrados.conteudo IS 'O dado/informação propriamente dito';
COMMENT ON COLUMN sacados_dados_encontrados.fonte IS 'Fonte de onde foi obtida a informação';
