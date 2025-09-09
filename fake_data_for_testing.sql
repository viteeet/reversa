-- Script para inserir dados fake para testes
-- Execute este script no Supabase para popular o banco com dados de exemplo

-- 1. Inserir Cedentes fake
INSERT INTO cedentes (nome, razao_social, cnpj, telefone, email, endereco, porte, natureza_juridica, situacao, data_abertura, capital_social, atividade_principal_codigo, atividade_principal_descricao, atividades_secundarias, simples_nacional, user_id) VALUES
('Tech Solutions LTDA', 'Tech Solutions Tecnologia LTDA', '12345678000190', '(11) 99999-9999', 'contato@techsolutions.com', 'Rua das Flores, 123, Centro, São Paulo, SP, 01234-567', 'Pequeno Porte', 'Sociedade Empresária Limitada', 'Ativa', '2020-01-15', 100000.00, '6201-5/00', 'Desenvolvimento de programas de computador sob encomenda', '6202-3/00 - Desenvolvimento e licenciamento de programas de computador customizáveis', true, (SELECT id FROM auth.users LIMIT 1)),
('Comércio & Cia', 'Comércio e Serviços LTDA', '98765432000180', '(11) 88888-8888', 'vendas@comerciocia.com', 'Av. Paulista, 456, Bela Vista, São Paulo, SP, 01310-100', 'Médio Porte', 'Sociedade Empresária Limitada', 'Ativa', '2018-03-20', 500000.00, '4711-3/00', 'Comércio varejista de mercadorias em geral', '4712-1/00 - Comércio varejista de mercadorias em geral', false, (SELECT id FROM auth.users LIMIT 1)),
('Serviços Premium', 'Serviços Premium Consultoria LTDA', '11223344000170', '(11) 77777-7777', 'contato@servicospremium.com', 'Rua Augusta, 789, Consolação, São Paulo, SP, 01305-000', 'Pequeno Porte', 'Sociedade Empresária Limitada', 'Ativa', '2019-07-10', 200000.00, '7020-4/00', 'Atividades de consultoria em gestão empresarial', '7020-4/00 - Atividades de consultoria em gestão empresarial', true, (SELECT id FROM auth.users LIMIT 1));

-- 2. Inserir Sacados fake
INSERT INTO sacados (nome, razao_social, cnpj, telefone, email, endereco, porte, natureza_juridica, situacao, data_abertura, capital_social, atividade_principal_codigo, atividade_principal_descricao, atividades_secundarias, simples_nacional, user_id) VALUES
('Cliente Alpha Corp', 'Alpha Corporation LTDA', '11111111000111', '(11) 11111-1111', 'financeiro@alphacorp.com', 'Rua dos Clientes, 100, Vila Madalena, São Paulo, SP, 05435-070', 'Grande Porte', 'Sociedade Empresária Limitada', 'Ativa', '2015-05-10', 2000000.00, '6201-5/00', 'Desenvolvimento de programas de computador sob encomenda', '6202-3/00 - Desenvolvimento e licenciamento de programas de computador customizáveis', false, (SELECT id FROM auth.users LIMIT 1)),
('Beta Industries', 'Beta Industries S.A.', '22222222000122', '(11) 22222-2222', 'contato@betaindustries.com', 'Av. Industrial, 200, Zona Industrial, São Paulo, SP, 08230-000', 'Grande Porte', 'Sociedade Anônima', 'Ativa', '2010-12-01', 5000000.00, '2899-9/00', 'Fabricação de outros equipamentos de transporte', '2899-9/00 - Fabricação de outros equipamentos de transporte', false, (SELECT id FROM auth.users LIMIT 1)),
('Gamma Serviços', 'Gamma Serviços LTDA', '33333333000133', '(11) 33333-3333', 'admin@gammaservicos.com', 'Rua dos Serviços, 300, Centro, São Paulo, SP, 01000-000', 'Médio Porte', 'Sociedade Empresária Limitada', 'Ativa', '2017-08-15', 800000.00, '7020-4/00', 'Atividades de consultoria em gestão empresarial', '7020-4/00 - Atividades de consultoria em gestão empresarial', true, (SELECT id FROM auth.users LIMIT 1));

