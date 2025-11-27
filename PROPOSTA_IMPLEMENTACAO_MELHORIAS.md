# Proposta de Implementação: Melhorias do Sistema

## 📋 Resumo

Este documento apresenta propostas detalhadas para implementar duas funcionalidades que estão faltando no sistema:

1. **Pessoas Físicas como Entidades Principais**
2. **Múltiplos CNPJs da Mesma Empresa**

---

## 🎯 FUNCIONALIDADE 1: Pessoas Físicas como Entidades Principais

### Objetivo
Permitir cadastrar pessoas físicas (como Elias Samed, Joe El Samed, etc.) como entidades principais, com suas próprias informações completas (endereços, telefones, e-mails, familiares, empresas ligadas, processos).

### Estrutura de Banco de Dados

#### Tabela Principal: `pessoas_fisicas`

```sql
CREATE TABLE IF NOT EXISTS pessoas_fisicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf VARCHAR(14) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  nome_mae VARCHAR(255),
  data_nascimento DATE,
  rg VARCHAR(20),
  situacao VARCHAR(50) DEFAULT 'ativa', -- ativa, inativa, falecida
  observacoes_gerais TEXT,
  processos_texto TEXT, -- Texto formatado de processos
  origem VARCHAR(50) DEFAULT 'manual', -- 'manual', 'api'
  ativo BOOLEAN DEFAULT true,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pessoas_fisicas_cpf ON pessoas_fisicas(cpf);
CREATE INDEX IF NOT EXISTS idx_pessoas_fisicas_nome ON pessoas_fisicas(nome);
CREATE INDEX IF NOT EXISTS idx_pessoas_fisicas_user_id ON pessoas_fisicas(user_id);
```

#### Tabelas Complementares (similar às empresas)

```sql
-- Endereços
CREATE TABLE IF NOT EXISTS pessoas_fisicas_enderecos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID NOT NULL REFERENCES pessoas_fisicas(id) ON DELETE CASCADE,
  endereco TEXT NOT NULL,
  tipo VARCHAR(50), -- 'residencial', 'comercial', 'correspondencia'
  cep VARCHAR(10),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  principal BOOLEAN DEFAULT false,
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Telefones
CREATE TABLE IF NOT EXISTS pessoas_fisicas_telefones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID NOT NULL REFERENCES pessoas_fisicas(id) ON DELETE CASCADE,
  telefone VARCHAR(20) NOT NULL,
  tipo VARCHAR(50), -- 'celular', 'fixo', 'comercial'
  nome_contato VARCHAR(255),
  principal BOOLEAN DEFAULT false,
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- E-mails
CREATE TABLE IF NOT EXISTS pessoas_fisicas_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID NOT NULL REFERENCES pessoas_fisicas(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  tipo VARCHAR(50), -- 'pessoal', 'comercial'
  nome_contato VARCHAR(255),
  principal BOOLEAN DEFAULT false,
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Familiares / Relacionamentos
CREATE TABLE IF NOT EXISTS pessoas_fisicas_familiares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID NOT NULL REFERENCES pessoas_fisicas(id) ON DELETE CASCADE,
  familiar_cpf VARCHAR(14),
  familiar_nome VARCHAR(255) NOT NULL,
  tipo_relacionamento VARCHAR(100), -- 'pai', 'mae', 'conjuge', 'filho', 'filha', 'irmao', 'irma', 'avô', 'avó', 'neto', 'neta', 'tio', 'tia', 'primo', 'prima', 'sobrinho', 'sobrinha', 'cunhado', 'cunhada', 'sogro', 'sogra', 'genro', 'nora', 'outro'
  observacoes TEXT,
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Empresas Ligadas (empresas onde a pessoa é sócio, funcionário, etc.)
CREATE TABLE IF NOT EXISTS pessoas_fisicas_empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID NOT NULL REFERENCES pessoas_fisicas(id) ON DELETE CASCADE,
  empresa_cnpj VARCHAR(18) NOT NULL,
  empresa_razao_social VARCHAR(255) NOT NULL,
  tipo_relacionamento VARCHAR(100), -- 'socio', 'administrador', 'funcionario', 'proprietario', 'outro'
  participacao DECIMAL(5,2), -- percentual de participação
  cargo VARCHAR(255), -- cargo/função na empresa
  data_inicio DATE,
  data_fim DATE,
  observacoes TEXT,
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processos Judiciais
CREATE TABLE IF NOT EXISTS pessoas_fisicas_processos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID NOT NULL REFERENCES pessoas_fisicas(id) ON DELETE CASCADE,
  numero_processo VARCHAR(50) NOT NULL,
  tribunal VARCHAR(100),
  vara VARCHAR(255),
  tipo_acao VARCHAR(255),
  valor_causa DECIMAL(15,2),
  data_distribuicao DATE,
  status VARCHAR(100),
  parte_contraria TEXT,
  observacoes TEXT,
  link_processo TEXT,
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Observações Gerais
CREATE TABLE IF NOT EXISTS pessoas_fisicas_observacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID NOT NULL REFERENCES pessoas_fisicas(id) ON DELETE CASCADE UNIQUE,
  observacoes TEXT,
  processos_texto TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE pessoas_fisicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pessoas_fisicas_enderecos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pessoas_fisicas_telefones ENABLE ROW LEVEL SECURITY;
ALTER TABLE pessoas_fisicas_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE pessoas_fisicas_familiares ENABLE ROW LEVEL SECURITY;
ALTER TABLE pessoas_fisicas_empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pessoas_fisicas_processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pessoas_fisicas_observacoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (similar às outras tabelas)
CREATE POLICY "Users can view own pessoas_fisicas" ON pessoas_fisicas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pessoas_fisicas" ON pessoas_fisicas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pessoas_fisicas" ON pessoas_fisicas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pessoas_fisicas" ON pessoas_fisicas FOR DELETE USING (auth.uid() = user_id);

-- (Repetir políticas para todas as tabelas complementares)
```

