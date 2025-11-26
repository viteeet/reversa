# Guia de Verificação do Supabase

Este guia explica como verificar se o banco de dados Supabase está configurado corretamente para o projeto.

## 📋 Scripts Disponíveis

1. **`VERIFICACAO_SUPABASE_COMPLETA.sql`** - Script de verificação completa
2. **`CORRECAO_SUPABASE_IF_NEEDED.sql`** - Script de correção automática

## 🚀 Como Usar

### Passo 1: Verificar o Estado Atual

1. Abra o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Copie e cole o conteúdo de `VERIFICACAO_SUPABASE_COMPLETA.sql`
4. Execute o script
5. Analise os resultados:

   - ✅ **OK** - Tudo está correto
   - ❌ **FALTANDO** - Algo não existe e precisa ser criado
   - ⚠️ **VERIFICAR** - Pode estar OK, mas merece atenção

### Passo 2: Corrigir Problemas (se necessário)

Se o script de verificação mostrar problemas:

1. No **SQL Editor**, copie e cole o conteúdo de `CORRECAO_SUPABASE_IF_NEEDED.sql`
2. Execute o script (ele é idempotente, pode executar várias vezes sem problemas)
3. Execute novamente o script de verificação para confirmar

## ✅ O Que é Verificado

### 1. Tabelas Principais
- `cedentes`
- `sacados`

### 2. Colunas da Tabela `sacados`
Verifica se todas as colunas necessárias existem:
- `cnpj`, `razao_social`, `nome_fantasia`
- `endereco_receita`, `telefone_receita`, `email_receita`
- `situacao`, `porte`, `natureza_juridica`, `data_abertura`
- `capital_social`, `atividade_principal_codigo`, `atividade_principal_descricao`
- `atividades_secundarias`, `simples_nacional`, `cedente_id`
- `ultima_atualizacao`

### 3. Tabelas Complementares de Sacados
- `sacados_qsa`
- `sacados_enderecos`
- `sacados_telefones`
- `sacados_emails`
- `sacados_pessoas_ligadas`
- `sacados_empresas_ligadas`
- `sacados_processos`
- `sacados_observacoes_gerais`
- `sacados_qsa_detalhes`

### 4. Tabelas Complementares de Cedentes
- `cedentes_qsa`
- `cedentes_enderecos`
- `cedentes_telefones`
- `cedentes_emails`
- `cedentes_pessoas_ligadas`
- `cedentes_empresas_ligadas`
- `cedentes_processos`
- `cedentes_observacoes_gerais`
- `cedentes_qsa_detalhes`

### 5. Colunas Específicas
- Campos de `pessoas_ligadas` (telefone, email, endereco, cidade, estado)
- Campo `processos_texto` em `observacoes_gerais`

### 6. Relacionamentos (Foreign Keys)
- Verifica se todas as FKs estão corretas

### 7. Políticas RLS (Row Level Security)
- Verifica se RLS está habilitado
- Verifica se as políticas necessárias existem

### 8. Índices
- Verifica se os índices importantes existem

## 🔧 O Que o Script de Correção Faz

O script de correção (`CORRECAO_SUPABASE_IF_NEEDED.sql`) é **idempotente** e:

1. ✅ Adiciona colunas faltantes na tabela `sacados`
2. ✅ Adiciona campos em `pessoas_ligadas` (telefone, email, endereco, cidade, estado)
3. ✅ Adiciona campo `processos_texto` nas observações gerais
4. ✅ Cria tabelas `qsa_detalhes` se não existirem
5. ✅ Cria tabelas `observacoes_gerais` se não existirem
6. ✅ Cria índices necessários
7. ✅ Habilita RLS nas tabelas
8. ✅ Cria políticas RLS necessárias
9. ✅ Recarrega o cache do PostgREST

## 📝 Observações Importantes

### Recarregar Cache do PostgREST

Após executar scripts de correção, o cache do PostgREST é recarregado automaticamente com:
```sql
NOTIFY pgrst, 'reload schema';
```

Se você fez alterações manuais e não vê os resultados, execute este comando manualmente.

### Execução Segura

O script de correção usa `IF NOT EXISTS` e `ADD COLUMN IF NOT EXISTS`, então:
- ✅ Pode ser executado múltiplas vezes sem problemas
- ✅ Não sobrescreve dados existentes
- ✅ Só adiciona o que está faltando

## 🐛 Problemas Comuns

### "Tabela não existe"
Execute o script de correção. Se o problema persistir, verifique se você está no schema correto (`public`).

### "Permission denied"
Verifique se você tem permissões de administrador no Supabase.

### "Column already exists"
Isso é normal - o script verifica antes de adicionar. Pode ignorar.

### "Política já existe"
Isso é normal - o script verifica antes de criar. Pode ignorar.

## 📞 Próximos Passos

Após verificar e corrigir:

1. ✅ Execute novamente a verificação
2. ✅ Teste a aplicação
3. ✅ Verifique se os dados estão sendo salvos corretamente

## 🔗 Scripts Relacionados

Se precisar criar tudo do zero, execute na ordem:

1. Scripts de criação de tabelas principais
2. `database_schema_complementos.sql` (ou `database_schema_complementos_cedentes.sql`)
3. `database_schema_processos_observacoes.sql`
4. `database_schema_processos_detalhes_qsa.sql`
5. `database_update_pessoas_ligadas_add_campos.sql` (se necessário)
6. `VERIFICACAO_SUPABASE_COMPLETA.sql` (verificar)
7. `CORRECAO_SUPABASE_IF_NEEDED.sql` (corrigir se necessário)