-- 3. Inserir Lançamentos fake (Receitas)
INSERT INTO lancamentos (descricao, valor, natureza, data_competencia, data_vencimento, status, categoria_id, conta_id, terceiro, observacoes, user_id) VALUES
('Desenvolvimento de sistema web - Cliente Alpha', 15000.00, 'receita', '2025-01-01', '2025-01-15', 'pendente', (SELECT id FROM categorias WHERE natureza = 'receita' AND nome = 'Serviços' LIMIT 1), (SELECT id FROM contas_financeiras LIMIT 1), 'Cliente Alpha Corp', 'Projeto de 3 meses', (SELECT id FROM auth.users LIMIT 1)),
('Consultoria em gestão - Beta Industries', 8500.00, 'receita', '2025-01-01', '2025-01-20', 'pendente', (SELECT id FROM categorias WHERE natureza = 'receita' AND nome = 'Serviços' LIMIT 1), (SELECT id FROM contas_financeiras LIMIT 1), 'Beta Industries', 'Consultoria de 2 semanas', (SELECT id FROM auth.users LIMIT 1)),
('Venda de produtos - Gamma Serviços', 3200.00, 'receita', '2025-01-01', '2025-01-10', 'pago', (SELECT id FROM categorias WHERE natureza = 'receita' AND nome = 'Vendas' LIMIT 1), (SELECT id FROM contas_financeiras LIMIT 1), 'Gamma Serviços', 'Pagamento antecipado', (SELECT id FROM auth.users LIMIT 1)),
('Comissão de vendas - Parceiro Tech', 1200.00, 'receita', '2025-01-01', '2025-01-25', 'pendente', (SELECT id FROM categorias WHERE natureza = 'receita' AND nome = 'Comissões' LIMIT 1), (SELECT id FROM contas_financeiras LIMIT 1), 'Parceiro Tech Solutions', 'Comissão mensal', (SELECT id FROM auth.users LIMIT 1)),
('Aluguel recebido - Imóvel comercial', 4500.00, 'receita', '2025-01-01', '2025-01-05', 'pago', (SELECT id FROM categorias WHERE natureza = 'receita' AND nome = 'Aluguéis' LIMIT 1), (SELECT id FROM contas_financeiras LIMIT 1), 'Inquilino Comercial', 'Aluguel mensal', (SELECT id FROM auth.users LIMIT 1)),
('Serviços de manutenção - Cliente Alpha', 2800.00, 'receita', '2025-01-01', '2025-01-30', 'pendente', (SELECT id FROM categorias WHERE natureza = 'receita' AND nome = 'Serviços' LIMIT 1), (SELECT id FROM contas_financeiras LIMIT 1), 'Cliente Alpha Corp', 'Manutenção mensal', (SELECT id FROM auth.users LIMIT 1));

-- 4. Inserir Lançamentos fake (Despesas)
INSERT INTO lancamentos (descricao, valor, natureza, data_competencia, data_vencimento, status, categoria_id, conta_id, terceiro, observacoes, user_id) VALUES
('Compra de materiais de escritório', 850.00, 'despesa', '2025-01-01', '2025-01-15', 'pendente', (SELECT id FROM categorias WHERE natureza = 'despesa' AND nome = 'Materiais' LIMIT 1), (SELECT id FROM contas_financeiras LIMIT 1), 'Papelaria Central', 'Materiais para escritório', (SELECT id FROM auth.users LIMIT 1)),
('Serviços de limpeza', 1200.00, 'despesa', '2025-01-01', '2025-01-20', 'pendente', (SELECT id FROM categorias WHERE natureza = 'despesa' AND nome = 'Serviços' LIMIT 1), (SELECT id FROM contas_financeiras LIMIT 1), 'Limpeza Total LTDA', 'Limpeza mensal', (SELECT id FROM auth.users LIMIT 1)),
('Aluguel do escritório', 3500.00, 'despesa', '2025-01-01', '2025-01-05', 'pago', (SELECT id FROM categorias WHERE natureza = 'despesa' AND nome = 'Aluguéis' LIMIT 1), (SELECT id FROM contas_financeiras LIMIT 1), 'Imobiliária Central', 'Aluguel mensal', (SELECT id FROM auth.users LIMIT 1)),
('Conta de energia elétrica', 450.00, 'despesa', '2025-01-01', '2025-01-10', 'pago', (SELECT id FROM categorias WHERE natureza = 'despesa' AND nome = 'Utilidades' LIMIT 1), (SELECT id FROM contas_financeiras LIMIT 1), 'Enel Distribuição', 'Energia elétrica', (SELECT id FROM auth.users LIMIT 1)),
('Internet e telefone', 280.00, 'despesa', '2025-01-01', '2025-01-12', 'pendente', (SELECT id FROM categorias WHERE natureza = 'despesa' AND nome = 'Telecomunicações' LIMIT 1), (SELECT id FROM contas_financeiras LIMIT 1), 'Vivo Telecomunicações', 'Internet e telefone', (SELECT id FROM auth.users LIMIT 1)),
('Compra de equipamentos', 5500.00, 'despesa', '2025-01-01', '2025-01-25', 'pendente', (SELECT id FROM categorias WHERE natureza = 'despesa' AND nome = 'Materiais' LIMIT 1), (SELECT id FROM contas_financeiras LIMIT 1), 'Tech Store', 'Equipamentos de informática', (SELECT id FROM auth.users LIMIT 1));