### Estrutura de Páginas/Rotas

```
src/app/
  pessoas-fisicas/
    page.tsx                    # Lista de pessoas físicas
    new/
      page.tsx                  # Cadastrar nova pessoa física
    [cpf]/
      page.tsx                  # Detalhes da pessoa física
      editar/
        page.tsx                # Editar pessoa física (similar a /sacados/[cnpj]/editar)
```

### Componentes Necessários

1. **Lista de Pessoas Físicas** (`src/app/pessoas-fisicas/page.tsx`)
   - Similar a `src/app/sacados/page.tsx`
   - Busca por CPF, nome
   - Filtros por situação, ativo/inativo
   - Link para detalhes e edição

2. **Cadastro de Pessoa Física** (`src/app/pessoas-fisicas/new/page.tsx`)
   - Formulário básico: CPF, nome, data nascimento, RG, nome mãe
   - Validação de CPF
   - Busca automática na API BigData (se disponível)

3. **Detalhes da Pessoa Física** (`src/app/pessoas-fisicas/[cpf]/page.tsx`)
   - Visualização de todas as informações
   - Similar a `src/app/sacados/[cnpj]/page.tsx`

4. **Edição Completa** (`src/app/pessoas-fisicas/[cpf]/editar/page.tsx`)
   - **Reutilizar estrutura de `src/app/sacados/[cnpj]/editar/page.tsx`**
   - Adaptar para pessoa física:
     - Informações Básicas: CPF, Nome, Data Nascimento, RG, Nome Mãe, Situação
     - Endereços (usar `CompactDataManager`)
     - Telefones (usar `CompactDataManager`)
     - E-mails (usar `CompactDataManager`)
     - Familiares (usar `CompactDataManager`)
     - Empresas Ligadas (usar `CompactDataManager`)
     - Processos (campo texto + tabela)
     - Observações Gerais

### Configuração de Categorias

Criar arquivo `src/config/pessoasFisicasCategorias.ts`:

