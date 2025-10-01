# 🚀 Início Rápido - Dados Complementares

## ⚡ 3 Passos para começar

### 1️⃣ Execute o SQL no Supabase (1 minuto)
```sql
1. Abra Supabase Dashboard
2. Vá em "SQL Editor"
3. Cole o conteúdo de: database_schema_complementos.sql
4. Clique "Run"
```

### 2️⃣ Configure o Supabase no .env.local (30 segundos)
```env
NEXT_PUBLIC_SUPABASE_URL=sua-url-aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-aqui
```

### 3️⃣ Reinicie o servidor
```bash
# Pare o servidor (Ctrl+C)
npm run dev
```

---

## 🎯 Como Usar

### Opção 1: Buscar da API BigData (automático)
```
1. Vá em http://localhost:3000/sacados
2. Clique "Editar" em um sacado
3. Clique "Buscar da API" nas seções:
   - Endereços ✅
   - Telefones ✅
   - E-mails ✅
4. Pronto! Dados importados automaticamente
```

### Opção 2: Adicionar Manualmente
```
1. Vá em http://localhost:3000/sacados
2. Clique "Editar" em um sacado
3. Clique "Adicionar" em qualquer seção
4. Preencha o formulário
5. Clique "Salvar"
```

---

## 📄 Ver a Ficha Completa

```
1. Vá em http://localhost:3000/sacados
2. Clique "Ficha" em um sacado
3. Veja todos os dados formatados
4. Clique "Imprimir" se quiser PDF
```

---

## ✅ Status da API BigData

**Configuração:** ✅ Pronta  
**Token:** ✅ Válido até 2026  
**Dados disponíveis:**
- ✅ Endereços (2)
- ✅ Telefones (2)
- ✅ E-mails (1)

**Para adicionar manualmente:**
- QSA (Sócios)
- Processos
- Pessoas/Empresas Ligadas

---

## 📚 Documentação Completa

- `RESUMO_IMPLEMENTACAO.md` - Visão geral completa
- `CONFIGURACAO_BIGDATA.md` - Detalhes técnicos da API
- `SETUP_DADOS_COMPLEMENTARES.md` - Guia detalhado

---

## 🆘 Problemas?

### Erro: "Tabelas não existem"
👉 Execute o SQL no Supabase (Passo 1)

### Erro: "Supabase não configurado"
👉 Configure o .env.local (Passo 2)

### API não retorna dados
👉 Normal! Use "Adicionar" para inserir manualmente

---

**Tudo pronto! Bom uso! 🎉**