-- 5. Inserir alguns lançamentos de meses anteriores para dados históricos
INSERT INTO lancamentos (descricao, valor, natureza, data_competencia, data_vencimento, status, categoria_id, conta_id, terceiro, observacoes, user_id) VALUES
-- Dezembro 2024
('Desenvolvimento de app mobile - Cliente Alpha', 18000.00, 'receita', '2024-12-01', '2024-12-15', 'pago', (SELECT id FROM categorias WHERE natureza = 'receita' AND nome = 'Serviços' LIMIT 1), (SELECT id FROM contas_financeiras LIMIT 1), 'Cliente Alpha Corp', 'Projeto de app mobile', (SELECT id FROM auth.users LIMIT 1)),
('Consultoria estratégica - Beta Industries', 12000.00, 'receita', '2024-12-01', '2024-12-20', 'pago', (SELECT id FROM categorias WHERE natureza = 'receita' AND nome = 'Serviços' LIMIT 1), (SELECT id FROM contas_financeiras LIMIT 1), 'Beta Industries', 'Consultoria estratégica', (SELECT id FROM auth.users LIMIT 1)),
('Venda de licenças - Gamma Serviços', 4500.00, 'receita', '2024-12-01', '2024-12-10', 'pago', (SELECT id FROM categorias WHERE natureza = 'receita' AND nome = 'Vendas' LIMIT 1), (SELECT id FROM contas_financeiras LIMIT 1), 'Gamma Serviços', 'Licenças de software', (SELECT id FROM auth.users LIMIT 1)),
('Salários e encargos', 15000.00, 'despesa', '2024-12-01', '2024-12-05', 'pago', (SELECT id FROM categorias WHERE natureza = 'despesa' AND nome = 'Serviços' LIMIT 1), (SELECT id FROM contas_financeiras LIMIT 1), 'Funcionários', 'Salários mensais', (SELECT id FROM auth.users LIMIT 1)),
('Aluguel do escritório', 3500.00, 'despesa', '2024-12-01', '2024-12-05', 'pago', (SELECT id FROM categorias WHERE natureza = 'despesa' AND nome = 'Aluguéis' LIMIT 1), (SELECT id FROM contas_financeiras LIMIT 1), 'Imobiliária Central', 'Aluguel mensal', (SELECT id FROM auth.users LIMIT 1)),

-- Novembro 2024
('Desenvolvimento de sistema ERP - Cliente Alpha', 22000.00, 'receita', '2024-11-01', '2024-11-15', 'pago', (SELECT id FROM categorias WHERE natureza = 'receita' AND nome = 'Serviços' LIMIT 1), (SELECT id FROM contas_financeiras LIMIT 1), 'Cliente Alpha Corp', 'Sistema ERP completo', (SELECT id FROM auth.users LIMIT 1)),
('Consultoria em TI - Beta Industries', 9500.00, 'receita', '2024-11-01', '2024-11-20', 'pago', (SELECT id FROM categorias WHERE natureza = 'receita' AND nome = 'Serviços' LIMIT 1), (SELECT id FROM contas_financeiras LIMIT 1), 'Beta Industries', 'Consultoria em TI', (SELECT id FROM auth.users LIMIT 1)),
('Venda de produtos - Gamma Serviços', 2800.00, 'receita', '2024-11-01', '2024-11-10', 'pago', (SELECT id FROM categorias WHERE natureza = 'receita' AND nome = 'Vendas' LIMIT 1), (SELECT id FROM contas_financeiras LIMIT 1), 'Gamma Serviços', 'Produtos diversos', (SELECT id FROM auth.users LIMIT 1)),
('Salários e encargos', 15000.00, 'despesa', '2024-11-01', '2024-11-05', 'pago', (SELECT id FROM categorias WHERE natureza = 'despesa' AND nome = 'Serviços' LIMIT 1), (SELECT id FROM contas_financeiras LIMIT 1), 'Funcionários', 'Salários mensais', (SELECT id FROM auth.users LIMIT 1)),
('Aluguel do escritório', 3500.00, 'despesa', '2024-11-01', '2024-11-05', 'pago', (SELECT id FROM categorias WHERE natureza = 'despesa' AND nome = 'Aluguéis' LIMIT 1), (SELECT id FROM contas_financeiras LIMIT 1), 'Imobiliária Central', 'Aluguel mensal', (SELECT id FROM auth.users LIMIT 1));

-- 6. Atualizar alguns lançamentos para ter datas de pagamento
UPDATE lancamentos 
SET data_pagamento = data_vencimento 
WHERE status = 'pago' AND data_pagamento IS NULL;

-- 7. Verificar se os dados foram inseridos
SELECT 'Cedentes inseridos:' as info, COUNT(*) as total FROM cedentes;
SELECT 'Sacados inseridos:' as info, COUNT(*) as total FROM sacados;
SELECT 'Lançamentos inseridos:' as info, COUNT(*) as total FROM lancamentos;
SELECT 'Receitas:' as info, COUNT(*) as total FROM lancamentos WHERE natureza = 'receita';
SELECT 'Despesas:' as info, COUNT(*) as total FROM lancamentos WHERE natureza = 'despesa';