```typescript
export const categoriasPessoasFisicas: CategoriaConfig[] = [
  {
    id: 'enderecos',
    title: 'Endereços',
    tableName: 'pessoas_fisicas_enderecos',
    apiType: 'enderecos',
    group: 'contatos',
    fields: [
      { key: 'endereco', label: 'Endereço', type: 'text', required: true },
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['residencial', 'comercial', 'correspondencia'] },
      { key: 'cep', label: 'CEP', type: 'text' },
      { key: 'cidade', label: 'Cidade', type: 'text' },
      { key: 'estado', label: 'UF', type: 'text' }
    ],
    displayFields: ['endereco', 'tipo', 'cidade']
  },
  {
    id: 'telefones',
    title: 'Telefones',
    tableName: 'pessoas_fisicas_telefones',
    apiType: 'telefones',
    group: 'contatos',
    fields: [
      { key: 'telefone', label: 'Telefone', type: 'tel', required: true },
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['celular', 'fixo', 'comercial'] },
      { key: 'nome_contato', label: 'Contato', type: 'text' }
    ],
    displayFields: ['telefone', 'tipo', 'nome_contato']
  },
  {
    id: 'emails',
    title: 'E-mails',
    tableName: 'pessoas_fisicas_emails',
    apiType: 'emails',
    group: 'contatos',
    fields: [
      { key: 'email', label: 'E-mail', type: 'email', required: true },
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['pessoal', 'comercial'] },
      { key: 'nome_contato', label: 'Contato', type: 'text' }
    ],
    displayFields: ['email', 'tipo', 'nome_contato']
  },
  {
    id: 'familiares',
    title: 'Familiares / Relacionamentos',
    tableName: 'pessoas_fisicas_familiares',
    group: 'relacionamentos',
    fields: [
      { key: 'familiar_cpf', label: 'CPF', type: 'text', placeholder: '000.000.000-00' },
      { key: 'familiar_nome', label: 'Nome', type: 'text', required: true },
      { key: 'tipo_relacionamento', label: 'Relacionamento', type: 'select', 
        options: ['pai', 'mae', 'conjuge', 'filho', 'filha', 'irmao', 'irma', 'avô', 'avó', 'neto', 'neta', 'tio', 'tia', 'primo', 'prima', 'sobrinho', 'sobrinha', 'cunhado', 'cunhada', 'sogro', 'sogra', 'genro', 'nora', 'outro'] },
      { key: 'observacoes', label: 'Observações', type: 'textarea', width: 'full' }
    ],
    displayFields: ['familiar_nome', 'familiar_cpf', 'tipo_relacionamento']
  },
  {
    id: 'empresas',
    title: 'Empresas Ligadas',
    tableName: 'pessoas_fisicas_empresas',
    group: 'relacionamentos',
    fields: [
      { key: 'empresa_cnpj', label: 'CNPJ', type: 'text', required: true },
      { key: 'empresa_razao_social', label: 'Razão Social', type: 'text', required: true },
      { key: 'tipo_relacionamento', label: 'Tipo', type: 'select', 
        options: ['socio', 'administrador', 'funcionario', 'proprietario', 'outro'] },
      { key: 'participacao', label: 'Part.%', type: 'number' },
      { key: 'cargo', label: 'Cargo', type: 'text' },
      { key: 'data_inicio', label: 'Data Início', type: 'date' },
      { key: 'data_fim', label: 'Data Fim', type: 'date' },
      { key: 'observacoes', label: 'Observações', type: 'textarea', width: 'full' }
    ],
    displayFields: ['empresa_razao_social', 'empresa_cnpj', 'tipo_relacionamento', 'cargo']
  }
];
```

### Integração com API BigData

- Adicionar suporte para buscar dados de CPF na API BigData
- Endpoint: `/api/bigdata?tipo=pessoa&cpf=XXX`
- Mapear dados retornados para as tabelas de pessoa física

### Menu/Navegação

Adicionar no menu:
- **Pessoas Físicas** (nova seção ou dentro de "Operacional")
  - Lista de Pessoas Físicas
  - Cadastrar Pessoa Física

---

## 🎯 FUNCIONALIDADE 2: Múltiplos CNPJs da Mesma Empresa

