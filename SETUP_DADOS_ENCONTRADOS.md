# 🚀 Setup Rápido - Dados Encontrados

## 📋 Passo a Passo para Ativar

### 1️⃣ Criar a Tabela no Banco de Dados

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Execute o script `database_schema_dados_encontrados.sql`:

```sql
-- Copie e cole todo o conteúdo do arquivo
-- database_schema_dados_encontrados.sql
```

### 2️⃣ Verificar a Instalação

No SQL Editor, execute para confirmar:

```sql
-- Verificar se a tabela foi criada
SELECT COUNT(*) FROM sacados_dados_encontrados;

-- Deve retornar 0 (zero registros) sem erro
```

### 3️⃣ Testar no Sistema

1. Acesse um sacado qualquer: `/sacados/[CNPJ]`
2. Vá para a aba **📋 Informações**
3. Procure a seção **"Dados Encontrados"**
4. Clique no botão **"+ Adicionar Informação"**
5. Preencha o formulário de teste:
   - **Tipo**: Telefone
   - **Título**: "Teste de Sistema"
   - **Conteúdo**: "(11) 99999-9999"
   - **Fonte**: Outros
6. Clique em **Salvar**
7. O dado deve aparecer na seção "📞 Telefone"

### 4️⃣ Verificar no Relatório

1. Clique no botão **"Ficha"** do sacado
2. Role até o final da página
3. Deve aparecer a seção **"Dados Encontrados (Pesquisa Manual)"**
4. Seu dado de teste deve estar lá

### 5️⃣ Limpar Teste (Opcional)

- Clique em **"Excluir"** no dado de teste
- Confirme a exclusão

## ✅ Pronto!

O sistema está funcionando! Agora você pode:

- Adicionar dados encontrados em qualquer sacado
- Visualizar de forma organizada por tipo
- Incluir automaticamente nos relatórios
- Editar ou excluir quando necessário

## 🔍 Verificação de Problemas

### Erro: "permission denied for table sacados_dados_encontrados"

**Solução**: As policies RLS não foram criadas corretamente.

Execute novamente a parte final do script:

```sql
ALTER TABLE sacados_dados_encontrados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver dados encontrados" 
  ON sacados_dados_encontrados FOR SELECT 
  USING (auth.role() = 'authenticated');

-- ... (resto das policies)
```

### Erro: "relation sacados_dados_encontrados does not exist"

**Solução**: A tabela não foi criada.

Execute o script completo `database_schema_dados_encontrados.sql`.

### Componente não aparece na página

**Solução**: Limpe o cache do Next.js

```bash
# No terminal do projeto
rm -rf .next
npm run dev
```

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do console do navegador (F12)
2. Verifique os logs do Supabase
3. Confirme que está autenticado no sistema
4. Tente fazer logout e login novamente

---

**Tempo estimado**: 5-10 minutos  
**Dificuldade**: ⭐ Fácil
