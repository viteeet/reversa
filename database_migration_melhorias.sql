-- ===============================================
-- MIGRAÇÃO: Melhorias do Sistema Reversa
-- ===============================================

-- 1. Adicionar coluna 'esteira' na tabela cedentes (pipeline de status operacional)
ALTER TABLE cedentes ADD COLUMN IF NOT EXISTS esteira VARCHAR(50) DEFAULT NULL;

COMMENT ON COLUMN cedentes.esteira IS 'Status operacional do cedente: em_cobranca, em_negociacao, localizando, acordo_em_andamento, analise, investigacao, juridico, devolvido';

-- 2. Atualizar CHECK constraints de 'tipo' nas tabelas de atividades para incluir 'whatsapp'

-- sacados_atividades
ALTER TABLE sacados_atividades DROP CONSTRAINT IF EXISTS sacados_atividades_tipo_check;
ALTER TABLE sacados_atividades ADD CONSTRAINT sacados_atividades_tipo_check 
  CHECK (tipo IN ('ligacao', 'email', 'reuniao', 'observacao', 'lembrete', 'documento', 'negociacao', 'whatsapp'));

-- cedentes_atividades
ALTER TABLE cedentes_atividades DROP CONSTRAINT IF EXISTS cedentes_atividades_tipo_check;
ALTER TABLE cedentes_atividades ADD CONSTRAINT cedentes_atividades_tipo_check 
  CHECK (tipo IN ('ligacao', 'email', 'reuniao', 'observacao', 'lembrete', 'documento', 'negociacao', 'whatsapp'));

-- titulos_atividades
ALTER TABLE titulos_atividades DROP CONSTRAINT IF EXISTS titulos_atividades_tipo_check;
ALTER TABLE titulos_atividades ADD CONSTRAINT titulos_atividades_tipo_check 
  CHECK (tipo IN ('ligacao', 'email', 'reuniao', 'observacao', 'lembrete', 'documento', 'negociacao', 'whatsapp'));

-- 3. Índice para performance na busca por esteira
CREATE INDEX IF NOT EXISTS idx_cedentes_esteira ON cedentes(esteira);
