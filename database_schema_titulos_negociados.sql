-- ================================================================================
-- TÍTULOS NEGOCIADOS - SISTEMA OPERACIONAL
-- ================================================================================
-- Este script cria as tabelas para gerenciar títulos negociados (operacional)
-- Estrutura: CEDENTE → TÍTULOS NEGOCIADOS → PARCELAMENTOS → PARCELAS
-- Execute este script no Supabase SQL Editor

-- ================================================================================
-- 1. TABELA: titulos_negociados
-- ================================================================================
-- Armazena os títulos vencidos cadastrados dentro de cada cedente

CREATE TABLE IF NOT EXISTS titulos_negociados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedente_id UUID NOT NULL REFERENCES cedentes(id) ON DELETE CASCADE,
  sacado_cnpj VARCHAR(18) NOT NULL REFERENCES sacados(cnpj) ON DELETE CASCADE,
  
  -- Dados do título
  numero_titulo VARCHAR(100) NOT NULL, -- Número do título/documento (Duplicata)
  valor_original DECIMAL(15,2) NOT NULL,
  valor_atualizado DECIMAL(15,2) NOT NULL, -- Valor com juros/multa
  data_vencimento_original DATE NOT NULL,
  data_entrada_sistema DATE NOT NULL DEFAULT CURRENT_DATE,
  telefone VARCHAR(20),
  
  -- Status e observações
  status VARCHAR(50) DEFAULT 'vencido', -- 'vencido', 'renegociado', 'parcelado', 'pago', 'cancelado'
  critica VARCHAR(100), -- 'Protestado', 'Enviado a Cartório', 'Recebido Instrumento de Protesto', etc.
  checagem TEXT, -- Observações/notas sobre confirmação
  vadu VARCHAR(100), -- Status de autorização
  
  -- Controle
  ativo BOOLEAN DEFAULT true,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: não permitir títulos duplicados para o mesmo cedente
  CONSTRAINT unique_titulo_cedente UNIQUE (cedente_id, numero_titulo)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_titulos_negociados_cedente_id ON titulos_negociados(cedente_id);
CREATE INDEX IF NOT EXISTS idx_titulos_negociados_sacado_cnpj ON titulos_negociados(sacado_cnpj);
CREATE INDEX IF NOT EXISTS idx_titulos_negociados_status ON titulos_negociados(status);
CREATE INDEX IF NOT EXISTS idx_titulos_negociados_data_vencimento ON titulos_negociados(data_vencimento_original);
CREATE INDEX IF NOT EXISTS idx_titulos_negociados_ativo ON titulos_negociados(ativo);

-- ================================================================================
-- 2. TABELA: parcelamentos
-- ================================================================================
-- Armazena os parcelamentos/renegociações criados a partir de títulos

CREATE TABLE IF NOT EXISTS parcelamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedente_id UUID NOT NULL REFERENCES cedentes(id) ON DELETE CASCADE,
  
  -- Dados do parcelamento
  descricao VARCHAR(255), -- Descrição opcional do parcelamento
  valor_total_negociado DECIMAL(15,2) NOT NULL, -- Valor total do acordo (soma dos títulos + juros)
  taxa_juros DECIMAL(5,2), -- Taxa de juros aplicada (opcional)
  data_primeira_parcela DATE NOT NULL,
  intervalo_parcelas VARCHAR(50) NOT NULL DEFAULT 'mensal', -- 'mensal', 'quinzenal', 'personalizado'
  intervalo_dias INTEGER, -- Para intervalo personalizado (número de dias)
  
  -- Controle
  status VARCHAR(50) DEFAULT 'ativo', -- 'ativo', 'pago', 'cancelado'
  observacoes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_parcelamentos_cedente_id ON parcelamentos(cedente_id);
CREATE INDEX IF NOT EXISTS idx_parcelamentos_status ON parcelamentos(status);

-- ================================================================================
-- 3. TABELA: parcelamentos_titulos
-- ================================================================================
-- Relaciona quais títulos foram incluídos em cada parcelamento

