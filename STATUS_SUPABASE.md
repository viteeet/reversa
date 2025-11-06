# Status do Supabase - Atualização

## ✅ Schema Atualizado

O schema do Supabase está **atualizado** com todas as mudanças recentes.

### Tabela `cedentes_pessoas_ligadas`

**Status**: ✅ **Atualizada**

A tabela agora inclui os campos de familiares mesclados:

- ✅ `telefone` (VARCHAR(20))
- ✅ `email` (VARCHAR(255))
- ✅ `endereco` (TEXT)
- ✅ `cidade` (VARCHAR(100))
- ✅ `estado` (VARCHAR(2))

**Campos existentes**:
- `id` (UUID PRIMARY KEY)
- `cedente_id` (UUID, FK)
- `cpf` (VARCHAR(14))
- `nome` (VARCHAR(255) NOT NULL)
- `tipo_relacionamento` (VARCHAR(100)) - inclui opções: pai, mae, conjuge, filho, filha, irmao, irma, avô, avó, neto, neta, socio, administrador, outro
- `observacoes` (TEXT)
- `origem` (VARCHAR(50))
- `ativo` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

## 📋 Scripts Disponíveis

### Para Instalação Nova
**Arquivo**: `database_schema_complementos_cedentes.sql`
- ✅ Cria todas as tabelas com os campos atualizados
- ✅ Inclui RLS (Row Level Security)
- ✅ Inclui políticas de acesso
- ✅ Inclui índices e constraints

### Para Atualização de Instalação Existente
**Arquivo**: `database_update_pessoas_ligadas_add_campos.sql`
- ✅ Adiciona os novos campos (telefone, email, endereco, cidade, estado)
- ✅ Verifica se os campos já existem antes de adicionar
- ✅ Adiciona comentários nas colunas
- ✅ Cria índices opcionais para melhor performance

## 🚀 Como Atualizar

### Se você já tem o banco configurado:

1. **Execute o script de atualização**:
   - Abra o Supabase SQL Editor
   - Copie e cole o conteúdo de `database_update_pessoas_ligadas_add_campos.sql`
   - Execute o script

### Se você está criando um novo banco:

1. **Execute o script principal**:
   - Execute `database_schema_complementos_cedentes.sql`
   - Este script já inclui todos os campos atualizados

## ✅ Verificação

Para verificar se a tabela está atualizada, execute no Supabase SQL Editor:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'cedentes_pessoas_ligadas'
ORDER BY ordinal_position;
```

Você deve ver as colunas:
- `telefone`
- `email`
- `endereco`
- `cidade`
- `estado`

## 📊 Índices

Os seguintes índices foram adicionados para melhorar performance:

- `idx_cedentes_pessoas_ligadas_cedente_id` (já existia)
- `idx_cedentes_pessoas_ligadas_telefone` (novo)
- `idx_cedentes_pessoas_ligadas_email` (novo)
- `idx_cedentes_pessoas_ligadas_cidade` (novo)
- `idx_cedentes_pessoas_ligadas_estado` (novo)

## 🔒 Segurança (RLS)

✅ Row Level Security está habilitado
✅ Políticas de acesso configuradas para usuários autenticados

## 📝 Notas

- A categoria "Familiares" foi **mesclada** com "Pessoas Ligadas"
- O campo `tipo_relacionamento` agora inclui opções de parentesco familiar
- Todos os campos são opcionais (exceto `nome` e `cedente_id`)
- O sistema de soft delete está funcionando com o campo `ativo`

---

**Última atualização**: Baseado nas mudanças recentes que mesclaram "Familiares" em "Pessoas Ligadas"

