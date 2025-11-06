#!/usr/bin/env node

/**
 * Script que gera APENAS o SQL puro, sem separadores visuais
 * 
 * Uso: node scripts/get-sql-only.js > sql.sql
 *      ou
 *      node scripts/get-sql-only.js | clip  (no Windows para copiar)
 */

const fs = require('fs');
const path = require('path');

const sqlFile = path.join(__dirname, '..', 'database_update_pessoas_ligadas_add_campos.sql');

if (fs.existsSync(sqlFile)) {
  const sql = fs.readFileSync(sqlFile, 'utf8');
  // Remove apenas comentários de instrução se houver, mas mantém comentários SQL
  console.log(sql.trim());
} else {
  console.error('❌ Arquivo SQL não encontrado:', sqlFile);
  process.exit(1);
}

