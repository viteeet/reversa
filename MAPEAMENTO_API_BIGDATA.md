# Mapeamento Completo - Uso da API BigData

Este documento mapeia todos os locais onde a API BigData é utilizada no sistema, com o objetivo de implementar uma trava de segurança para impedir consultas em loop (um CNPJ ou CPF não pode ser consultado 2x em um intervalo de 24h).

## Endpoint Principal da API

**Arquivo**: `src/app/api/bigdata/route.ts`

Este é o endpoint que recebe todas as requisições para a API BigData. É o ponto central onde a trava de segurança deve ser implementada.

**Tipos de consulta suportados**:
- `basico` / `completo_basico` - Dados básicos do CNPJ
- `qsa` - Quadro de Sócios e Administradores (CNPJ)
- `enderecos` - Endereços (CNPJ)
- `telefones` - Telefones (CNPJ)
- `emails` - E-mails (CNPJ)
- `processos` - Processos judiciais (CPF)
- `pessoa_fisica` - Dados de pessoa física (CPF)

---

## Páginas e Componentes que Fazem Requisições

### 1. Criação de Sacados

**Arquivo**: `src/app/sacados/new/page.tsx`

**Linha**: 66

**Contexto**: Função `consultarAPIsSacado()`

**Uso**: 
- Consulta múltiplos tipos: `enderecos`, `telefones`, `emails`, `qsa`
- Chamada quando o usuário marca a opção "Consultar APIs após salvar"
- Executada após salvar um novo sacado

**Código**:
```typescript
const res = await fetch(`/api/bigdata?cnpj=${encodeURIComponent(cnpj)}&tipo=${tipo}`);
```

**Risco**: MÉDIO - Pode ser chamado múltiplas vezes se o usuário salvar o mesmo CNPJ várias vezes

---

### 2. Edição de Sacados

**Arquivo**: `src/app/sacados/[cnpj]/editar/page.tsx`

**Linhas**: 
- 719: Busca processos por CPF
- 721: Busca dados por CNPJ (enderecos, telefones, emails, qsa)
- 814: Busca processos por CPF (função `buscarProcessosPorCPF`)

**Contexto**: 
- Função `fetchFromAPI()` - linha 702
- Função `buscarProcessosPorCPF()` - linha 806

**Uso**:
- Botões "API" em cada seção (endereços, telefones, emails, QSA)
- Botão para buscar processos de um CPF específico
- Permite buscar dados complementares manualmente

**Código**:
```typescript
// Linha 719
url = `/api/bigdata?cpf=${encodeURIComponent(cpf!)}&tipo=processos`;

// Linha 721
url = `/api/bigdata?cnpj=${encodeURIComponent(sacado.cnpj)}&tipo=${tipo}`;

// Linha 814
const res = await fetch(`/api/bigdata?cpf=${encodeURIComponent(cpfLimpo)}&tipo=processos`);
```

**Risco**: ALTO - Usuário pode clicar múltiplas vezes nos botões de API

---

### 3. Lista de Cedentes

**Arquivo**: `src/app/cedentes/page.tsx`

**Linha**: 89

**Contexto**: Função `consultarAPIsCedente()`

**Uso**:
- Consulta múltiplos tipos: `enderecos`, `telefones`, `emails`, `qsa`
- Chamada quando o usuário marca a opção "Consultar APIs após salvar"
- Executada após adicionar um novo cedente

**Código**:
```typescript
const res = await fetch(`/api/bigdata?cnpj=${encodeURIComponent(cnpj)}&tipo=${tipo}`);
```

**Risco**: MÉDIO - Pode ser chamado múltiplas vezes se o usuário salvar o mesmo CNPJ várias vezes

---

### 4. Edição de Cedentes

**Arquivo**: `src/app/cedentes/[id]/editar/page.tsx`

**Linhas**:
- 274: Consulta CNPJ básico ao adicionar sacado
- 312: Busca dados por CNPJ (enderecos, telefones, emails, qsa)
- 810: Busca processos por CPF
- 812: Busca dados por CNPJ
- 909: Busca processos por CPF (função `buscarProcessosPorCPF`)

**Contexto**:
- Função `consultarCnpjSacado()` - linha 264
- Função `fetchFromAPI()` - linha 793
- Função `buscarProcessosPorCPF()` - linha 901

**Uso**:
- Consulta CNPJ ao adicionar sacado dentro do cedente
- Botões "API" em cada seção (endereços, telefones, emails, QSA)
- Botão para buscar processos de um CPF específico
- Permite buscar dados complementares manualmente

**Código**:
```typescript
// Linha 274
const res = await fetch(`/api/bigdata?cnpj=${raw}&tipo=basico`);

// Linha 312
const res = await fetch(`/api/bigdata?cnpj=${encodeURIComponent(cnpj)}&tipo=${tipo}`);

// Linha 810
url = `/api/bigdata?cpf=${encodeURIComponent(cpf!)}&tipo=processos`;

// Linha 812
url = `/api/bigdata?cnpj=${encodeURIComponent(cedente.cnpj)}&tipo=${tipo}`;

// Linha 909
const res = await fetch(`/api/bigdata?cpf=${encodeURIComponent(cpfLimpo)}&tipo=processos`);
```

**Risco**: ALTO - Usuário pode clicar múltiplas vezes nos botões de API

---

### 5. Edição de Pessoas Físicas

**Arquivo**: `src/app/pessoas-fisicas/[cpf]/editar/page.tsx`

**Linha**: 520

**Contexto**: Função `buscarDaAPI()`

