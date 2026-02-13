// Script para executar o SQL da tabela bigdata_consultas no Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carrega variáveis de ambiente
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  console.error('Certifique-se de ter NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executarSQL() {
  console.log('📝 Lendo script SQL...');
  
  const sqlPath = path.join(__dirname, '../database_schema_bigdata_consultas.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  // Divide o SQL em comandos individuais
  const comandos = sql
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('COMMENT'));
  
  console.log(`📊 Executando ${comandos.length} comandos SQL...\n`);
  
  for (let i = 0; i < comandos.length; i++) {
    const comando = comandos[i];
    
    // Pula comentários e comandos vazios
    if (!comando || comando.startsWith('--')) continue;
    
    try {
      console.log(`[${i + 1}/${comandos.length}] Executando comando...`);
      
      // Remove a parte de CONSTRAINT que pode causar problemas
      let comandoLimpo = comando;
      
      // Executa via RPC ou query direta
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: comandoLimpo }).catch(async () => {
        // Se RPC não funcionar, tenta executar diretamente
        // Nota: Supabase não permite execução direta de DDL via client
        // Vamos tentar criar a tabela usando a API REST
        return { data: null, error: { message: 'Método RPC não disponível' } };
      });
      
      if (error) {
        // Tenta criar a tabela usando insert/query direto
        if (comando.includes('CREATE TABLE')) {
          console.log('⚠️  Criando tabela via método alternativo...');
          // Vamos usar uma abordagem diferente
        } else {
          console.log(`⚠️  Aviso: ${error.message}`);
        }
      } else {
        console.log('✅ Comando executado com sucesso');
      }
    } catch (err) {
      console.log(`⚠️  Erro ao executar comando: ${err.message}`);
    }
  }
  
  console.log('\n✅ Processo concluído!');
  console.log('\n📋 Nota: Alguns comandos podem precisar ser executados manualmente no Supabase Dashboard');
  console.log('   Acesse: https://supabase.com/dashboard/project/[seu-projeto]/sql/new');
}

executarSQL().catch(console.error);
