-- ===============================================
-- TABELA DE ATIVIDADES DE COBRANÇA POR TÍTULO
-- ===============================================
-- Histórico de cobrança vinculado diretamente aos títulos originais

CREATE TABLE IF NOT EXISTS titulos_atividades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo_id UUID NOT NULL REFERENCES titulos_negociados(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_titulos_atividades_titulo_id ON titulos_atividades(titulo_id);
CREATE INDEX IF NOT EXISTS idx_titulos_atividades_user ON titulos_atividades(user_id);
CREATE INDEX IF NOT EXISTS idx_titulos_atividades_data ON titulos_atividades(data_hora);
CREATE INDEX IF NOT EXISTS idx_titulos_atividades_tipo ON titulos_atividades(tipo);
CREATE INDEX IF NOT EXISTS idx_titulos_atividades_status ON titulos_atividades(status);

-- RLS (Row Level Security)
ALTER TABLE titulos_atividades ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Todos podem ver atividades de títulos" ON titulos_atividades
    FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem inserir atividades de títulos" ON titulos_atividades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários autenticados podem atualizar suas atividades de títulos" ON titulos_atividades
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários autenticados podem deletar suas atividades de títulos" ON titulos_atividades
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_titulos_atividades_updated_at BEFORE UPDATE ON titulos_atividades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE titulos_atividades IS 'Histórico de atividades e tratativas de cobrança vinculadas diretamente aos títulos originais';
COMMENT ON COLUMN titulos_atividades.tipo IS 'Tipo da atividade: ligacao, email, reuniao, observacao, lembrete, documento, negociacao';
COMMENT ON COLUMN titulos_atividades.status IS 'Status da atividade: pendente, concluida, cancelada';
COMMENT ON COLUMN titulos_atividades.proxima_acao IS 'Próxima ação a ser realizada';
COMMENT ON COLUMN titulos_atividades.data_lembrete IS 'Data e hora do lembrete para próxima ação';

