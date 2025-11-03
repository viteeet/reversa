# 📋 Sistema de Dados Encontrados

## 🎯 Visão Geral

Este módulo permite adicionar manualmente informações sobre sacados obtidas de diversas fontes (Google, indicações, LinkedIn, etc.), complementando os dados oficiais da Receita Federal.

## ✨ Funcionalidades

### 1. Visualização Compacta
A página de detalhes do sacado foi reestruturada com duas seções principais:

#### 🏛️ Dados da Receita Federal
- Layout compacto em cards
- Informações oficiais da API (CNPJ, Situação, Porte, etc.)
- Dados de contato da Receita (telefone, email, endereço)
- Capital social, natureza jurídica e atividade principal

#### 📝 Dados Encontrados
- Seção interativa para adicionar informações manualmente
- Botão "+" para adicionar novos dados
- Organização por tipo de informação
- Fonte e data de descoberta rastreáveis

### 2. Tipos de Informação

O sistema suporta 7 categorias de dados:

| Ícone | Tipo | Descrição |
|-------|------|-----------|
| 📞 | Telefone | Telefones encontrados em pesquisas |
| 📧 | Email | Endereços de email encontrados |
| 📍 | Endereço | Endereços físicos adicionais |
| 👤 | Pessoa | Pessoas relacionadas ao sacado |
| 🏢 | Empresa | Empresas vinculadas |
| ⚖️ | Processo | Processos judiciais encontrados |
| 📝 | Outros | Qualquer outra informação relevante |

### 3. Fontes de Dados

Você pode registrar de onde obteve cada informação:
- Google
- Indicação
- LinkedIn
- Site da Empresa
- Redes Sociais
- Telefone
- Email
- Outros

## 📊 Estrutura de Dados

### Tabela: `sacados_dados_encontrados`

```sql
CREATE TABLE sacados_dados_encontrados (
  id UUID PRIMARY KEY,
  sacado_cnpj VARCHAR(18) NOT NULL,
  tipo VARCHAR(50) NOT NULL,           -- categoria da informação
  titulo VARCHAR(255) NOT NULL,        -- descrição curta
  conteudo TEXT NOT NULL,              -- o dado propriamente dito
  observacoes TEXT,                    -- notas adicionais
  fonte VARCHAR(255),                  -- origem da informação
  data_encontrado DATE,                -- quando foi encontrado
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Campos do Formulário

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| **Tipo de Informação** | ✅ Sim | Categoria do dado (telefone, email, etc.) |
| **Título** | ✅ Sim | Nome descritivo (ex: "Telefone Celular do Sócio") |
| **Conteúdo** | ✅ Sim | A informação propriamente dita |
| **Fonte** | ❌ Não | De onde veio a informação |
| **Observações** | ❌ Não | Notas ou contexto adicional |
| **Data Encontrado** | ❌ Não | Quando foi descoberto (padrão: hoje) |

## 🚀 Como Usar

### Adicionando Dados Encontrados

1. **Acesse a página do sacado**
   - Navegue até `/sacados/[cnpj]`
   - Vá para a aba "📋 Informações"

2. **Clique no botão "+ Adicionar Informação"**
   - Localizado na seção "Dados Encontrados"

3. **Preencha o formulário**
   - Selecione o tipo de informação
   - Digite um título descritivo
   - Insira o conteúdo/dado encontrado
   - (Opcional) Selecione a fonte
   - (Opcional) Adicione observações
   - (Opcional) Ajuste a data

4. **Clique em "Salvar"**
   - O dado aparecerá agrupado por tipo
   - Será incluído no relatório de cobrança

### Editando ou Excluindo

- Cada dado tem botões "Editar" e "Excluir"
- A exclusão requer confirmação
- A edição mantém o histórico de criação

### Visualizando no Relatório

Os dados encontrados aparecem automaticamente:
- **Página de detalhes**: Seção "Dados Encontrados"
- **Ficha de cobrança**: Seção final "Dados Encontrados (Pesquisa Manual)"

## 📱 Interface

### Organização Visual

Os dados são exibidos em cards coloridos:
- **Cabeçalho**: Ícone + Nome da categoria + Contador
- **Cards individuais**: Título, conteúdo, fonte (badge) e observações
- **Metadata**: Data de descoberta em texto pequeno

### Badges de Fonte

Quando uma fonte é informada, aparece um badge azul ao lado do título:
- `🔵 Google`
- `🔵 Indicação`
- `🔵 LinkedIn`
- etc.

## 🔄 Integração com Relatório de Cobrança

O relatório `/sacados/[cnpj]/cobranca` inclui automaticamente:

1. **Seção dedicada**: "Dados Encontrados (Pesquisa Manual)"
2. **Agrupamento por tipo**: Telefones, Emails, Endereços, etc.
3. **Formatação para impressão**: Layout limpo e profissional
4. **Metadados completos**: Fonte, data e observações

### Exemplo de Uso no Relatório

```
📞 Telefones Encontrados
┌─────────────────────────────────────────┐
│ Celular do Sócio João          [Google] │
│ (11) 98765-4321                         │
│ Obs: Atende horário comercial           │
│ Encontrado em: 03/11/2025               │
└─────────────────────────────────────────┘
```

## 🎨 Novo Layout Compacto

### Antes
- Informações espalhadas
- Muito espaço vertical
- Difícil visualizar tudo

### Depois
- **Grid compacto**: 4 colunas em telas grandes
- **Cards brancos**: Dados da Receita com fundo colorido
- **Organização clara**: Receita separada de Dados Encontrados
- **Ícones visuais**: Identificação rápida por categoria

## 🔐 Segurança

- **RLS (Row Level Security)**: Habilitado
- **Autenticação obrigatória**: Apenas usuários autenticados
- **Soft delete**: Campo `ativo` permite "desativar" sem deletar
- **Auditoria**: Campos `created_at` e `updated_at`

## 📝 Boas Práticas

### Títulos Descritivos

✅ **Bom**: "Telefone Celular do Diretor Financeiro"  
❌ **Ruim**: "Telefone"

### Conteúdo Completo

✅ **Bom**: "(11) 98765-4321 - João Silva - Atende das 9h às 18h"  
❌ **Ruim**: "98765-4321"

### Observações Úteis

✅ **Bom**: "Confirmado por ligação em 01/11/2025. Preferência por WhatsApp."  
❌ **Ruim**: "ok"

### Escolha da Fonte

- Seja específico: "LinkedIn - Perfil do Sócio" ao invés de só "LinkedIn"
- Registre a fonte exata quando possível

## 🆕 Diferença entre Dados Complementares e Dados Encontrados

### Dados Complementares (Editar > QSA, Telefones, etc.)
- Estruturados em tabelas específicas
- Campos fixos e validados
- Podem vir da API BigData
- Exibidos na página "Editar"

### Dados Encontrados (Nova Feature)
- Flexíveis e não estruturados
- Qualquer tipo de informação
- Sempre adicionados manualmente
- Exibidos na página principal e relatório

## 🔄 Fluxo de Trabalho Típico

```
1. Cliente consulta CNPJ
   ↓
