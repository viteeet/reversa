# Configuração dos Dados Complementares de Sacados

## 📋 O que foi implementado

Sistema completo para gerenciar dados complementares dos sacados com integração à API BigData:

### Funcionalidades:
- ✅ **QSA** (Quadro de Sócios e Administradores)
- ✅ **Endereços Múltiplos**
- ✅ **Telefones Múltiplos**
- ✅ **E-mails Múltiplos**
- ✅ **Pessoas Ligadas**
- ✅ **Empresas Ligadas**
- ✅ **Processos Judiciais**

### Características:
- 🔄 Buscar dados automaticamente da API
- ✏️ Adicionar/editar/excluir manualmente
- 🏷️ Identificação de origem (API ou Manual)
- 📄 Visualização na ficha de cobrança
- 🖨️ Impressão incluindo dados complementares

---

## 🚀 Passo a Passo para Configurar

### 1. Criar as tabelas no Supabase

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Copie todo o conteúdo do arquivo `database_schema_complementos.sql`
5. Cole no editor e clique em **Run**

Isso criará as seguintes tabelas:
- `sacados_qsa`
- `sacados_enderecos`
- `sacados_telefones`
- `sacados_emails`
- `sacados_pessoas_ligadas`
- `sacados_empresas_ligadas`
- `sacados_processos`

### 2. Configurar a API BigData ✅ CONFIGURADO

**A API BigData já está configurada e pronta para uso!**

As credenciais estão no arquivo `.env.local`:

```env
# API BigData Corp
BIGDATA_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
BIGDATA_TOKEN_ID=689257bb7e2263167a1bc867
```

**Nota:** 
- Token expira em 16/06/2026
- Veja `CONFIGURACAO_BIGDATA.md` para mais detalhes
- Se não estiver configurado, o sistema retorna dados de exemplo (mock)

### 3. Estrutura da API BigData ✅

**A integração está completa!**

Endpoint utilizado:
```
POST https://plataforma.bigdatacorp.com.br/companies/registration_data
```

**Dados disponíveis:**
- ✅ Endereços (Primary e Secondary)
- ✅ Telefones (Primary e Secondary)
- ✅ E-mails (Primary)

**Dados que requerem endpoints adicionais:**
- ⚠️ QSA (Quadro de Sócios)
- ⚠️ Processos Judiciais
- ⚠️ Pessoas/Empresas Relacionadas

Veja `CONFIGURACAO_BIGDATA.md` para detalhes técnicos completos.

---

## 📖 Como Usar

### 1. Acessar a página de edição

Existem 3 formas:

1. **Na listagem de sacados** (`/sacados`):
   - Clique no botão **"Editar"** ao lado do sacado desejado

2. **Na ficha de cobrança** (`/sacados/[cnpj]/cobranca`):
   - Clique no botão **"Editar Dados"** no topo da página

3. **URL direta**:
   - Acesse `/sacados/[CNPJ]/editar`

### 2. Buscar dados da API ✅

**Seções que funcionam com a API BigData:**

- ✅ **Endereços** - Busca endereços Primary e Secondary
- ✅ **Telefones** - Busca telefones Primary e Secondary  
- ✅ **E-mails** - Busca e-mail Primary

**Seções que precisam ser adicionadas manualmente:**
- ⚠️ **QSA** - Adicione manualmente os sócios
- ⚠️ **Processos** - Adicione manualmente
- ⚠️ **Pessoas/Empresas Ligadas** - Adicione manualmente

**Como usar:**
1. Clique no botão **"Buscar da API"**
2. Os dados serão buscados e salvos automaticamente
3. Serão marcados com a origem "API"

### 3. Adicionar dados manualmente

1. Clique no botão **"Adicionar"**
2. Preencha o formulário
3. Clique em **"Salvar"**
4. Os dados serão marcados com a origem "Manual"

### 4. Editar ou Excluir

- **Editar**: Clique no botão "Editar" na linha do registro
- **Excluir**: Clique no botão "Excluir" (confirmação será solicitada)

### 5. Visualizar na Ficha de Cobrança

1. Vá para `/sacados/[cnpj]/cobranca`
2. Todos os dados cadastrados aparecerão nas respectivas seções
3. Você pode imprimir a ficha completa com todos os dados

---

## 🔧 Estrutura de Arquivos Criados

```
database_schema_complementos.sql       # Script SQL das tabelas
src/
  app/
    api/
      bigdata/
        route.ts                       # API route para buscar dados
    sacados/
      [cnpj]/
        editar/
          page.tsx                     # Página de edição completa
        cobranca/
          page.tsx                     # Ficha (atualizada)
  components/
    sacados/
      DataManager.tsx                  # Componente reutilizável para gerenciar dados
```

---

## 💡 Dicas

### Dados Mock para Testes

Se a API não estiver configurada, o sistema retorna dados de exemplo automaticamente. Isso é útil para:
- Testar a interface sem configurar a API
- Desenvolvimento local
- Demonstrações

### Campos Importantes

Cada tipo de dado tem campos específicos:

**QSA:**
- Nome (obrigatório)
- CPF, Qualificação, Participação %, Data de Entrada

**Endereços:**
- Endereço (obrigatório)
- Tipo (comercial/residencial/correspondencia)
- CEP, Cidade, Estado

**Telefones:**
- Telefone (obrigatório)
- Tipo (celular/fixo/comercial)
- Nome do Contato

**E-mails:**
- E-mail (obrigatório)
- Tipo (comercial/pessoal/financeiro)
- Nome do Contato

**Processos:**
- Número do Processo (obrigatório)
- Tipo, Tribunal, Vara, Status, Valor
- Data de Distribuição

---

## 🐛 Troubleshooting

### As tabelas não foram criadas
- Verifique se executou o SQL no Supabase
- Confira se há erros no console do SQL Editor

### Erro ao buscar da API
- Verifique se as variáveis de ambiente estão configuradas
- Confira se a API está respondendo corretamente
- Veja o console do navegador para detalhes do erro

### Dados não aparecem na ficha
- Verifique se o campo `ativo` está como `true`
- Confira se o `sacado_cnpj` está correto
- Recarregue a página

---

## 📞 Próximos Passos

- [ ] Configurar credenciais reais da API BigData
- [ ] Testar integração com API real
- [ ] Adicionar mais campos conforme necessário
- [ ] Implementar validações adicionais
- [ ] Adicionar filtros e ordenação nas listagens

---

**Desenvolvido para o sistema Reversa** 🚀

