#!/usr/bin/env node

/**
 * Script automatizado para atualizar o schema do Supabase
 * 
 * Este script mostra o SQL e abre o Supabase Dashboard
 * 
 * Uso: node scripts/update-schema-auto.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🚀 Atualizador Automático de Schema do Supabase\n');
  console.log('Este script irá mostrar o SQL para atualizar a tabela cedentes_pessoas_ligadas\n');

  console.log('📋 SQL que será executado:');
  console.log('─'.repeat(60));
  
  const sqlFile = path.join(__dirname, '..', 'database_update_pessoas_ligadas_add_campos.sql');
  
  if (fs.existsSync(sqlFile)) {
    const sql = fs.readFileSync(sqlFile, 'utf8');
    console.log(sql);
  } else {
    console.log('Arquivo SQL não encontrado');
  }
  
  console.log('─'.repeat(60));
  console.log('\n');

  const answer = await question('Deseja executar este SQL no Supabase agora? (s/n): ');
  
  if (answer.toLowerCase() !== 's' && answer.toLowerCase() !== 'sim') {
    console.log('❌ Cancelado pelo usuário.');
    rl.close();
    return;
  }

  console.log('\n📝 Como executar:');
  console.log('1. Abra o Supabase Dashboard: https://supabase.com/dashboard');
  console.log('2. Selecione seu projeto');
  console.log('3. Vá em SQL Editor (menu lateral)');
  console.log('4. Cole o SQL acima');
  console.log('5. Clique em Run\n');

  const open = await question('Deseja abrir o Supabase Dashboard no navegador? (s/n): ');
  
  if (open.toLowerCase() === 's' || open.toLowerCase() === 'sim') {
    const { exec } = require('child_process');
    const url = supabaseUrl.replace(/\/$/, '');
    const projectId = url.split('//')[1]?.split('.')[0];
    
    if (projectId) {
      exec(`start https://supabase.com/dashboard/project/${projectId}/sql`);
    } else {
      exec('start https://supabase.com/dashboard');
    }
    
    console.log('✅ Abrindo Supabase Dashboard...\n');
  }

  console.log('✅ Pronto! Copie o SQL acima e cole no Supabase SQL Editor.');
  console.log('   Após executar, a tabela cedentes_pessoas_ligadas estará atualizada.\n');

  rl.close();
}

main().catch(console.error);

