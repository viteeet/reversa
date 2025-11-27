-- ================================================================================
-- PESSOAS FÍSICAS COMO ENTIDADES PRINCIPAIS
-- ================================================================================
-- Execute este script no Supabase SQL Editor

-- Tabela principal de pessoas físicas
CREATE TABLE IF NOT EXISTS pessoas_fisicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf VARCHAR(14) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  nome_mae VARCHAR(255),
  data_nascimento DATE,
  rg VARCHAR(20),
  situacao VARCHAR(50) DEFAULT 'ativa', -- ativa, inativa, falecida
  observacoes_gerais TEXT,
  processos_texto TEXT, -- Texto formatado de processos
  origem VARCHAR(50) DEFAULT 'manual', -- 'manual', 'api'
  ativo BOOLEAN DEFAULT true,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Endereços de pessoas físicas
CREATE TABLE IF NOT EXISTS pessoas_fisicas_enderecos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID NOT NULL REFERENCES pessoas_fisicas(id) ON DELETE CASCADE,
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

-- Telefones de pessoas físicas
CREATE TABLE IF NOT EXISTS pessoas_fisicas_telefones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID NOT NULL REFERENCES pessoas_fisicas(id) ON DELETE CASCADE,
  telefone VARCHAR(20) NOT NULL,
  tipo VARCHAR(50), -- 'celular', 'fixo', 'comercial'
  nome_contato VARCHAR(255),
  principal BOOLEAN DEFAULT false,
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- E-mails de pessoas físicas
CREATE TABLE IF NOT EXISTS pessoas_fisicas_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID NOT NULL REFERENCES pessoas_fisicas(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  tipo VARCHAR(50), -- 'pessoal', 'comercial'
  nome_contato VARCHAR(255),
  principal BOOLEAN DEFAULT false,
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Familiares / Relacionamentos
CREATE TABLE IF NOT EXISTS pessoas_fisicas_familiares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID NOT NULL REFERENCES pessoas_fisicas(id) ON DELETE CASCADE,
  familiar_cpf VARCHAR(14),
  familiar_nome VARCHAR(255) NOT NULL,
  tipo_relacionamento VARCHAR(100), -- 'pai', 'mae', 'conjuge', 'filho', 'filha', 'irmao', 'irma', 'avô', 'avó', 'neto', 'neta', 'tio', 'tia', 'primo', 'prima', 'sobrinho', 'sobrinha', 'cunhado', 'cunhada', 'sogro', 'sogra', 'genro', 'nora', 'outro'
  observacoes TEXT,
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Empresas Ligadas (empresas onde a pessoa é sócio, funcionário, etc.)
CREATE TABLE IF NOT EXISTS pessoas_fisicas_empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID NOT NULL REFERENCES pessoas_fisicas(id) ON DELETE CASCADE,
  empresa_cnpj VARCHAR(18) NOT NULL,
  empresa_razao_social VARCHAR(255) NOT NULL,
  tipo_relacionamento VARCHAR(100), -- 'socio', 'administrador', 'funcionario', 'proprietario', 'outro'
  participacao DECIMAL(5,2), -- percentual de participação
  cargo VARCHAR(255), -- cargo/função na empresa
  data_inicio DATE,
  data_fim DATE,
  observacoes TEXT,
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processos Judiciais
CREATE TABLE IF NOT EXISTS pessoas_fisicas_processos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID NOT NULL REFERENCES pessoas_fisicas(id) ON DELETE CASCADE,
  numero_processo VARCHAR(50) NOT NULL,
  tribunal VARCHAR(100),
  vara VARCHAR(255),
  tipo_acao VARCHAR(255),
  valor_causa DECIMAL(15,2),
  data_distribuicao DATE,
  status VARCHAR(100),
  parte_contraria TEXT,
  observacoes TEXT,
  link_processo TEXT,
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Observações Gerais
CREATE TABLE IF NOT EXISTS pessoas_fisicas_observacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID NOT NULL REFERENCES pessoas_fisicas(id) ON DELETE CASCADE UNIQUE,
  observacoes TEXT,
  processos_texto TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pessoas_fisicas_cpf ON pessoas_fisicas(cpf);
CREATE INDEX IF NOT EXISTS idx_pessoas_fisicas_nome ON pessoas_fisicas(nome);
CREATE INDEX IF NOT EXISTS idx_pessoas_fisicas_user_id ON pessoas_fisicas(user_id);
CREATE INDEX IF NOT EXISTS idx_pessoas_fisicas_enderecos_pessoa ON pessoas_fisicas_enderecos(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_pessoas_fisicas_telefones_pessoa ON pessoas_fisicas_telefones(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_pessoas_fisicas_emails_pessoa ON pessoas_fisicas_emails(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_pessoas_fisicas_familiares_pessoa ON pessoas_fisicas_familiares(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_pessoas_fisicas_empresas_pessoa ON pessoas_fisicas_empresas(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_pessoas_fisicas_processos_pessoa ON pessoas_fisicas_processos(pessoa_id);

-- RLS (Row Level Security)
ALTER TABLE pessoas_fisicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pessoas_fisicas_enderecos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pessoas_fisicas_telefones ENABLE ROW LEVEL SECURITY;
ALTER TABLE pessoas_fisicas_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE pessoas_fisicas_familiares ENABLE ROW LEVEL SECURITY;
ALTER TABLE pessoas_fisicas_empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pessoas_fisicas_processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pessoas_fisicas_observacoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pessoas_fisicas
DROP POLICY IF EXISTS "Users can view own pessoas_fisicas" ON pessoas_fisicas;
DROP POLICY IF EXISTS "Users can insert own pessoas_fisicas" ON pessoas_fisicas;
DROP POLICY IF EXISTS "Users can update own pessoas_fisicas" ON pessoas_fisicas;
DROP POLICY IF EXISTS "Users can delete own pessoas_fisicas" ON pessoas_fisicas;

CREATE POLICY "Users can view own pessoas_fisicas" ON pessoas_fisicas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pessoas_fisicas" ON pessoas_fisicas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pessoas_fisicas" ON pessoas_fisicas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pessoas_fisicas" ON pessoas_fisicas FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para pessoas_fisicas_enderecos
DROP POLICY IF EXISTS "Users can view own pessoas_fisicas_enderecos" ON pessoas_fisicas_enderecos;
DROP POLICY IF EXISTS "Users can insert own pessoas_fisicas_enderecos" ON pessoas_fisicas_enderecos;
DROP POLICY IF EXISTS "Users can update own pessoas_fisicas_enderecos" ON pessoas_fisicas_enderecos;
DROP POLICY IF EXISTS "Users can delete own pessoas_fisicas_enderecos" ON pessoas_fisicas_enderecos;

CREATE POLICY "Users can view own pessoas_fisicas_enderecos" ON pessoas_fisicas_enderecos FOR SELECT USING (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_enderecos.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);
CREATE POLICY "Users can insert own pessoas_fisicas_enderecos" ON pessoas_fisicas_enderecos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_enderecos.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);
CREATE POLICY "Users can update own pessoas_fisicas_enderecos" ON pessoas_fisicas_enderecos FOR UPDATE USING (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_enderecos.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);
CREATE POLICY "Users can delete own pessoas_fisicas_enderecos" ON pessoas_fisicas_enderecos FOR DELETE USING (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_enderecos.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);

-- Políticas RLS para pessoas_fisicas_telefones
DROP POLICY IF EXISTS "Users can view own pessoas_fisicas_telefones" ON pessoas_fisicas_telefones;
DROP POLICY IF EXISTS "Users can insert own pessoas_fisicas_telefones" ON pessoas_fisicas_telefones;
DROP POLICY IF EXISTS "Users can update own pessoas_fisicas_telefones" ON pessoas_fisicas_telefones;
DROP POLICY IF EXISTS "Users can delete own pessoas_fisicas_telefones" ON pessoas_fisicas_telefones;

CREATE POLICY "Users can view own pessoas_fisicas_telefones" ON pessoas_fisicas_telefones FOR SELECT USING (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_telefones.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);
CREATE POLICY "Users can insert own pessoas_fisicas_telefones" ON pessoas_fisicas_telefones FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_telefones.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);
CREATE POLICY "Users can update own pessoas_fisicas_telefones" ON pessoas_fisicas_telefones FOR UPDATE USING (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_telefones.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);
CREATE POLICY "Users can delete own pessoas_fisicas_telefones" ON pessoas_fisicas_telefones FOR DELETE USING (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_telefones.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);

-- Políticas RLS para pessoas_fisicas_emails
DROP POLICY IF EXISTS "Users can view own pessoas_fisicas_emails" ON pessoas_fisicas_emails;
DROP POLICY IF EXISTS "Users can insert own pessoas_fisicas_emails" ON pessoas_fisicas_emails;
DROP POLICY IF EXISTS "Users can update own pessoas_fisicas_emails" ON pessoas_fisicas_emails;
DROP POLICY IF EXISTS "Users can delete own pessoas_fisicas_emails" ON pessoas_fisicas_emails;

CREATE POLICY "Users can view own pessoas_fisicas_emails" ON pessoas_fisicas_emails FOR SELECT USING (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_emails.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);
CREATE POLICY "Users can insert own pessoas_fisicas_emails" ON pessoas_fisicas_emails FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_emails.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);
CREATE POLICY "Users can update own pessoas_fisicas_emails" ON pessoas_fisicas_emails FOR UPDATE USING (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_emails.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);
CREATE POLICY "Users can delete own pessoas_fisicas_emails" ON pessoas_fisicas_emails FOR DELETE USING (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_emails.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);

-- Políticas RLS para pessoas_fisicas_familiares
DROP POLICY IF EXISTS "Users can view own pessoas_fisicas_familiares" ON pessoas_fisicas_familiares;
DROP POLICY IF EXISTS "Users can insert own pessoas_fisicas_familiares" ON pessoas_fisicas_familiares;
DROP POLICY IF EXISTS "Users can update own pessoas_fisicas_familiares" ON pessoas_fisicas_familiares;
DROP POLICY IF EXISTS "Users can delete own pessoas_fisicas_familiares" ON pessoas_fisicas_familiares;

CREATE POLICY "Users can view own pessoas_fisicas_familiares" ON pessoas_fisicas_familiares FOR SELECT USING (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_familiares.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);
CREATE POLICY "Users can insert own pessoas_fisicas_familiares" ON pessoas_fisicas_familiares FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_familiares.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);
CREATE POLICY "Users can update own pessoas_fisicas_familiares" ON pessoas_fisicas_familiares FOR UPDATE USING (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_familiares.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);
CREATE POLICY "Users can delete own pessoas_fisicas_familiares" ON pessoas_fisicas_familiares FOR DELETE USING (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_familiares.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);

-- Políticas RLS para pessoas_fisicas_empresas
DROP POLICY IF EXISTS "Users can view own pessoas_fisicas_empresas" ON pessoas_fisicas_empresas;
DROP POLICY IF EXISTS "Users can insert own pessoas_fisicas_empresas" ON pessoas_fisicas_empresas;
DROP POLICY IF EXISTS "Users can update own pessoas_fisicas_empresas" ON pessoas_fisicas_empresas;
DROP POLICY IF EXISTS "Users can delete own pessoas_fisicas_empresas" ON pessoas_fisicas_empresas;

CREATE POLICY "Users can view own pessoas_fisicas_empresas" ON pessoas_fisicas_empresas FOR SELECT USING (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_empresas.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);
CREATE POLICY "Users can insert own pessoas_fisicas_empresas" ON pessoas_fisicas_empresas FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_empresas.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);
CREATE POLICY "Users can update own pessoas_fisicas_empresas" ON pessoas_fisicas_empresas FOR UPDATE USING (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_empresas.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);
CREATE POLICY "Users can delete own pessoas_fisicas_empresas" ON pessoas_fisicas_empresas FOR DELETE USING (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_empresas.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);

-- Políticas RLS para pessoas_fisicas_processos
DROP POLICY IF EXISTS "Users can view own pessoas_fisicas_processos" ON pessoas_fisicas_processos;
DROP POLICY IF EXISTS "Users can insert own pessoas_fisicas_processos" ON pessoas_fisicas_processos;
DROP POLICY IF EXISTS "Users can update own pessoas_fisicas_processos" ON pessoas_fisicas_processos;
DROP POLICY IF EXISTS "Users can delete own pessoas_fisicas_processos" ON pessoas_fisicas_processos;

CREATE POLICY "Users can view own pessoas_fisicas_processos" ON pessoas_fisicas_processos FOR SELECT USING (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_processos.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);
CREATE POLICY "Users can insert own pessoas_fisicas_processos" ON pessoas_fisicas_processos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_processos.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);
CREATE POLICY "Users can update own pessoas_fisicas_processos" ON pessoas_fisicas_processos FOR UPDATE USING (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_processos.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);
CREATE POLICY "Users can delete own pessoas_fisicas_processos" ON pessoas_fisicas_processos FOR DELETE USING (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_processos.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);

