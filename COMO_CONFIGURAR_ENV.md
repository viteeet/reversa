# 🔧 Como Configurar Variáveis de Ambiente

## 📍 Onde Configurar

### 1. **Vercel** (Para Deploy em Produção) ✅ RECOMENDADO

Se você está fazendo deploy no Vercel, configure as variáveis de ambiente lá:

#### Passo a Passo:

1. **Acesse o Dashboard do Vercel**
   - Vá para: https://vercel.com/dashboard
   - Faça login na sua conta

2. **Selecione seu Projeto**
   - Clique no projeto "reversa" (ou o nome do seu projeto)

3. **Vá em Settings → Environment Variables**
   - No menu lateral, clique em **Settings**
   - Depois clique em **Environment Variables**

4. **Adicione as Variáveis**
   - Clique em **Add New**
   - Adicione cada variável:

   ```
   Nome: BIGDATA_ACCESS_TOKEN
   Valor: [cole seu token aqui]
   Environment: Production, Preview, Development (marque todos)
   ```

   ```
   Nome: BIGDATA_TOKEN_ID
   Valor: [cole seu token ID aqui]
   Environment: Production, Preview, Development (marque todos)
   ```

   ```
   Nome: NEXT_PUBLIC_SUPABASE_URL
   Valor: [sua URL do Supabase]
   Environment: Production, Preview, Development
   ```

   ```
   Nome: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Valor: [sua chave anon do Supabase]
   Environment: Production, Preview, Development
   ```

   ```
   Nome: SUPABASE_SERVICE_ROLE_KEY
   Valor: [sua service role key do Supabase]
   Environment: Production, Preview, Development
   ```

5. **Salve e Faça Redeploy**
   - Clique em **Save**
   - Vá em **Deployments**
   - Clique nos 3 pontinhos do último deployment
   - Clique em **Redeploy**

---

### 2. **Supabase** (Para Variáveis do Banco)

O Supabase **NÃO** é onde você configura variáveis de ambiente do Next.js.

O Supabase é usado para:
- ✅ Configurar o banco de dados
- ✅ Executar SQL scripts
- ✅ Gerenciar tabelas
- ✅ Ver dados

**Mas as variáveis de ambiente do Next.js** (como `BIGDATA_ACCESS_TOKEN`) devem ser configuradas no **Vercel** (ou no `.env.local` para desenvolvimento local).

---

### 3. **Local (Desenvolvimento)** - `.env.local`

Para desenvolvimento local na sua máquina:

1. **Crie/Edite o arquivo `.env.local`** na raiz do projeto:

```env
# API BigData
BIGDATA_ACCESS_TOKEN=seu_token_aqui
BIGDATA_TOKEN_ID=seu_token_id_aqui

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

2. **Reinicie o servidor**
   ```bash
   # Pare o servidor (Ctrl+C)
   npm run dev
   ```

---

## 📋 Resumo

| Onde | Para quê | Quando usar |
|------|----------|-------------|
| **Vercel** | Variáveis de ambiente em produção | ✅ Quando fizer deploy |
| **Supabase** | Banco de dados, SQL, tabelas | ✅ Para gerenciar dados |
| **`.env.local`** | Variáveis locais (desenvolvimento) | ✅ Quando desenvolver localmente |

---

## ⚠️ IMPORTANTE

- **NUNCA** commite o arquivo `.env.local` no Git
- O arquivo `.env.local` já deve estar no `.gitignore`
- Use o **Vercel** para variáveis de ambiente em produção
- O **Supabase** é apenas para o banco de dados, não para variáveis de ambiente do Next.js

---

## 🔗 Links Úteis

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Docs - Environment Variables**: https://vercel.com/docs/concepts/projects/environment-variables
- **Supabase Dashboard**: https://supabase.com/dashboard
