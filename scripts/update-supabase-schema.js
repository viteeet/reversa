#!/usr/bin/env node

/**
 * Script para atualizar o schema do Supabase
 * Executa o script SQL para adicionar campos na tabela cedentes_pessoas_ligadas
 * 
 * Uso: node scripts/update-supabase-schema.js
 * 
 * Requisitos:
 * - NEXT_PUBLIC_SUPABASE_URL no .env.local
 * - SUPABASE_SERVICE_ROLE_KEY no .env.local (ou SUPABASE_SERVICE_KEY)
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL não encontrado no .env.local');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('❌ Erro: SUPABASE_SERVICE_ROLE_KEY não encontrado no .env.local');
  console.error('📝 Para obter a service role key:');
  console.error('   1. Vá para https://supabase.com/dashboard');
  console.error('   2. Selecione seu projeto');
  console.error('   3. Vá em Settings > API');
  console.error('   4. Copie a "service_role" key (NÃO a anon key)');
  console.error('   5. Adicione no .env.local como: SUPABASE_SERVICE_ROLE_KEY=sua-chave-aqui');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const sqlScript = `
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

-- Índices opcionais para melhorar performance em buscas (se não existirem)
CREATE INDEX IF NOT EXISTS idx_cedentes_pessoas_ligadas_telefone ON cedentes_pessoas_ligadas(telefone);
CREATE INDEX IF NOT EXISTS idx_cedentes_pessoas_ligadas_email ON cedentes_pessoas_ligadas(email);
CREATE INDEX IF NOT EXISTS idx_cedentes_pessoas_ligadas_cidade ON cedentes_pessoas_ligadas(cidade);
CREATE INDEX IF NOT EXISTS idx_cedentes_pessoas_ligadas_estado ON cedentes_pessoas_ligadas(estado);
`;

async function executeUpdate() {
  console.log('🔄 Executando atualização do schema do Supabase...\n');

  try {
    // Executa o SQL via RPC (se disponível) ou via fetch direto
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({ sql: sqlScript })
    });

    // Se não houver função RPC, tenta executar diretamente via PostgREST
    // Infelizmente, o Supabase não permite executar DDL via PostgREST diretamente
    // Vamos usar uma abordagem diferente: executar via fetch para a API SQL
    
    console.log('⚠️  O Supabase não permite executar DDL via API REST diretamente.');
    console.log('📝 Você precisa executar o script SQL manualmente no Supabase Dashboard.\n');
    console.log('📋 Script SQL:');
    console.log('─'.repeat(60));
    console.log(sqlScript);
    console.log('─'.repeat(60));
    console.log('\n✅ Script gerado! Copie e cole no Supabase SQL Editor.');
    console.log('   URL: https://supabase.com/dashboard/project/[seu-projeto]/sql\n');

    // Alternativa: tentar criar uma função RPC que execute o SQL
    console.log('💡 Alternativa: Criando função RPC no Supabase...');
    
    // Nota: Esta abordagem requer que a função já exista no banco
    // Por enquanto, vamos apenas mostrar o script
    
  } catch (error) {
    console.error('❌ Erro ao executar:', error.message);
    console.log('\n📝 Solução alternativa: Execute o script SQL manualmente.');
    console.log('   Arquivo: database_update_pessoas_ligadas_add_campos.sql\n');
    process.exit(1);
  }
}

executeUpdate();