### Objetivo
Permitir vincular múltiplos CNPJs da mesma empresa (ex: Paradox Jeans com 3 CNPJs) e visualizar como uma única entidade com filiais/unidades.

### Estrutura de Banco de Dados

#### Nova Tabela: `empresas_grupo`

```sql
-- Tabela para agrupar CNPJs da mesma empresa
CREATE TABLE IF NOT EXISTS empresas_grupo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_grupo VARCHAR(255) NOT NULL, -- Ex: "Paradox Jeans"
  cnpj_matriz VARCHAR(18) NOT NULL, -- CNPJ principal (0001)
  observacoes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para vincular CNPJs ao grupo
CREATE TABLE IF NOT EXISTS empresas_grupo_cnpjs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id UUID NOT NULL REFERENCES empresas_grupo(id) ON DELETE CASCADE,
  cnpj VARCHAR(18) NOT NULL, -- Referência ao CNPJ em sacados ou cedentes
  tipo_entidade VARCHAR(20) NOT NULL, -- 'sacado' ou 'cedente'
  tipo_unidade VARCHAR(50) DEFAULT 'filial', -- 'matriz', 'filial', 'unidade'
  ordem INTEGER DEFAULT 0, -- Ordem de exibição
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cnpj, tipo_entidade) -- Um CNPJ só pode estar em um grupo
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_empresas_grupo_cnpj_matriz ON empresas_grupo(cnpj_matriz);
CREATE INDEX IF NOT EXISTS idx_empresas_grupo_cnpjs_grupo ON empresas_grupo_cnpjs(grupo_id);
CREATE INDEX IF NOT EXISTS idx_empresas_grupo_cnpjs_cnpj ON empresas_grupo_cnpjs(cnpj, tipo_entidade);

-- RLS
ALTER TABLE empresas_grupo ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas_grupo_cnpjs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own empresas_grupo" ON empresas_grupo FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own empresas_grupo" ON empresas_grupo FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own empresas_grupo" ON empresas_grupo FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own empresas_grupo" ON empresas_grupo FOR DELETE USING (auth.uid() = user_id);

-- (Repetir políticas para empresas_grupo_cnpjs)
```

#### Adicionar Campo na Tabela `sacados` e `cedentes`

```sql
-- Adicionar campo para referenciar o grupo (opcional)
ALTER TABLE sacados ADD COLUMN IF NOT EXISTS grupo_empresa_id UUID REFERENCES empresas_grupo(id);
ALTER TABLE cedentes ADD COLUMN IF NOT EXISTS grupo_empresa_id UUID REFERENCES empresas_grupo(id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sacados_grupo_empresa ON sacados(grupo_empresa_id);
CREATE INDEX IF NOT EXISTS idx_cedentes_grupo_empresa ON cedentes(grupo_empresa_id);
```

### Estrutura de Páginas/Rotas

```
src/app/
  empresas-grupo/
    page.tsx                    # Lista de grupos de empresas
    new/
      page.tsx                  # Criar novo grupo
    [grupo_id]/
      page.tsx                  # Detalhes do grupo (mostra todos os CNPJs)
      editar/
        page.tsx                # Editar grupo (adicionar/remover CNPJs)
```

### Componentes Necessários

1. **Lista de Grupos** (`src/app/empresas-grupo/page.tsx`)
   - Lista todos os grupos
   - Mostra CNPJ matriz e quantidade de CNPJs vinculados
   - Link para detalhes

2. **Criar Grupo** (`src/app/empresas-grupo/new/page.tsx`)
   - Formulário: Nome do grupo, CNPJ matriz
   - Buscar CNPJ matriz (deve existir em sacados ou cedentes)
   - Opção de adicionar outros CNPJs na criação

3. **Detalhes do Grupo** (`src/app/empresas-grupo/[grupo_id]/page.tsx`)
   - Mostra informações do grupo
   - Lista todos os CNPJs vinculados
   - Para cada CNPJ, mostra:
     - Tipo (matriz/filial/unidade)
     - Link para a página do sacado/cedente
     - Informações básicas (razão social, situação, etc.)

