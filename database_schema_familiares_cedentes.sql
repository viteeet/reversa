-- Script para criar tabela de FAMILIARES dos CEDENTES
-- Execute este script no Supabase SQL Editor

-- Tabela de familiares - Cedentes
CREATE TABLE IF NOT EXISTS cedentes_familiares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedente_id UUID NOT NULL REFERENCES cedentes(id) ON DELETE CASCADE,
  cpf VARCHAR(14) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  parentesco VARCHAR(50), -- 'pai', 'mae', 'conjuge', 'filho', 'filha', 'irmao', 'irma', 'avô', 'avó', 'neto', 'neta', 'outro'
  telefone VARCHAR(20),
  email VARCHAR(255),
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  observacoes TEXT,
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_cedentes_familiares_cedente_id ON cedentes_familiares(cedente_id);
CREATE INDEX IF NOT EXISTS idx_cedentes_familiares_cpf ON cedentes_familiares(cpf);

-- Constraint anti-duplicata
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_cedente_familiar 
ON cedentes_familiares(cedente_id, cpf, parentesco) 
WHERE ativo = true;

-- RLS (Row Level Security)
ALTER TABLE cedentes_familiares ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Usuários autenticados podem ver familiares cedentes" 
ON cedentes_familiares FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir familiares cedentes" 
ON cedentes_familiares FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar familiares cedentes" 
ON cedentes_familiares FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar familiares cedentes" 
ON cedentes_familiares FOR DELETE 
USING (auth.role() = 'authenticated');

