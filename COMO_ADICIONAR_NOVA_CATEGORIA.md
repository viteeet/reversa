# Como Adicionar uma Nova Categoria no Cadastro de Cedente

Este guia explica como adicionar uma nova categoria de dados complementares ao cadastro de cedente.

## Passo a Passo

### 1. Adicionar a Configuração da Categoria

Edite o arquivo `src/config/cedentesCategorias.ts` e adicione uma nova entrada no array `categoriasCedentes`:

```typescript
{
  id: 'contatos_importantes', // ID único (sem espaços, use underscores)
  title: 'Contatos Importantes', // Título exibido na interface
  tableName: 'cedentes_contatos_importantes', // Nome da tabela no banco
  apiType: 'contatos_importantes', // Opcional: tipo para buscar da API
  fields: [
    { key: 'nome', label: 'Nome', type: 'text', required: true },
    { key: 'cargo', label: 'Cargo', type: 'text' },
    { key: 'telefone', label: 'Telefone', type: 'tel' },
    { key: 'email', label: 'E-mail', type: 'email' },
    { key: 'observacoes', label: 'Observações', type: 'textarea', width: 'full' }
  ],
  displayFields: ['nome', 'cargo', 'telefone'] // Campos exibidos na lista
}
```

**Tipos de campos disponíveis:**
- `text` - Campo de texto
- `email` - Campo de e-mail
- `tel` - Campo de telefone
- `number` - Campo numérico
- `date` - Campo de data
- `select` - Dropdown (requer `options`)
- `textarea` - Área de texto

**Propriedades dos campos:**
- `required` - Se o campo é obrigatório
- `width` - Largura: `'full'`, `'half'`, `'third'`
- `options` - Array de opções (para tipo `select`)
- `placeholder` - Texto de placeholder

### 2. Criar a Tabela no Banco de Dados

Execute o seguinte SQL no Supabase SQL Editor (ajuste conforme sua nova categoria):

```sql
-- Tabela de exemplo: Contatos Importantes
CREATE TABLE IF NOT EXISTS cedentes_contatos_importantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedente_id UUID NOT NULL REFERENCES cedentes(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  cargo VARCHAR(255),
  telefone VARCHAR(20),
  email VARCHAR(255),
  observacoes TEXT,
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_cedentes_contatos_importantes_cedente_id 
ON cedentes_contatos_importantes(cedente_id);

-- Constraint anti-duplicata (ajuste conforme necessário)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_cedente_contato_importante 
ON cedentes_contatos_importantes(cedente_id, nome, telefone) 
WHERE ativo = true;

-- Habilitar RLS (Row Level Security)
ALTER TABLE cedentes_contatos_importantes ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Usuários autenticados podem ver contatos importantes cedentes" 
ON cedentes_contatos_importantes FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir contatos importantes cedentes" 
ON cedentes_contatos_importantes FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar contatos importantes cedentes" 
ON cedentes_contatos_importantes FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar contatos importantes cedentes" 
ON cedentes_contatos_importantes FOR DELETE 
USING (auth.role() = 'authenticated');
```

**Campos obrigatórios na tabela:**
- `id` - UUID primary key
- `cedente_id` - Referência ao cedente (UUID)
- `origem` - VARCHAR(50), padrão 'manual'
- `ativo` - BOOLEAN, padrão true
- `created_at` - TIMESTAMP
- `updated_at` - TIMESTAMP

### 3. Estrutura Padrão da Tabela

Toda tabela de categoria deve ter esta estrutura base:

```sql
CREATE TABLE IF NOT EXISTS cedentes_[nome_categoria] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedente_id UUID NOT NULL REFERENCES cedentes(id) ON DELETE CASCADE,
  -- Seus campos personalizados aqui --
  origem VARCHAR(50) DEFAULT 'manual',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Integração com API (Opcional)

Se você quiser que a categoria possa buscar dados de uma API externa:

1. Adicione o `apiType` na configuração
2. Atualize a função `fetchFromAPI` em `src/lib/bigdata.ts` para suportar o novo tipo
3. O botão "API" aparecerá automaticamente na interface

### 5. Verificar

Após seguir os passos:

1. A nova categoria aparecerá automaticamente na página de edição do cedente
2. Você poderá adicionar, editar e excluir registros
3. Os dados serão salvos na tabela criada

## Exemplo Completo

Veja o arquivo `src/config/cedentesCategorias.ts` para exemplos de categorias já implementadas:
- Endereços
- Telefones
- E-mails
- Pessoas Ligadas / Familiares (com CPF, telefone, email e endereço)
- Empresas Ligadas
- QSA

## Notas Importantes

- O nome da tabela deve seguir o padrão: `cedentes_[nome_categoria]`
- Todos os campos personalizados devem estar na configuração
- A categoria será renderizada automaticamente na ordem definida no array
- Se você quiser uma categoria especial (como QSA), pode renderizá-la separadamente no código