-- Políticas RLS para pessoas_fisicas_observacoes
DROP POLICY IF EXISTS "Users can view own pessoas_fisicas_observacoes" ON pessoas_fisicas_observacoes;
DROP POLICY IF EXISTS "Users can insert own pessoas_fisicas_observacoes" ON pessoas_fisicas_observacoes;
DROP POLICY IF EXISTS "Users can update own pessoas_fisicas_observacoes" ON pessoas_fisicas_observacoes;
DROP POLICY IF EXISTS "Users can delete own pessoas_fisicas_observacoes" ON pessoas_fisicas_observacoes;

CREATE POLICY "Users can view own pessoas_fisicas_observacoes" ON pessoas_fisicas_observacoes FOR SELECT USING (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_observacoes.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);
CREATE POLICY "Users can insert own pessoas_fisicas_observacoes" ON pessoas_fisicas_observacoes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_observacoes.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);
CREATE POLICY "Users can update own pessoas_fisicas_observacoes" ON pessoas_fisicas_observacoes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_observacoes.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);
CREATE POLICY "Users can delete own pessoas_fisicas_observacoes" ON pessoas_fisicas_observacoes FOR DELETE USING (
  EXISTS (SELECT 1 FROM pessoas_fisicas WHERE pessoas_fisicas.id = pessoas_fisicas_observacoes.pessoa_id AND pessoas_fisicas.user_id = auth.uid())
);

-- Comentários
COMMENT ON TABLE pessoas_fisicas IS 'Tabela principal de pessoas físicas como entidades independentes';
COMMENT ON TABLE pessoas_fisicas_enderecos IS 'Endereços de pessoas físicas';
COMMENT ON TABLE pessoas_fisicas_telefones IS 'Telefones de pessoas físicas';
COMMENT ON TABLE pessoas_fisicas_emails IS 'E-mails de pessoas físicas';
COMMENT ON TABLE pessoas_fisicas_familiares IS 'Familiares e relacionamentos de pessoas físicas';
COMMENT ON TABLE pessoas_fisicas_empresas IS 'Empresas ligadas a pessoas físicas (onde são sócios, funcionários, etc.)';
COMMENT ON TABLE pessoas_fisicas_processos IS 'Processos judiciais de pessoas físicas';
COMMENT ON TABLE pessoas_fisicas_observacoes IS 'Observações gerais de pessoas físicas';

-- Notificar PostgREST para recarregar schema
NOTIFY pgrst, 'reload schema';

