-- Script para criar tabelas de dados complementares dos sacados
-- Execute este script no Supabase SQL Editor

-- Tabela de QSA (Quadro de Sócios e Administradores)
CREATE TABLE IF NOT EXISTS sacados_qsa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacado_cnpj VARCHAR(18) NOT NULL REFERENCES sacados(cnpj) ON DELETE CASCADE,
  cpf VARCHAR(14),
  nome VARCHAR(255) NOT NULL,
  qualificacao VARCHAR(255),
  participacao DECIMAL(5,2), -- percentual de participação
  data_entrada DATE,
  origem VARCHAR(50) DEFAULT 'manual', -- 'api' ou 'manual'
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de endereços múltiplos
CREATE TABLE IF NOT EXISTS sacados_enderecos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacado_cnpj VARCHAR(18) NOT NULL REFERENCES sacados(cnpj) ON DELETE CASCADE,
  endereco TEXT NOT NULL,
  tipo VARCHAR(50), -- 'residencial', 'comercial', 'correspondencia'
  cep VARCHAR(10),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  principal BOOLEAN DEFAULT false,
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de telefones múltiplos
CREATE TABLE IF NOT EXISTS sacados_telefones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacado_cnpj VARCHAR(18) NOT NULL REFERENCES sacados(cnpj) ON DELETE CASCADE,
  telefone VARCHAR(20) NOT NULL,
  tipo VARCHAR(50), -- 'celular', 'fixo', 'comercial'
  nome_contato VARCHAR(255),
  principal BOOLEAN DEFAULT false,
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de e-mails múltiplos
CREATE TABLE IF NOT EXISTS sacados_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacado_cnpj VARCHAR(18) NOT NULL REFERENCES sacados(cnpj) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  tipo VARCHAR(50), -- 'pessoal', 'comercial', 'financeiro'
  nome_contato VARCHAR(255),
  principal BOOLEAN DEFAULT false,
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pessoas ligadas (parentes, sócios, etc)
CREATE TABLE IF NOT EXISTS sacados_pessoas_ligadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacado_cnpj VARCHAR(18) NOT NULL REFERENCES sacados(cnpj) ON DELETE CASCADE,
  cpf VARCHAR(14),
  nome VARCHAR(255) NOT NULL,
  tipo_relacionamento VARCHAR(100), -- 'pai', 'mae', 'conjuge', 'socio', 'administrador', etc
  observacoes TEXT,
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de empresas ligadas
CREATE TABLE IF NOT EXISTS sacados_empresas_ligadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacado_cnpj VARCHAR(18) NOT NULL REFERENCES sacados(cnpj) ON DELETE CASCADE,
  cnpj_relacionado VARCHAR(18) NOT NULL,
  razao_social VARCHAR(255) NOT NULL,
  tipo_relacionamento VARCHAR(100), -- 'grupo', 'filial', 'matriz', 'sociedade'
  participacao DECIMAL(5,2),
  observacoes TEXT,
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de processos judiciais
CREATE TABLE IF NOT EXISTS sacados_processos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacado_cnpj VARCHAR(18) NOT NULL REFERENCES sacados(cnpj) ON DELETE CASCADE,
  numero_processo VARCHAR(50),
  tipo VARCHAR(100), -- 'civel', 'trabalhista', 'tributario', etc
  tribunal VARCHAR(255),
  vara VARCHAR(255),
  data_distribuicao DATE,
  status VARCHAR(100), -- 'em_andamento', 'suspenso', 'arquivado', 'julgado'
  valor DECIMAL(15,2),
  observacoes TEXT,
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_sacados_qsa_cnpj ON sacados_qsa(sacado_cnpj);
CREATE INDEX IF NOT EXISTS idx_sacados_enderecos_cnpj ON sacados_enderecos(sacado_cnpj);
CREATE INDEX IF NOT EXISTS idx_sacados_telefones_cnpj ON sacados_telefones(sacado_cnpj);
CREATE INDEX IF NOT EXISTS idx_sacados_emails_cnpj ON sacados_emails(sacado_cnpj);
CREATE INDEX IF NOT EXISTS idx_sacados_pessoas_ligadas_cnpj ON sacados_pessoas_ligadas(sacado_cnpj);
CREATE INDEX IF NOT EXISTS idx_sacados_empresas_ligadas_cnpj ON sacados_empresas_ligadas(sacado_cnpj);
CREATE INDEX IF NOT EXISTS idx_sacados_processos_cnpj ON sacados_processos(sacado_cnpj);

-- RLS (Row Level Security) - ajuste conforme sua política de segurança
ALTER TABLE sacados_qsa ENABLE ROW LEVEL SECURITY;
ALTER TABLE sacados_enderecos ENABLE ROW LEVEL SECURITY;
ALTER TABLE sacados_telefones ENABLE ROW LEVEL SECURITY;
ALTER TABLE sacados_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE sacados_pessoas_ligadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sacados_empresas_ligadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sacados_processos ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permite acesso autenticado)
CREATE POLICY "Usuários autenticados podem ver QSA" ON sacados_qsa FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem inserir QSA" ON sacados_qsa FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem atualizar QSA" ON sacados_qsa FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem deletar QSA" ON sacados_qsa FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ver endereços" ON sacados_enderecos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem inserir endereços" ON sacados_enderecos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem atualizar endereços" ON sacados_enderecos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem deletar endereços" ON sacados_enderecos FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ver telefones" ON sacados_telefones FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem inserir telefones" ON sacados_telefones FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem atualizar telefones" ON sacados_telefones FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem deletar telefones" ON sacados_telefones FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ver emails" ON sacados_emails FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem inserir emails" ON sacados_emails FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem atualizar emails" ON sacados_emails FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem deletar emails" ON sacados_emails FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ver pessoas ligadas" ON sacados_pessoas_ligadas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem inserir pessoas ligadas" ON sacados_pessoas_ligadas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem atualizar pessoas ligadas" ON sacados_pessoas_ligadas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem deletar pessoas ligadas" ON sacados_pessoas_ligadas FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ver empresas ligadas" ON sacados_empresas_ligadas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem inserir empresas ligadas" ON sacados_empresas_ligadas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem atualizar empresas ligadas" ON sacados_empresas_ligadas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem deletar empresas ligadas" ON sacados_empresas_ligadas FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ver processos" ON sacados_processos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem inserir processos" ON sacados_processos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem atualizar processos" ON sacados_processos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem deletar processos" ON sacados_processos FOR DELETE USING (auth.role() = 'authenticated');

