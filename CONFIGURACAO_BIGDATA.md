# Configuração BigData Corp API

## ✅ Status: CONFIGURADO

A integração com a BigData Corp está **configurada e pronta para uso**!

---

## 🔑 Credenciais Configuradas

As seguintes credenciais foram adicionadas ao `.env.local`:

```
BIGDATA_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
BIGDATA_TOKEN_ID=689257bb7e2263167a1bc867
```

**Importante:** 
- Token expira em: **16/06/2026** (conforme JWT)
- Usuário: Victor Hugo (VICTOR.MOBI)
- Domínio: INOVA SECURITIZADORA
- Produto: BIGBOOST

---

## 📡 Como Funciona

### Endpoint da API
```
POST https://plataforma.bigdatacorp.com.br/companies/registration_data
```

### Headers necessários:
- `Content-Type: application/json`
- `AccessToken: <seu token>`
- `TokenId: <seu token id>`

### Body da requisição:
```json
{
  "Datasets": "registration_data",
  "q": "doc{CNPJ}",
  "Limit": 1
}
```

---

## 🎯 Dados Retornados

A API BigData retorna os seguintes dados (que são automaticamente convertidos):

### ✅ Endereços
- Endereço Principal (Primary)
- Endereço Secundário (Secondary)
- Incluindo: CEP, Cidade, Estado, Tipo

### ✅ Telefones
- Telefone Principal
- Telefone Secundário
- Com DDD e tipo (comercial/fixo)

### ✅ E-mails
- E-mail Principal
- Tipo (corporativo/pessoal)

### ⚠️ Dados NÃO disponíveis neste endpoint:
- QSA (Quadro de Sócios) - requer endpoint específico
- Pessoas Ligadas - requer endpoint específico
- Empresas Ligadas - requer endpoint específico
- Processos Judiciais - requer endpoint específico

---

## 🚀 Como Usar no Sistema

### 1. Acesse a página de edição de um sacado
```
/sacados/[CNPJ]/editar
```

### 2. Clique em "Buscar da API" nas seções:
- ✅ **Endereços Encontrados** - Funciona!
- ✅ **Telefones Encontrados** - Funciona!
- ✅ **E-mails Encontrados** - Funciona!
- ⚠️ QSA - Retorna vazio (endpoint não disponível)
- ⚠️ Pessoas Ligadas - Retorna vazio
- ⚠️ Empresas Ligadas - Retorna vazio
- ⚠️ Processos - Retorna vazio

### 3. Os dados serão:
1. Buscados da API BigData
2. Convertidos para o formato do sistema
3. Salvos automaticamente no banco
4. Marcados com origem "API"

---

## 🔧 Conversão de Dados

O sistema faz a seguinte conversão automática:

### Endereços:
```
BigData Format → Sistema Format
{
  Typology: "AV",           →  endereco: "AV DAS AMERICAS, 700..."
  AddressMain: "DAS...",
  Number: "700",
  Neighborhood: "BARRA...", →  tipo: "comercial"
  ZipCode: "22640100",      →  cep: "22640-100"
  City: "RIO DE JANEIRO",   →  cidade: "RIO DE JANEIRO"
  State: "RJ"               →  estado: "RJ"
}
```

### Telefones:
```
{
  AreaCode: "21",           →  telefone: "(21) 3030-0676"
  Number: "30300676",
  Type: "WORK"              →  tipo: "comercial"
}
```

### E-mails:
```
{
  EmailAddress: "fin@...",  →  email: "fin@bigdatacorp.com.br"
  Type: "CORPORATE"         →  tipo: "comercial"
}
```

---

## 📊 Exemplo de Resposta Completa

```json
{
  "Result": [
    {
      "RegistrationData": {
        "BasicData": {
          "TaxIdNumber": "08746479000107",
          "OfficialName": "BIG DATA CORP S.A.",
          "TaxIdStatus": "ATIVA"
        },
        "Addresses": {
          "Primary": { ... },
          "Secondary": { ... }
        },
        "Phones": {
          "Primary": { ... },
          "Secondary": { ... }
        },
        "Emails": {
          "Primary": { ... }
        }
      }
    }
  ],
  "Status": {
    "registration_data": [
      { "Code": 0, "Message": "OK" }
    ]
  }
}
```

---

## ⚡ Endpoints Adicionais (Para Implementar)

Se quiser buscar QSA, Processos, etc., você precisará usar outros endpoints da BigData:

### QSA (Sócios):
Endpoint diferente - consulte documentação BigData

### Processos Judiciais:
Endpoint diferente - consulte documentação BigData

### Relacionamentos:
Endpoint diferente - consulte documentação BigData

---

## 🛠️ Manutenção

### Se o token expirar:
1. Gere um novo token no portal BigData
2. Atualize o arquivo `.env.local`:
   ```env
   BIGDATA_ACCESS_TOKEN=novo-token-aqui
   BIGDATA_TOKEN_ID=novo-id-aqui
   ```
3. Reinicie o servidor Next.js

### Para debugar:
1. Abra o Console do navegador (F12)
2. Vá em "Network" → "Fetch/XHR"
3. Clique em "Buscar da API"
4. Veja a requisição para `/api/bigdata`

---

## 📝 Logs

A API loga automaticamente:
- ✅ Sucesso nas buscas
- ⚠️ Avisos quando API não está configurada
- ❌ Erros com detalhes

Veja os logs no console do servidor Next.js.

---

## 🎉 Resultado

Agora você pode:
1. Buscar dados reais da BigData
2. Enriquecer cadastros de sacados automaticamente
3. Ter histórico de origem (API vs Manual)
4. Editar/excluir dados importados

**Tudo funcionando!** 🚀