2. Sistema busca dados da Receita Federal
   ↓
3. Usuário visualiza dados oficiais
   ↓
4. Usuário pesquisa no Google/LinkedIn
   ↓
5. Encontra telefone adicional
   ↓
6. Clica "+ Adicionar Informação"
   ↓
7. Tipo: Telefone
   Título: "Celular do Gerente de Contas"
   Conteúdo: "(11) 99999-8888"
   Fonte: Google
   ↓
8. Salva
   ↓
9. Dado aparece na seção "Dados Encontrados"
   ↓
10. Incluído automaticamente no relatório
```

## 📦 Arquivos Criados/Modificados

### Novos Arquivos
- `database_schema_dados_encontrados.sql` - Schema do banco
- `src/components/sacados/FoundDataManager.tsx` - Componente principal
- `DADOS_ENCONTRADOS.md` - Esta documentação

### Arquivos Modificados
- `src/app/sacados/[cnpj]/page.tsx` - Layout compacto + integração
- `src/app/sacados/[cnpj]/cobranca/page.tsx` - Inclusão no relatório

## 🚀 Próximos Passos (Opcional)

Melhorias futuras sugeridas:
- [ ] Anexar arquivos/imagens aos dados encontrados
- [ ] Histórico de alterações
- [ ] Busca/filtro dentro dos dados encontrados
- [ ] Exportação em formato Excel/PDF
- [ ] Tags/categorias personalizadas
- [ ] Validação automática de telefones/emails
- [ ] Integração com WhatsApp/Email

## 💡 Dicas

1. **Use observações** para contexto importante
2. **Registre a fonte** sempre que possível para rastreabilidade
3. **Seja descritivo nos títulos** para facilitar a busca
4. **Atualize a data** se verificar uma informação antiga
5. **Não delete**, desative (edite e mude `ativo` para false se precisar)

---

**Versão**: 1.0  
**Data**: Novembro 2025  
**Status**: ✅ Implementado e Funcionando
