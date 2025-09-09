-- Expandir tabela sacados com campos adicionais
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

-- Tabela para múltiplos endereços dos sacados
CREATE TABLE IF NOT EXISTS sacado_enderecos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sacado_cnpj TEXT NOT NULL REFERENCES sacados(cnpj) ON DELETE CASCADE,
  endereco TEXT NOT NULL,
  tipo TEXT DEFAULT 'comercial', -- comercial, residencial, correspondencia
  principal BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para múltiplos telefones dos sacados
CREATE TABLE IF NOT EXISTS sacado_telefones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sacado_cnpj TEXT NOT NULL REFERENCES sacados(cnpj) ON DELETE CASCADE,
  telefone TEXT NOT NULL,
  tipo TEXT DEFAULT 'comercial', -- comercial, celular, residencial
  principal BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para múltiplos e-mails dos sacados
CREATE TABLE IF NOT EXISTS sacado_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sacado_cnpj TEXT NOT NULL REFERENCES sacados(cnpj) ON DELETE CASCADE,
  email TEXT NOT NULL,
  tipo TEXT DEFAULT 'comercial', -- comercial, pessoal
  principal BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para pessoas ligadas (QSA) dos sacados
CREATE TABLE IF NOT EXISTS sacado_pessoas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sacado_cnpj TEXT NOT NULL REFERENCES sacados(cnpj) ON DELETE CASCADE,
  cpf TEXT NOT NULL,
  nome TEXT NOT NULL,
  cargo TEXT, -- sócio, administrador, etc.
  participacao DECIMAL(5,2), -- percentual de participação
  relacionamento TEXT, -- pai, mãe, irmão, esposa, etc.
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para empresas ligadas dos sacados
CREATE TABLE IF NOT EXISTS sacado_empresas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sacado_cnpj TEXT NOT NULL REFERENCES sacados(cnpj) ON DELETE CASCADE,
  empresa_cnpj TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  tipo_relacionamento TEXT DEFAULT 'grupo', -- grupo, filial, matriz, etc.
  participacao DECIMAL(5,2), -- percentual de participação
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para histórico de tentativas de contato
CREATE TABLE IF NOT EXISTS sacado_contatos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sacado_cnpj TEXT NOT NULL REFERENCES sacados(cnpj) ON DELETE CASCADE,
  tipo_contato TEXT NOT NULL, -- telefone, email, visita, carta
  meio TEXT, -- número do telefone, endereço do email, etc.
  resultado TEXT, -- atendido, não atendido, ocupado, etc.
  observacoes TEXT,
  data_contato TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usuario_id UUID REFERENCES auth.users(id)
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_sacado_enderecos_cnpj ON sacado_enderecos(sacado_cnpj);
CREATE INDEX IF NOT EXISTS idx_sacado_telefones_cnpj ON sacado_telefones(sacado_cnpj);
CREATE INDEX IF NOT EXISTS idx_sacado_emails_cnpj ON sacado_emails(sacado_cnpj);
CREATE INDEX IF NOT EXISTS idx_sacado_pessoas_cnpj ON sacado_pessoas(sacado_cnpj);
CREATE INDEX IF NOT EXISTS idx_sacado_pessoas_cpf ON sacado_pessoas(cpf);
CREATE INDEX IF NOT EXISTS idx_sacado_empresas_cnpj ON sacado_empresas(sacado_cnpj);
CREATE INDEX IF NOT EXISTS idx_sacado_contatos_cnpj ON sacado_contatos(sacado_cnpj);
CREATE INDEX IF NOT EXISTS idx_sacado_contatos_data ON sacado_contatos(data_contato);
