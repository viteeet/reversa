-- Tabela para armazenar histórico de consultas à API BigData
-- Impede consultas duplicadas do mesmo documento (CNPJ/CPF) em 24 horas

CREATE TABLE IF NOT EXISTS bigdata_consultas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento TEXT NOT NULL, -- CNPJ ou CPF (apenas números, sem formatação)
  tipo TEXT NOT NULL, -- Tipo de consulta: 'basico', 'qsa', 'enderecos', 'telefones', 'emails', 'processos', 'pessoa_fisica'
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data_consulta TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índice para busca rápida por documento e tipo
CREATE INDEX IF NOT EXISTS idx_bigdata_consultas_documento_tipo 
ON bigdata_consultas(documento, tipo, data_consulta DESC);

-- Índice para busca por usuário
CREATE INDEX IF NOT EXISTS idx_bigdata_consultas_user_id 
ON bigdata_consultas(user_id, data_consulta DESC);

-- Função para limpar consultas antigas (mais de 7 dias)
-- Pode ser executada periodicamente via cron job
CREATE OR REPLACE FUNCTION limpar_consultas_antigas_bigdata()
RETURNS void AS $$
BEGIN
  DELETE FROM bigdata_consultas 
  WHERE data_consulta < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE bigdata_consultas IS 'Armazena histórico de consultas à API BigData para prevenir consultas duplicadas em 24h';
COMMENT ON COLUMN bigdata_consultas.documento IS 'CNPJ ou CPF sem formatação (apenas números)';
COMMENT ON COLUMN bigdata_consultas.tipo IS 'Tipo de consulta: basico, qsa, enderecos, telefones, emails, processos, pessoa_fisica';
COMMENT ON COLUMN bigdata_consultas.data_consulta IS 'Data e hora da consulta à API BigData';
