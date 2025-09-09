-- Script para ajustar o schema do banco de dados
-- Execute este script no Supabase para corrigir as inconsistências

-- 1. Adicionar campo data_vencimento na tabela lancamentos
ALTER TABLE lancamentos 
ADD COLUMN IF NOT EXISTS data_vencimento DATE;

-- 2. Adicionar campos que estão faltando na tabela lancamentos
ALTER TABLE lancamentos 
ADD COLUMN IF NOT EXISTS cedente_id UUID REFERENCES cedentes(id),
ADD COLUMN IF NOT EXISTS sacado_cnpj TEXT REFERENCES sacados(cnpj);

-- 3. Criar tabela de contas financeiras se não existir (já existe pelo schema)
-- 4. Criar tabela de categorias se não existir (já existe pelo schema)

-- 5. Inserir categorias padrão
INSERT INTO categorias (nome, natureza, cor, ordem, user_id) VALUES
('Vendas', 'receita', '#10B981', 1, (SELECT id FROM auth.users LIMIT 1)),
('Serviços', 'receita', '#059669', 2, (SELECT id FROM auth.users LIMIT 1)),
('Comissões', 'receita', '#047857', 3, (SELECT id FROM auth.users LIMIT 1)),
('Aluguéis', 'receita', '#065F46', 4, (SELECT id FROM auth.users LIMIT 1)),
('Materiais', 'despesa', '#DC2626', 1, (SELECT id FROM auth.users LIMIT 1)),
('Serviços', 'despesa', '#B91C1C', 2, (SELECT id FROM auth.users LIMIT 1)),
('Aluguéis', 'despesa', '#991B1B', 3, (SELECT id FROM auth.users LIMIT 1)),
('Utilidades', 'despesa', '#7F1D1D', 4, (SELECT id FROM auth.users LIMIT 1)),
('Telecomunicações', 'despesa', '#450A0A', 5, (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT DO NOTHING;

-- 6. Inserir contas financeiras padrão
INSERT INTO contas_financeiras (nome, tipo, saldo_inicial, user_id) VALUES
('Conta Corrente Principal', 'conta_corrente', 0, (SELECT id FROM auth.users LIMIT 1)),
('Poupança', 'conta_corrente', 0, (SELECT id FROM auth.users LIMIT 1)),
('Caixa', 'conta_corrente', 0, (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT DO NOTHING;

-- 7. Inserir meios de pagamento padrão
INSERT INTO meios_pagamento (nome, user_id) VALUES
('Dinheiro', (SELECT id FROM auth.users LIMIT 1)),
('PIX', (SELECT id FROM auth.users LIMIT 1)),
('Transferência', (SELECT id FROM auth.users LIMIT 1)),
('Cartão de Débito', (SELECT id FROM auth.users LIMIT 1)),
('Cartão de Crédito', (SELECT id FROM auth.users LIMIT 1)),
('Boleto', (SELECT id FROM auth.users LIMIT 1)),
('Cheque', (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT DO NOTHING;

-- 8. Atualizar lançamentos existentes para usar categoria padrão
UPDATE lancamentos 
SET categoria_id = (SELECT id FROM categorias WHERE natureza = lancamentos.natureza LIMIT 1)
WHERE categoria_id IS NULL;

-- 9. Atualizar lançamentos existentes para usar conta padrão
UPDATE lancamentos 
SET conta_id = (SELECT id FROM contas_financeiras LIMIT 1)
WHERE conta_id IS NULL;

-- 10. Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_lancamentos_data_competencia ON lancamentos(data_competencia);
CREATE INDEX IF NOT EXISTS idx_lancamentos_data_vencimento ON lancamentos(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_lancamentos_natureza ON lancamentos(natureza);
CREATE INDEX IF NOT EXISTS idx_lancamentos_status ON lancamentos(status);
CREATE INDEX IF NOT EXISTS idx_sacados_cnpj ON sacados(cnpj);
CREATE INDEX IF NOT EXISTS idx_cedentes_cnpj ON cedentes(cnpj);

-- 11. Comentários para documentar as tabelas
COMMENT ON TABLE lancamentos IS 'Lançamentos financeiros (receitas e despesas)';
COMMENT ON TABLE categorias IS 'Categorias para classificar lançamentos';
COMMENT ON TABLE contas_financeiras IS 'Contas bancárias e de caixa';
COMMENT ON TABLE meios_pagamento IS 'Formas de pagamento disponíveis';
COMMENT ON TABLE sacados IS 'Empresas/pessoas que devem pagar';
COMMENT ON TABLE cedentes IS 'Empresas/pessoas que devem receber';

-- 12. Políticas RLS (Row Level Security) se necessário
-- ALTER TABLE lancamentos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE contas_financeiras ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE meios_pagamento ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sacados ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cedentes ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para cada tabela
-- CREATE POLICY "Users can only see their own data" ON lancamentos FOR ALL USING (auth.uid() = user_id);
-- CREATE POLICY "Users can only see their own data" ON categorias FOR ALL USING (auth.uid() = user_id);
-- CREATE POLICY "Users can only see their own data" ON contas_financeiras FOR ALL USING (auth.uid() = user_id);
-- CREATE POLICY "Users can only see their own data" ON meios_pagamento FOR ALL USING (auth.uid() = user_id);
-- CREATE POLICY "Users can only see their own data" ON sacados FOR ALL USING (auth.uid() = user_id);
-- CREATE POLICY "Users can only see their own data" ON cedentes FOR ALL USING (auth.uid() = user_id);
