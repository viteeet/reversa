-- Script para adicionar campos de telefone, email e endereço na tabela cedentes_pessoas_ligadas
-- Execute este script no Supabase SQL Editor

-- Adiciona colunas de telefone, email e endereço (se não existirem)
DO $$ 
BEGIN
  -- Adiciona coluna telefone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cedentes_pessoas_ligadas' AND column_name = 'telefone'
  ) THEN
    ALTER TABLE cedentes_pessoas_ligadas ADD COLUMN telefone VARCHAR(20);
  END IF;

  -- Adiciona coluna email
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cedentes_pessoas_ligadas' AND column_name = 'email'
  ) THEN
    ALTER TABLE cedentes_pessoas_ligadas ADD COLUMN email VARCHAR(255);
  END IF;

  -- Adiciona coluna endereco
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cedentes_pessoas_ligadas' AND column_name = 'endereco'
  ) THEN
    ALTER TABLE cedentes_pessoas_ligadas ADD COLUMN endereco TEXT;
  END IF;

  -- Adiciona coluna cidade
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cedentes_pessoas_ligadas' AND column_name = 'cidade'
  ) THEN
    ALTER TABLE cedentes_pessoas_ligadas ADD COLUMN cidade VARCHAR(100);
  END IF;

  -- Adiciona coluna estado
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cedentes_pessoas_ligadas' AND column_name = 'estado'
  ) THEN
    ALTER TABLE cedentes_pessoas_ligadas ADD COLUMN estado VARCHAR(2);
  END IF;
END $$;

-- Comentários nas colunas para documentação
COMMENT ON COLUMN cedentes_pessoas_ligadas.telefone IS 'Telefone de contato da pessoa ligada';
COMMENT ON COLUMN cedentes_pessoas_ligadas.email IS 'E-mail de contato da pessoa ligada';
COMMENT ON COLUMN cedentes_pessoas_ligadas.endereco IS 'Endereço completo da pessoa ligada';
COMMENT ON COLUMN cedentes_pessoas_ligadas.cidade IS 'Cidade do endereço';
COMMENT ON COLUMN cedentes_pessoas_ligadas.estado IS 'Estado (UF) do endereço';