4. **Editar Grupo** (`src/app/empresas-grupo/[grupo_id]/editar/page.tsx`)
   - Editar nome do grupo
   - Adicionar CNPJs ao grupo
   - Remover CNPJs do grupo
   - Alterar tipo de unidade (matriz/filial)
   - Reordenar CNPJs

### Funcionalidades Adicionais

1. **Badge/Indicador Visual**
   - Nas páginas de sacados/cedentes, mostrar badge indicando que faz parte de um grupo
   - Exemplo: "Paradox Jeans - Filial 2/3"

2. **Filtro na Lista de Sacados/Cedentes**
   - Opção de agrupar por grupo de empresa
   - Mostrar grupo expandido com todas as filiais

3. **Relatório Consolidado**
   - Gerar relatório consolidado de todo o grupo
   - Somar valores, processos, etc.

### Integração com Páginas Existentes

1. **Na página de Sacado/Cedente:**
   - Se o CNPJ faz parte de um grupo, mostrar seção "Grupo de Empresas"
   - Listar outros CNPJs do mesmo grupo
   - Link para página do grupo

2. **Na página de Edição:**
   - Opção de vincular a um grupo existente
   - Opção de criar novo grupo

---

## 📊 Priorização de Implementação

### Fase 1: Pessoas Físicas (Alta Prioridade)
**Tempo estimado:** 2-3 semanas

1. Criar estrutura de banco de dados
2. Criar páginas básicas (lista, cadastro, detalhes)
3. Criar página de edição (reutilizar estrutura de sacados)
4. Integrar com API BigData (busca por CPF)
5. Adicionar ao menu

**Benefício:** Permite cadastrar completamente pessoas como Elias Samed, Joe El Samed, etc.

### Fase 2: Múltiplos CNPJs (Média Prioridade)
**Tempo estimado:** 1-2 semanas

1. Criar estrutura de banco de dados
2. Criar páginas de gerenciamento de grupos
3. Adicionar indicadores visuais nas páginas existentes
4. Implementar filtros e relatórios consolidados

**Benefício:** Organiza melhor empresas com múltiplos CNPJs (Paradox, etc.)

---

## 🔧 Considerações Técnicas

### Reutilização de Código

- **CompactDataManager**: Já existe e pode ser reutilizado para pessoas físicas
- **Estrutura de edição**: Reutilizar `src/app/sacados/[cnpj]/editar/page.tsx` como base
- **Componentes UI**: Reutilizar Card, Button, Input, Select, etc.

### Migração de Dados

- Para pessoas físicas: Não há dados existentes para migrar
- Para grupos de empresas: Criar script para identificar e agrupar CNPJs similares (mesma razão social, endereços próximos, etc.)

### Performance

- Adicionar índices nas tabelas relacionadas
- Usar paginação nas listas
- Cache de consultas frequentes

### Segurança

- RLS (Row Level Security) em todas as tabelas
- Validação de CPF/CNPJ
- Sanitização de inputs

---

## ✅ Checklist de Implementação

### Pessoas Físicas
- [ ] Criar scripts SQL de criação de tabelas
- [ ] Criar página de lista
- [ ] Criar página de cadastro
- [ ] Criar página de detalhes
- [ ] Criar página de edição completa
- [ ] Criar arquivo de configuração de categorias
- [ ] Integrar com API BigData (CPF)
- [ ] Adicionar ao menu
- [ ] Testes

### Múltiplos CNPJs
- [ ] Criar scripts SQL de criação de tabelas
- [ ] Criar página de lista de grupos
- [ ] Criar página de criação de grupo
- [ ] Criar página de detalhes do grupo
- [ ] Criar página de edição do grupo
- [ ] Adicionar indicadores visuais nas páginas de sacados/cedentes
- [ ] Implementar filtros
- [ ] Adicionar ao menu
- [ ] Testes

---

## 📝 Notas Finais

- Ambas as funcionalidades seguem o padrão arquitetural existente
- Reutilização máxima de componentes e estruturas
- Compatibilidade com dados existentes
- Extensibilidade para futuras melhorias


