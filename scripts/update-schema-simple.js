#!/usr/bin/env node

/**
 * Script simples para mostrar o SQL de atualização
 * 
 * Uso: npm run update-schema
 */

const fs = require('fs');
const path = require('path');

const sqlFile = path.join(__dirname, '..', 'database_update_pessoas_ligadas_add_campos.sql');

console.log('\n🚀 Atualização do Schema do Supabase\n');
console.log('📋 SQL para atualizar a tabela cedentes_pessoas_ligadas\n');
console.log('─'.repeat(70));
console.log('');

if (fs.existsSync(sqlFile)) {
  const sql = fs.readFileSync(sqlFile, 'utf8');
  // Mostra apenas o SQL, sem separadores que possam causar erro
  console.log(sql.trim());
  console.log('');
  console.log('─'.repeat(70));
  console.log('\n📝 INSTRUÇÕES:');
  console.log('1. Copie APENAS o SQL acima (sem as linhas de separação)');
  console.log('2. Abra: https://supabase.com/dashboard');
  console.log('3. Selecione seu projeto');
  console.log('4. Vá em SQL Editor (menu lateral)');
  console.log('5. Cole o SQL e clique em Run');
  console.log('\n💡 DICA: Abra o arquivo UPDATE_SCHEMA_SQL.sql para copiar o SQL limpo!');
  console.log('\n✅ Após executar, a tabela estará atualizada!\n');
} else {
  console.error('❌ Arquivo SQL não encontrado:', sqlFile);
  process.exit(1);
}

