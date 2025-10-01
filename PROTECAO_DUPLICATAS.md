# ✅ Proteção Contra Duplicatas - Implementado!

## 🎯 Problema Resolvido

Se você clicar em **"Buscar da API"** múltiplas vezes, o sistema **NÃO criará duplicatas**!

---

## 🛡️ Duas Camadas de Proteção

### 1️⃣ Proteção na Aplicação (Código)

**Como funciona:**
1. Quando você clica "Buscar da API"
2. O sistema **deleta** dados antigos com `origem='api'`
3. Depois **insere** os novos dados da API
4. **Dados manuais permanecem intactos** (não são deletados)

**Arquivo:** `src/app/sacados/[cnpj]/editar/page.tsx`

```typescript
// PASSO 1: Remove dados antigos da API
await supabase
  .from(tableName)
  .delete()
  .eq('sacado_cnpj', cnpj)
  .eq('origem', 'api');  // ← Só remove dados da API

// PASSO 2: Insere novos dados
await supabase
  .from(tableName)
  .insert(newData);
```

---

### 2️⃣ Proteção no Banco de Dados (Constraints)

**Execute no Supabase SQL Editor:**

Arquivo: `database_constraints_anti_duplicatas.sql`

**O que faz:**
- Cria índices UNIQUE nas tabelas
- Previne duplicatas ao nível de banco
- Mesmo que o código tente inserir, o banco bloqueará

**Constraints criadas:**
```sql
-- QSA: Impede mesmo CPF + Qualificação para mesmo CNPJ
CREATE UNIQUE INDEX idx_unique_qsa 
ON sacados_qsa(sacado_cnpj, cpf, qualificacao) 
WHERE ativo = true;

-- Telefone: Impede mesmo telefone para mesmo CNPJ
CREATE UNIQUE INDEX idx_unique_telefone 
ON sacados_telefones(sacado_cnpj, telefone) 
WHERE ativo = true;

-- E-mail: Impede mesmo e-mail para mesmo CNPJ
CREATE UNIQUE INDEX idx_unique_email 
ON sacados_emails(sacado_cnpj, email) 
WHERE ativo = true;

-- Endereço: Impede mesmo endereço + CEP
CREATE UNIQUE INDEX idx_unique_endereco 
ON sacados_enderecos(sacado_cnpj, endereco, cep) 
WHERE ativo = true;

-- E assim por diante...
```

---

## 🎯 Comportamento do Sistema

### Cenário 1: Primeira vez buscando da API
```
✅ Busca API → Insere 3 telefones
Resultado: 3 telefones na tabela
```

### Cenário 2: Busca API novamente (mesmo CNPJ)
```
✅ Busca API → Remove 3 telefones antigos (origem='api')
✅ Insere 3 telefones novos
Resultado: Continua com 3 telefones (sem duplicatas!)
```

### Cenário 3: Busca API + Dados Manuais
```
Estado inicial: 3 telefones da API + 2 telefones manuais = 5 total

✅ Busca API novamente → Remove apenas os 3 da API
✅ Insere 3 novos da API
Resultado: 3 da API + 2 manuais = 5 total (sem duplicatas!)
```

### Cenário 4: Tentativa de duplicata manual
```
❌ Usuário tenta adicionar telefone que já existe
❌ Banco rejeita por causa da constraint UNIQUE
Resultado: Erro exibido, dados não duplicados
```

---

## 📋 Como Aplicar

### Passo 1: Código já está atualizado ✅
O código foi modificado automaticamente e já protege contra duplicatas.

### Passo 2: Execute o SQL no Supabase

1. Acesse: **Supabase Dashboard**
2. Vá em: **SQL Editor**
3. Clique: **New Query**
4. Cole o conteúdo de: `database_constraints_anti_duplicatas.sql`
5. Clique: **Run**

---

## 🧪 Como Testar

1. Busque dados da API (exemplo: telefones)
2. Veja que foram adicionados (exemplo: 2 telefones)
3. Clique em "Buscar da API" **novamente**
4. Verifique que continua com 2 telefones (sem duplicatas!)
5. Adicione 1 telefone manualmente
6. Busque API novamente
7. Verifique que tem 3 telefones (2 da API + 1 manual)

---

## ⚠️ Importante

### O que é deletado ao buscar da API:
- ✅ Dados com `origem='api'`

### O que NÃO é deletado:
- ✅ Dados com `origem='manual'`
- ✅ Dados adicionados manualmente pelo usuário

### Se tentar adicionar duplicata manualmente:
- ❌ Banco de dados rejeita (após executar constraints)
- ⚠️ Mensagem de erro é exibida
- 💡 Solução: Edite o registro existente

---

## 🔍 Verificar se Constraints Foram Criadas

Execute no Supabase SQL Editor:

```sql
SELECT 
  indexname, 
  tablename 
FROM pg_indexes 
WHERE tablename LIKE 'sacados_%' 
  AND indexname LIKE 'idx_unique%';
```

**Deve retornar 7 índices:**
- idx_unique_qsa
- idx_unique_endereco
- idx_unique_telefone
- idx_unique_email
- idx_unique_pessoa_ligada
- idx_unique_empresa_ligada
- idx_unique_processo

---

## 🎉 Benefícios

✅ **Sem duplicatas** mesmo clicando várias vezes  
✅ **Dados manuais protegidos** (não são deletados)  
✅ **Atualização automática** dos dados da API  
✅ **Proteção em duas camadas** (código + banco)  
✅ **Performance mantida** (índices otimizados)  

---

## 💡 Lógica de Origem

Cada registro tem um campo `origem`:

- **`origem='api'`** 
  - Dados buscados da BigData
  - São substituídos ao buscar novamente
  - Identificados com badge "API" na interface

- **`origem='manual'`**
  - Dados adicionados pelo usuário
  - **Nunca são deletados** automaticamente
  - Identificados com badge "Manual" na interface

---

**Sistema totalmente protegido contra duplicatas!** 🛡️

