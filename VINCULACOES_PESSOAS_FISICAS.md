# ✅ Sistema de Vinculação de Pessoas Físicas

## 📋 O que foi implementado

### 1. **Tabelas de Relacionamento**

Criadas duas novas tabelas para vincular pessoas físicas com cedentes e sacados:

- `pessoas_fisicas_cedentes` - Vincula pessoas físicas a cedentes
- `pessoas_fisicas_sacados` - Vincula pessoas físicas a sacados

**Campos das tabelas:**
- `pessoa_id` - ID da pessoa física
- `cedente_id` / `sacado_cnpj` - ID do cedente ou CNPJ do sacado
- `tipo_relacionamento` - Tipo (socio, administrador, funcionario, contato, representante, outro)
- `cargo` - Cargo/função
- `data_inicio` / `data_fim` - Período da vinculação
- `observacoes` - Observações adicionais
- `ativo` - Status da vinculação

**Arquivo SQL:**
```
database_schema_pessoas_fisicas_vinculacoes.sql
```

### 2. **Componente de Gerenciamento**

Criado componente `VinculacoesManager` para gerenciar as vinculações:

**Arquivo:**
```
src/components/pessoas-fisicas/VinculacoesManager.tsx
```

**Funcionalidades:**
- ✅ Adicionar nova vinculação
- ✅ Editar vinculação existente
- ✅ Remover vinculação
- ✅ Listar todas as vinculações
- ✅ Mostrar nome do cedente/sacado vinculado
- ✅ Filtrar por tipo de relacionamento

### 3. **Página de Edição**

Atualizada a página de edição da pessoa física (`/pessoas-fisicas/[cpf]/editar`):

**Funcionalidades adicionadas:**
- ✅ Seção "Cedentes Vinculados" com gerenciamento completo
- ✅ Seção "Sacados Vinculados" com gerenciamento completo
- ✅ Carregamento automático das vinculações existentes
- ✅ Lista de cedentes e sacados para seleção

### 4. **Página de Visualização**

Atualizada a página de visualização da pessoa física (`/pessoas-fisicas/[cpf]`):

**Funcionalidades adicionadas:**
- ✅ Exibição das vinculações com cedentes
- ✅ Exibição das vinculações com sacados
- ✅ Links clicáveis para os cedentes/sacados vinculados
- ✅ Badges com tipo de relacionamento

## 🚀 Como usar

### 1. Executar o SQL

Primeiro, execute o script SQL no Supabase:

```sql
-- Execute: database_schema_pessoas_fisicas_vinculacoes.sql
```

### 2. Vincular Pessoa Física

1. Acesse a página de edição da pessoa física
2. Role até as seções "Cedentes Vinculados" ou "Sacados Vinculados"
3. Clique em "+ Adicionar"
4. Selecione o cedente ou sacado
5. Escolha o tipo de relacionamento
6. Preencha os campos opcionais (cargo, datas, observações)
7. Clique em "Salvar"

### 3. Visualizar Vinculações

Na página de visualização da pessoa física, você verá:
- Lista de todos os cedentes vinculados
- Lista de todos os sacados vinculados
- Links para acessar os detalhes de cada cedente/sacado

## 📊 Estrutura de Dados

### Relacionamento Pessoa Física → Cedente

```
pessoas_fisicas (1) ←→ (N) pessoas_fisicas_cedentes (N) ←→ (1) cedentes
```

### Relacionamento Pessoa Física → Sacado

```
pessoas_fisicas (1) ←→ (N) pessoas_fisicas_sacados (N) ←→ (1) sacados
```

## 🔒 Segurança

- ✅ Row Level Security (RLS) habilitado
- ✅ Políticas de acesso baseadas no `user_id` da pessoa física
- ✅ Usuários só podem ver/editar suas próprias vinculações

## 📝 Tipos de Relacionamento Disponíveis

- `socio` - Sócio
- `administrador` - Administrador
- `funcionario` - Funcionário
- `contato` - Contato
- `representante` - Representante
- `outro` - Outro

