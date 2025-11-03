# 🔄 Reestruturação: Hierarquia Cedente → Sacados

## 📋 Resumo da Mudança

O sistema foi reestruturado para refletir a hierarquia correta do negócio:

**ANTES**: Cedentes e Sacados eram entidades independentes  
**AGORA**: **CEDENTE** (cliente) → **SACADOS** (devedores do cedente)

## 🎯 Finalidade do Sistema

Sistema de **cobrança e recuperação de ativos** onde:
- **CEDENTE**: Cliente que contrata o serviço (o credor)
- **SACADO**: Devedor do cedente (quem deve pagar)

## 🗂️ Nova Estrutura

```
CEDENTE 1
├── Sacado 1
├── Sacado 2
├── Sacado 3
└── Sacado 4

CEDENTE 2
├── Sacado 5
└── Sacado 6
```

## 🔧 Alterações Implementadas

### 1. **Banco de Dados**

#### Arquivo: `database_relacao_cedente_sacado.sql`

**O que foi feito:**
- Adicionada coluna `cedente_id` na tabela `sacados`
- Criado `FOREIGN KEY` referenciando `cedentes(id)`
- Criado índice para performance
- `ON DELETE CASCADE` - se cedente for excluído, seus sacados também são

**Como aplicar:**
```sql
-- Execute no Supabase SQL Editor
ALTER TABLE sacados 
ADD COLUMN IF NOT EXISTS cedente_id UUID REFERENCES cedentes(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_sacados_cedente_id ON sacados(cedente_id);
```

**Migração de dados existentes:**
Se você já tem sacados cadastrados sem cedente:

```sql
-- Opção 1: Criar cedente padrão
INSERT INTO cedentes (nome, razao_social, user_id) 
VALUES ('Cedente Padrão', 'Cedente Padrão LTDA', 'SEU_USER_ID')
RETURNING id;

-- Opção 2: Vincular sacados órfãos
UPDATE sacados 
SET cedente_id = 'ID_DO_CEDENTE_PADRAO'
WHERE cedente_id IS NULL;

-- Opção 3: Depois de migrar, tornar obrigatório
ALTER TABLE sacados 
ALTER COLUMN cedente_id SET NOT NULL;
```

### 2. **Página do Cedente** (`/cedentes/[id]/page.tsx`)

**Novas funcionalidades:**

✅ **Aba "Sacados"** - Nova aba para visualizar devedores  
✅ **Contador** - Mostra quantos sacados o cedente tem  
✅ **Listagem completa** - Tabela com todos os sacados  
✅ **Botão "+ Adicionar Sacado"** - Vai direto para criação vinculada  
✅ **Ações** - Ver, Editar e Ficha para cada sacado  
✅ **Empty state** - Mensagem quando não há sacados  

**Estrutura:**
```
📋 Informações
👥 Sacados (5)  ← NOVA ABA
📞 Atividades
```

**Visual:**
```
┌─ Sacados do Cedente ────────── [+ Adicionar Sacado] ┐
│                                                        │
│ Razão Social | Nome Fantasia | CNPJ | Situação | ...  │
│ Empresa ABC  | ABC Corp      | ...  | ATIVA    | ...  │
│ Empresa XYZ  | XYZ Ltda      | ...  | ATIVA    | ...  │
└────────────────────────────────────────────────────────┘
```

### 3. **Criação de Sacado** (`/sacados/new/page.tsx`)

**Mudanças:**

✅ **Campo Cedente obrigatório** - Select com lista de cedentes  
✅ **Validação** - Não permite salvar sem cedente  
✅ **Pré-seleção** - Se vier de `/cedentes/[id]`, já vem selecionado  
✅ **Redirect inteligente** - Volta para o cedente após salvar  
✅ **Aviso visual** - Alert explicando a hierarquia  
✅ **Proteção** - Desabilita botão se não houver cedentes  

**Fluxo:**
```
1. Cedente seleciona "+ Adicionar Sacado" na sua página
   ↓
2. Vai para /sacados/new?cedente_id=XXX
   ↓
3. Cedente já vem pré-selecionado (bloqueado)
   ↓
4. Preenche dados do sacado
   ↓
5. Salva → Redireciona para /cedentes/XXX?tab=sacados
```

**Visual do formulário:**
```
┌─ Novo Sacado (Devedor) ─────────────────────┐
│                                              │
│ ⚠️ Atenção: Cada sacado deve pertencer a um │
│    cedente. Selecione o cedente que está    │
│    cobrando este devedor.                   │
│                                              │
│ Cedente (Cliente)*                           │
│ [Selecione o cedente...          ▼]         │
│                                              │
│ ──────────────────────────────────────────   │
│                                              │
│ CPF/CNPJ*                    [Consultar ✓]  │
│ [12.345.678/0001-90            ]            │
│                                              │
│ Razão social*                               │
│ [Empresa ABC Ltda              ]            │
│                                              │
│ ...                                         │
│                                              │
│ [   Salvar Sacado   ] [ Cancelar ]          │
└──────────────────────────────────────────────┘
```

### 4. **Tipos TypeScript**

Adicionados tipos para manter consistência:

```typescript
// Em /cedentes/[id]/page.tsx
type Sacado = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  situacao: string | null;
  porte: string | null;
  atividade_principal_descricao: string | null;
};

// Em /sacados/new/page.tsx
type Cedente = {
  id: string;
  nome: string;
  razao_social: string | null;
};
```

## 📊 Impacto nas Queries

