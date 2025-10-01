-- ===============================================
-- TABELAS DE ATIVIDADES - HISTÓRICO DE TRATATIVAS
-- ===============================================

-- Tabela de atividades para sacados
CREATE TABLE IF NOT EXISTS sacados_atividades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sacado_cnpj TEXT NOT NULL REFERENCES sacados(cnpj) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('ligacao', 'email', 'reuniao', 'observacao', 'lembrete', 'documento', 'negociacao')),
    descricao TEXT NOT NULL,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'concluida' CHECK (status IN ('pendente', 'concluida', 'cancelada')),
    proxima_acao TEXT,
    data_lembrete TIMESTAMP WITH TIME ZONE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de atividades para cedentes
CREATE TABLE IF NOT EXISTS cedentes_atividades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cedente_id UUID NOT NULL REFERENCES cedentes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('ligacao', 'email', 'reuniao', 'observacao', 'lembrete', 'documento', 'negociacao')),
    descricao TEXT NOT NULL,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'concluida' CHECK (status IN ('pendente', 'concluida', 'cancelada')),
    proxima_acao TEXT,
    data_lembrete TIMESTAMP WITH TIME ZONE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_sacados_atividades_cnpj ON sacados_atividades(sacado_cnpj);
CREATE INDEX IF NOT EXISTS idx_sacados_atividades_user ON sacados_atividades(user_id);
CREATE INDEX IF NOT EXISTS idx_sacados_atividades_data ON sacados_atividades(data_hora);
CREATE INDEX IF NOT EXISTS idx_sacados_atividades_tipo ON sacados_atividades(tipo);

CREATE INDEX IF NOT EXISTS idx_cedentes_atividades_cedente ON cedentes_atividades(cedente_id);
CREATE INDEX IF NOT EXISTS idx_cedentes_atividades_user ON cedentes_atividades(user_id);
CREATE INDEX IF NOT EXISTS idx_cedentes_atividades_data ON cedentes_atividades(data_hora);
CREATE INDEX IF NOT EXISTS idx_cedentes_atividades_tipo ON cedentes_atividades(tipo);

-- RLS (Row Level Security)
ALTER TABLE sacados_atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE cedentes_atividades ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para sacados_atividades
CREATE POLICY "Todos podem ver atividades de sacados" ON sacados_atividades
    FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem inserir atividades de sacados" ON sacados_atividades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários autenticados podem atualizar suas atividades de sacados" ON sacados_atividades
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários autenticados podem deletar suas atividades de sacados" ON sacados_atividades
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para cedentes_atividades
CREATE POLICY "Todos podem ver atividades de cedentes" ON cedentes_atividades
    FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem inserir atividades de cedentes" ON cedentes_atividades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários autenticados podem atualizar suas atividades de cedentes" ON cedentes_atividades
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários autenticados podem deletar suas atividades de cedentes" ON cedentes_atividades
    FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_sacados_atividades_updated_at BEFORE UPDATE ON sacados_atividades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cedentes_atividades_updated_at BEFORE UPDATE ON cedentes_atividades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas tabelas
COMMENT ON TABLE sacados_atividades IS 'Histórico de atividades e tratativas com sacados';
COMMENT ON TABLE cedentes_atividades IS 'Histórico de atividades e tratativas com cedentes';

COMMENT ON COLUMN sacados_atividades.tipo IS 'Tipo da atividade: ligacao, email, reuniao, observacao, lembrete, documento, negociacao';
COMMENT ON COLUMN sacados_atividades.status IS 'Status da atividade: pendente, concluida, cancelada';
COMMENT ON COLUMN sacados_atividades.proxima_acao IS 'Próxima ação a ser realizada';
COMMENT ON COLUMN sacados_atividades.data_lembrete IS 'Data e hora do lembrete para próxima ação';

COMMENT ON COLUMN cedentes_atividades.tipo IS 'Tipo da atividade: ligacao, email, reuniao, observacao, lembrete, documento, negociacao';
COMMENT ON COLUMN cedentes_atividades.status IS 'Status da atividade: pendente, concluida, cancelada';
COMMENT ON COLUMN cedentes_atividades.proxima_acao IS 'Próxima ação a ser realizada';
COMMENT ON COLUMN cedentes_atividades.data_lembrete IS 'Data e hora do lembrete para próxima ação';