**Uso**:
- Botão "🔍 API" para buscar dados da pessoa física
- Busca dados básicos, endereços, telefones e emails

**Código**:
```typescript
const response = await fetch(`/api/bigdata?cpf=${encodeURIComponent(cpfLimpo)}&tipo=pessoa_fisica`);
```

**Risco**: MÉDIO - Usuário pode clicar múltiplas vezes no botão

---

### 6. Componente de Títulos Negociados

**Arquivo**: `src/components/titulos/TitulosNegociadosManager.tsx`

**Linha**: 779

**Contexto**: Função que busca dados complementares

**Uso**:
- Busca dados de CNPJ relacionados a títulos negociados

**Código**:
```typescript
const res = await fetch(`/api/bigdata?cnpj=${encodeURIComponent(cnpj)}&tipo=${tipo}`);
```

**Risco**: BAIXO - Usado em contexto específico de títulos

---

### 7. Biblioteca de Consulta CNPJ

**Arquivo**: `src/lib/cnpjws.ts`

**Linha**: 138

**Contexto**: Função `consultarCnpj()`

**Uso**:
- Função utilitária usada em vários lugares para consultar dados básicos de CNPJ
- Usada ao preencher formulários automaticamente

**Código**:
```typescript
const res = await fetch(`/api/bigdata?cnpj=${raw}&tipo=basico`, {
  signal: controller.signal,
});
```

**Risco**: MÉDIO - Pode ser chamada múltiplas vezes ao preencher formulários

---

## Resumo de Riscos por Tipo de Consulta

### Consultas por CNPJ:
1. **Dados básicos** (`basico`):
   - `src/lib/cnpjws.ts` (linha 138)
   - `src/app/cedentes/[id]/editar/page.tsx` (linha 274)

2. **Endereços** (`enderecos`):
   - `src/app/sacados/new/page.tsx` (linha 66)
   - `src/app/sacados/[cnpj]/editar/page.tsx` (linha 721)
   - `src/app/cedentes/page.tsx` (linha 89)
   - `src/app/cedentes/[id]/editar/page.tsx` (linha 312)
   - `src/components/titulos/TitulosNegociadosManager.tsx` (linha 779)

3. **Telefones** (`telefones`):
   - `src/app/sacados/new/page.tsx` (linha 66)
   - `src/app/sacados/[cnpj]/editar/page.tsx` (linha 721)
   - `src/app/cedentes/page.tsx` (linha 89)
   - `src/app/cedentes/[id]/editar/page.tsx` (linha 312)
   - `src/components/titulos/TitulosNegociadosManager.tsx` (linha 779)

4. **E-mails** (`emails`):
   - `src/app/sacados/new/page.tsx` (linha 66)
   - `src/app/sacados/[cnpj]/editar/page.tsx` (linha 721)
   - `src/app/cedentes/page.tsx` (linha 89)
   - `src/app/cedentes/[id]/editar/page.tsx` (linha 312)
   - `src/components/titulos/TitulosNegociadosManager.tsx` (linha 779)

5. **QSA** (`qsa`):
   - `src/app/sacados/new/page.tsx` (linha 66)
   - `src/app/sacados/[cnpj]/editar/page.tsx` (linha 721)
   - `src/app/cedentes/page.tsx` (linha 89)
   - `src/app/cedentes/[id]/editar/page.tsx` (linha 312)
   - `src/components/titulos/TitulosNegociadosManager.tsx` (linha 779)

### Consultas por CPF:
1. **Processos** (`processos`):
   - `src/app/sacados/[cnpj]/editar/page.tsx` (linhas 719, 814)
   - `src/app/cedentes/[id]/editar/page.tsx` (linhas 810, 909)

2. **Pessoa Física** (`pessoa_fisica`):
   - `src/app/pessoas-fisicas/[cpf]/editar/page.tsx` (linha 520)

---

## Estratégia de Implementação da Trava

### 1. Implementar no Endpoint Principal
A trava deve ser implementada em `src/app/api/bigdata/route.ts` antes de fazer qualquer chamada à API BigData.

### 2. Armazenamento
- Usar banco de dados (Supabase) para armazenar histórico de consultas
- Tabela sugerida: `bigdata_consultas`
- Campos: `documento` (CNPJ ou CPF), `tipo`, `data_consulta`, `user_id` (opcional)

### 3. Lógica de Verificação
- Antes de consultar a API, verificar se já existe consulta nas últimas 24h
- Se existir, retornar dados em cache ou erro informando que já foi consultado
- Se não existir, fazer a consulta e registrar no banco

### 4. Tratamento de Erros
- Retornar mensagem clara quando a consulta for bloqueada
- Permitir que o usuário veja quando foi a última consulta

### 5. Exceções (Opcional)
- Permitir consultas forçadas para administradores
- Permitir consultas mesmo dentro de 24h se os dados foram atualizados manualmente

---

## Arquivos que Precisam ser Modificados

1. **`src/app/api/bigdata/route.ts`** - Implementar a trava principal
2. Criar tabela no Supabase: `bigdata_consultas`
3. (Opcional) Adicionar interface para visualizar histórico de consultas

---

## Observações Importantes

- A trava deve ser por **documento** (CNPJ ou CPF) e **tipo de consulta**
- Exemplo: Um CNPJ pode ser consultado para `enderecos` e `qsa` na mesma hora, mas não pode ser consultado duas vezes para `enderecos` em 24h
- Considerar se diferentes tipos de consulta devem ter trava separada ou unificada
- A trava deve considerar o documento limpo (sem formatação) para comparação