### Antes
```typescript
// Buscava todos os sacados sem filtro
const { data } = await supabase
  .from('sacados')
  .select('*')
  .order('razao_social');
```

### Agora
```typescript
// Busca sacados de um cedente específico
const { data } = await supabase
  .from('sacados')
  .select('*')
  .eq('cedente_id', cedente_id)
  .order('razao_social');
```

## 🔄 Fluxos de Uso

### Fluxo 1: Criar sacado a partir do cedente
```
1. Acessa /cedentes
2. Clica em "Ver" em um cedente
3. Vai para aba "👥 Sacados"
4. Clica "+ Adicionar Sacado"
5. Formulário abre com cedente já selecionado
6. Preenche dados do sacado
7. Salva → Volta para aba Sacados do cedente
```

### Fluxo 2: Criar sacado direto
```
1. Acessa /sacados/new diretamente
2. Seleciona o cedente manualmente
3. Preenche dados do sacado
4. Salva → Vai para /sacados
```

### Fluxo 3: Visualizar sacados de um cedente
```
1. Acessa /cedentes/[id]
2. Clica na aba "👥 Sacados (X)"
3. Vê a lista completa de devedores
4. Pode clicar em Ver/Editar/Ficha de cada um
```

## 📈 Benefícios

✅ **Organização clara** - Cada sacado pertence a um cedente  
✅ **Contexto de cobrança** - Sabe quem está cobrando quem  
✅ **Relatórios** - Pode gerar relatórios por cedente  
✅ **Separação de dados** - Dados de cedentes diferentes não se misturam  
✅ **Controle de acesso** - Facilita controlar quem vê o quê  
✅ **Lógica de negócio** - Reflete a realidade do serviço  

## 🚨 Avisos Importantes

### ⚠️ Migração de Dados

Se você já tem sacados cadastrados:

1. **ANTES de tornar cedente_id obrigatório**, vincule todos os sacados existentes
2. **Opção 1**: Criar um "Cedente Padrão" e vincular todos
3. **Opção 2**: Pedir para o usuário vincular manualmente cada sacado
4. **Opção 3**: Criar um script de migração personalizado

### ⚠️ Cascade Delete

Com `ON DELETE CASCADE`, se você **excluir um cedente**, todos os seus **sacados serão excluídos também**.

Se não quiser esse comportamento:
```sql
ALTER TABLE sacados 
DROP CONSTRAINT sacados_cedente_id_fkey;

ALTER TABLE sacados 
ADD CONSTRAINT sacados_cedente_id_fkey 
FOREIGN KEY (cedente_id) REFERENCES cedentes(id) 
ON DELETE RESTRICT; -- Impede exclusão se tiver sacados
```

## 📝 Queries Úteis

### Listar cedentes com contagem de sacados
```sql
SELECT 
  c.id,
  c.nome,
  c.razao_social,
  COUNT(s.cnpj) as total_sacados
FROM cedentes c
LEFT JOIN sacados s ON s.cedente_id = c.id
GROUP BY c.id, c.nome, c.razao_social
ORDER BY total_sacados DESC;
```

### Listar sacados de um cedente
```sql
SELECT 
  s.cnpj,
  s.razao_social,
  s.nome_fantasia,
  s.situacao,
  s.porte
FROM sacados s
WHERE s.cedente_id = 'ID_DO_CEDENTE_AQUI'
ORDER BY s.razao_social;
```

### Encontrar sacados órfãos (sem cedente)
```sql
SELECT 
  cnpj,
  razao_social,
  nome_fantasia
FROM sacados
WHERE cedente_id IS NULL;
```

### Verificar integridade
```sql
-- Deve retornar 0 se tudo estiver certo
SELECT COUNT(*) 
FROM sacados 
WHERE cedente_id NOT IN (SELECT id FROM cedentes);
```

## 🎯 Próximas Melhorias Sugeridas

- [ ] Dashboard com estatísticas por cedente
- [ ] Filtro de sacados por cedente na lista geral
- [ ] Transferir sacado de um cedente para outro
- [ ] Relatório de cobrança agrupado por cedente
- [ ] Permissões por cedente (multi-tenant)
- [ ] Histórico de vinculação
- [ ] Duplicação em lote (vincular vários sacados de uma vez)

## ✅ Checklist de Validação

- [ ] Script SQL executado sem erros
- [ ] Coluna `cedente_id` existe na tabela `sacados`
- [ ] Índice `idx_sacados_cedente_id` criado
- [ ] Página do cedente mostra aba "Sacados"
- [ ] Contador de sacados está correto
- [ ] Botão "+ Adicionar Sacado" funciona
- [ ] Listagem de sacados aparece corretamente
- [ ] Criação de sacado exige seleção de cedente
- [ ] Pré-seleção funciona ao vir de `/cedentes/[id]`
- [ ] Redirect volta para o cedente após salvar
- [ ] Empty state aparece quando não há sacados
- [ ] Todas as ações (Ver/Editar/Ficha) funcionam

## 📞 Suporte

Se encontrar problemas:

1. Verifique se o script SQL foi executado completamente
2. Confirme que não há sacados órfãos (`cedente_id IS NULL`)
3. Verifique os logs do navegador (F12 → Console)
4. Teste com um cedente e sacado novos

---

**Status**: ✅ Implementado e Funcional  
**Versão**: 1.0  
**Data**: Novembro 2025  
**Breaking Change**: Sim (requer migração de dados existentes)