CREATE TABLE IF NOT EXISTS parcelamentos_titulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcelamento_id UUID NOT NULL REFERENCES parcelamentos(id) ON DELETE CASCADE,
  titulo_id UUID NOT NULL REFERENCES titulos_negociados(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: não permitir o mesmo título em múltiplos parcelamentos ativos
  CONSTRAINT unique_titulo_parcelamento UNIQUE (titulo_id, parcelamento_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_parcelamentos_titulos_parcelamento_id ON parcelamentos_titulos(parcelamento_id);
CREATE INDEX IF NOT EXISTS idx_parcelamentos_titulos_titulo_id ON parcelamentos_titulos(titulo_id);

-- ================================================================================
-- 4. TABELA: parcelas
-- ================================================================================
-- Armazena as parcelas geradas a partir dos parcelamentos

CREATE TABLE IF NOT EXISTS parcelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcelamento_id UUID NOT NULL REFERENCES parcelamentos(id) ON DELETE CASCADE,
  
  -- Dados da parcela
  numero_parcela INTEGER NOT NULL, -- 1, 2, 3, etc.
  valor DECIMAL(15,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'a_vencer', -- 'a_vencer', 'vencida', 'paga', 'cancelada'
  data_pagamento DATE,
  valor_pago DECIMAL(15,2),
  observacoes TEXT,
  
  -- Controle
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: não permitir parcelas duplicadas no mesmo parcelamento
  CONSTRAINT unique_parcela_parcelamento UNIQUE (parcelamento_id, numero_parcela)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_parcelas_parcelamento_id ON parcelas(parcelamento_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_status ON parcelas(status);
CREATE INDEX IF NOT EXISTS idx_parcelas_data_vencimento ON parcelas(data_vencimento);

-- ================================================================================
-- 5. RLS (Row Level Security)
-- ================================================================================

ALTER TABLE titulos_negociados ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcelamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcelamentos_titulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcelas ENABLE ROW LEVEL SECURITY;

-- Políticas para titulos_negociados
CREATE POLICY "Usuários autenticados podem ver títulos negociados" 
  ON titulos_negociados FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir títulos negociados" 
  ON titulos_negociados FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar títulos negociados" 
  ON titulos_negociados FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar títulos negociados" 
  ON titulos_negociados FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Políticas para parcelamentos
CREATE POLICY "Usuários autenticados podem ver parcelamentos" 
  ON parcelamentos FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir parcelamentos" 
  ON parcelamentos FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar parcelamentos" 
  ON parcelamentos FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar parcelamentos" 
  ON parcelamentos FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Políticas para parcelamentos_titulos
CREATE POLICY "Usuários autenticados podem ver parcelamentos_titulos" 
  ON parcelamentos_titulos FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir parcelamentos_titulos" 
  ON parcelamentos_titulos FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar parcelamentos_titulos" 
  ON parcelamentos_titulos FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Políticas para parcelas
CREATE POLICY "Usuários autenticados podem ver parcelas" 
  ON parcelas FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir parcelas" 
  ON parcelas FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar parcelas" 
  ON parcelas FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar parcelas" 
  ON parcelas FOR DELETE 
  USING (auth.role() = 'authenticated');

-- ================================================================================
-- 6. COMENTÁRIOS
-- ================================================================================

COMMENT ON TABLE titulos_negociados IS 'Títulos vencidos cadastrados dentro de cada cedente (sistema operacional)';
COMMENT ON TABLE parcelamentos IS 'Parcelamentos/renegociações criados a partir de títulos';
COMMENT ON TABLE parcelamentos_titulos IS 'Relaciona quais títulos foram incluídos em cada parcelamento';
COMMENT ON TABLE parcelas IS 'Parcelas geradas a partir dos parcelamentos';

COMMENT ON COLUMN titulos_negociados.status IS 'Status do título: vencido, renegociado, parcelado, pago, cancelado';
COMMENT ON COLUMN titulos_negociados.critica IS 'Status crítico: Protestado, Enviado a Cartório, etc.';
COMMENT ON COLUMN titulos_negociados.checagem IS 'Observações sobre confirmação/checagem';
COMMENT ON COLUMN titulos_negociados.vadu IS 'Status de autorização VADU';

COMMENT ON COLUMN parcelamentos.intervalo_parcelas IS 'Tipo de intervalo: mensal, quinzenal, personalizado';
COMMENT ON COLUMN parcelamentos.intervalo_dias IS 'Número de dias para intervalo personalizado';

COMMENT ON COLUMN parcelas.status IS 'Status da parcela: a_vencer, vencida, paga, cancelada';

-- ================================================================================
-- 7. TRIGGERS PARA updated_at
-- ================================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_titulos_negociados_updated_at 
  BEFORE UPDATE ON titulos_negociados 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parcelamentos_updated_at 
  BEFORE UPDATE ON parcelamentos 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parcelas_updated_at 
  BEFORE UPDATE ON parcelas 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================================
-- 8. FUNÇÃO: Atualizar status dos títulos quando parcelados
-- ================================================================================
-- Esta função será chamada quando um parcelamento for criado
-- para atualizar o status dos títulos para "Renegociado"

CREATE OR REPLACE FUNCTION atualizar_status_titulos_parcelados()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualiza o status dos títulos relacionados para "renegociado"
  UPDATE titulos_negociados
  SET status = 'renegociado',
      updated_at = NOW()
  WHERE id IN (
    SELECT titulo_id 
    FROM parcelamentos_titulos 
    WHERE parcelamento_id = NEW.id
  );
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_atualizar_status_titulos_parcelados
  AFTER INSERT ON parcelamentos_titulos
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_status_titulos_parcelados();

-- ================================================================================
-- FIM DO SCRIPT
-- ================================================================================

