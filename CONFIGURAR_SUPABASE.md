# 🔧 Como Configurar o Supabase

## ⚠️ ATENÇÃO
O sistema está configurado com valores placeholder. Você precisa configurar suas credenciais reais do Supabase para o sistema funcionar completamente.

---

## 📝 Passo a Passo

### 1. Acesse seu projeto no Supabase

Vá para: https://supabase.com/dashboard

### 2. Pegue suas credenciais

No seu projeto Supabase:
1. Clique em **Settings** (⚙️) no menu lateral
2. Clique em **API**
3. Copie os seguintes valores:

   - **URL do Projeto** (Project URL)
     ```
     Exemplo: https://xyzcompany.supabase.co
     ```
   
   - **Chave Anônima** (anon/public key)
     ```
     Exemplo: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...
     ```

### 3. Configure no .env.local

Abra o arquivo `.env.local` na raiz do projeto e substitua:

**DE:**
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

**PARA:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### 4. Reinicie o servidor

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
npm run dev
```

---

## 🗄️ Criar as Tabelas no Banco

Depois de configurar as credenciais:

### 1. Execute o schema principal (se ainda não executou)

No Supabase Dashboard:
1. Vá em **SQL Editor**
2. Abra os arquivos SQL e execute na ordem:
   - `database_schema_fixes_corrected.sql` (ou o schema principal)
   - `database_schema_complementos.sql` (dados complementares)

### 2. Verifique as tabelas criadas

No Supabase:
1. Vá em **Table Editor**
2. Deve ver as tabelas:
   - `sacados`
   - `sacados_qsa`
   - `sacados_enderecos`
   - `sacados_telefones`
   - `sacados_emails`
   - `sacados_pessoas_ligadas`
   - `sacados_empresas_ligadas`
   - `sacados_processos`
   - E outras tabelas do sistema

---

## ✅ Verificar se está funcionando

Após configurar:

1. Acesse: http://localhost:3000/login
2. Faça login (ou crie uma conta)
3. Acesse: http://localhost:3000/sacados
4. Tente adicionar um sacado

Se tudo funcionar, está configurado! 🎉

---

## 🆘 Problemas Comuns

### Erro: "Invalid supabaseUrl"
- ✅ Verifique se copiou a URL completa (com https://)
- ✅ Verifique se não deixou "your-supabase-url-here"

### Erro: "Invalid API key"
- ✅ Verifique se copiou a chave **anon/public** (não a service_role)
- ✅ Verifique se não deixou "your-supabase-anon-key-here"

### Erro: "relation ... does not exist"
- ✅ Execute os scripts SQL no Supabase (Passo "Criar as Tabelas")

### Erro: "Row Level Security"
- ✅ Os scripts SQL já configuram o RLS automaticamente
- ✅ Se precisar, desative temporariamente no Supabase → Authentication → Policies

---

## 🔒 Segurança

**IMPORTANTE:**
- ✅ O arquivo `.env.local` está no `.gitignore` (não será commitado)
- ✅ Use apenas a chave **anon/public** (nunca a service_role no frontend)
- ✅ O RLS (Row Level Security) protege seus dados

---

## 💡 Dica: Desenvolvimento sem Supabase

Se você ainda não tiver um projeto Supabase, pode:

1. **Criar um projeto grátis:**
   - Acesse: https://supabase.com
   - Clique em "Start your project"
   - Escolha o plano Free
   - Crie o projeto

2. **Usar o mock temporário:**
   - O sistema agora não quebra mesmo sem credenciais
   - Mostra avisos no console
   - Permite desenvolver a interface

---

## 📚 Próximos Passos

Após configurar o Supabase:

1. ✅ Configurar dados complementares → `SETUP_DADOS_COMPLEMENTARES.md`
2. ✅ Usar a API BigData → `CONFIGURACAO_BIGDATA.md`
3. ✅ Ver resumo completo → `RESUMO_IMPLEMENTACAO.md`

---

**Precisa de ajuda?** Veja a documentação do Supabase: https://supabase.com/docs

