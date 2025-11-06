-- Script para criar tabelas de dados complementares dos CEDENTES
-- Execute este script no Supabase SQL Editor

-- Tabela de QSA (Quadro de Sócios e Administradores) - Cedentes
CREATE TABLE IF NOT EXISTS cedentes_qsa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedente_id UUID NOT NULL REFERENCES cedentes(id) ON DELETE CASCADE,
  cpf VARCHAR(14),
  nome VARCHAR(255) NOT NULL,
  qualificacao VARCHAR(255),
  participacao DECIMAL(5,2),
  data_entrada DATE,
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de endereços múltiplos - Cedentes
CREATE TABLE IF NOT EXISTS cedentes_enderecos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedente_id UUID NOT NULL REFERENCES cedentes(id) ON DELETE CASCADE,
  endereco TEXT NOT NULL,
  tipo VARCHAR(50),
  cep VARCHAR(10),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  principal BOOLEAN DEFAULT false,
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de telefones múltiplos - Cedentes
CREATE TABLE IF NOT EXISTS cedentes_telefones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedente_id UUID NOT NULL REFERENCES cedentes(id) ON DELETE CASCADE,
  telefone VARCHAR(20) NOT NULL,
  tipo VARCHAR(50),
  nome_contato VARCHAR(255),
  principal BOOLEAN DEFAULT false,
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de e-mails múltiplos - Cedentes
CREATE TABLE IF NOT EXISTS cedentes_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedente_id UUID NOT NULL REFERENCES cedentes(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  tipo VARCHAR(50),
  nome_contato VARCHAR(255),
  principal BOOLEAN DEFAULT false,
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pessoas ligadas / familiares - Cedentes
CREATE TABLE IF NOT EXISTS cedentes_pessoas_ligadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedente_id UUID NOT NULL REFERENCES cedentes(id) ON DELETE CASCADE,
  cpf VARCHAR(14),
  nome VARCHAR(255) NOT NULL,
  tipo_relacionamento VARCHAR(100), -- 'pai', 'mae', 'conjuge', 'filho', 'filha', 'irmao', 'irma', 'avô', 'avó', 'neto', 'neta', 'socio', 'administrador', 'outro'
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

-- Tabela de empresas ligadas - Cedentes
CREATE TABLE IF NOT EXISTS cedentes_empresas_ligadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedente_id UUID NOT NULL REFERENCES cedentes(id) ON DELETE CASCADE,
  cnpj_relacionado VARCHAR(18) NOT NULL,
  razao_social VARCHAR(255) NOT NULL,
  tipo_relacionamento VARCHAR(100),
  participacao DECIMAL(5,2),
  observacoes TEXT,
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cedentes_qsa_cedente_id ON cedentes_qsa(cedente_id);
CREATE INDEX IF NOT EXISTS idx_cedentes_enderecos_cedente_id ON cedentes_enderecos(cedente_id);
CREATE INDEX IF NOT EXISTS idx_cedentes_telefones_cedente_id ON cedentes_telefones(cedente_id);
CREATE INDEX IF NOT EXISTS idx_cedentes_emails_cedente_id ON cedentes_emails(cedente_id);
CREATE INDEX IF NOT EXISTS idx_cedentes_pessoas_ligadas_cedente_id ON cedentes_pessoas_ligadas(cedente_id);
CREATE INDEX IF NOT EXISTS idx_cedentes_empresas_ligadas_cedente_id ON cedentes_empresas_ligadas(cedente_id);

-- Constraints anti-duplicata
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_cedente_qsa 
ON cedentes_qsa(cedente_id, cpf, qualificacao) 
WHERE ativo = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_cedente_endereco 
ON cedentes_enderecos(cedente_id, endereco, cep) 
WHERE ativo = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_cedente_telefone 
ON cedentes_telefones(cedente_id, telefone) 
WHERE ativo = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_cedente_email 
ON cedentes_emails(cedente_id, email) 
WHERE ativo = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_cedente_pessoa_ligada 
ON cedentes_pessoas_ligadas(cedente_id, cpf, tipo_relacionamento) 
WHERE ativo = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_cedente_empresa_ligada 
ON cedentes_empresas_ligadas(cedente_id, cnpj_relacionado, tipo_relacionamento) 
WHERE ativo = true;

-- RLS
ALTER TABLE cedentes_qsa ENABLE ROW LEVEL SECURITY;
ALTER TABLE cedentes_enderecos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cedentes_telefones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cedentes_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE cedentes_pessoas_ligadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cedentes_empresas_ligadas ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Usuários autenticados podem ver QSA cedentes" ON cedentes_qsa FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem inserir QSA cedentes" ON cedentes_qsa FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem atualizar QSA cedentes" ON cedentes_qsa FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem deletar QSA cedentes" ON cedentes_qsa FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ver endereços cedentes" ON cedentes_enderecos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem inserir endereços cedentes" ON cedentes_enderecos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem atualizar endereços cedentes" ON cedentes_enderecos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem deletar endereços cedentes" ON cedentes_enderecos FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ver telefones cedentes" ON cedentes_telefones FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem inserir telefones cedentes" ON cedentes_telefones FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem atualizar telefones cedentes" ON cedentes_telefones FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem deletar telefones cedentes" ON cedentes_telefones FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ver emails cedentes" ON cedentes_emails FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem inserir emails cedentes" ON cedentes_emails FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem atualizar emails cedentes" ON cedentes_emails FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem deletar emails cedentes" ON cedentes_emails FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ver pessoas ligadas cedentes" ON cedentes_pessoas_ligadas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem inserir pessoas ligadas cedentes" ON cedentes_pessoas_ligadas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem atualizar pessoas ligadas cedentes" ON cedentes_pessoas_ligadas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem deletar pessoas ligadas cedentes" ON cedentes_pessoas_ligadas FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ver empresas ligadas cedentes" ON cedentes_empresas_ligadas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem inserir empresas ligadas cedentes" ON cedentes_empresas_ligadas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem atualizar empresas ligadas cedentes" ON cedentes_empresas_ligadas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem deletar empresas ligadas cedentes" ON cedentes_empresas_ligadas FOR DELETE USING (auth.role() = 'authenticated');

