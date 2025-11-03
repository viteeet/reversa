# 🎨 Guia Visual - Antes e Depois

## 📱 Página de Detalhes do Sacado

### ANTES
```
┌─────────────────────────────────────────────────────────────┐
│ ACME LTDA                                                   │
│ ACME Comércio                                              │
│ 12.345.678/0001-90                                         │
│                                                             │
│ ┌─ Informações Básicas ──────────────────────────────────┐ │
│ │                                                          │ │
│ │ Situação              Porte                             │ │
│ │ ATIVA                 PEQUENO                           │ │
│ │                                                          │ │
│ │ Natureza Jurídica     Data de Abertura                 │ │
│ │ LTDA                  01/01/2020                        │ │
│ │                                                          │ │
│ │ Capital Social        Simples Nacional                  │ │
│ │ R$ 50.000,00         Sim                               │ │
│ │                                                          │ │
│ │ Atividade Principal                                     │ │
│ │ Comércio varejista de artigos...                       │ │
│ │                                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### DEPOIS
```
┌─────────────────────────────────────────────────────────────┐
│ ACME LTDA                                                   │
│ ACME Comércio                                              │
│ 12.345.678/0001-90                                         │
│                                                             │
│ ┌─ 🏛️ Dados da Receita Federal ─────────────────────────┐ │
│ │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │ │
│ │ │Situação│ │Porte   │ │Simples │ │Data Ab.│            │ │
│ │ │ATIVA   │ │PEQUENO │ │Sim     │ │01/2020 │            │ │
│ │ └────────┘ └────────┘ └────────┘ └────────┘            │ │
│ │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │ │
│ │ │Capital │ │Telefone│ │Email   │ │Natureza│            │ │
│ │ │R$ 50k  │ │(11)555.│ │@acme   │ │LTDA    │            │ │
│ │ └────────┘ └────────┘ └────────┘ └────────┘            │ │
│ │ ┌──────────────────────────────────────────────────────┐ │ │
│ │ │ Endereço: Rua ABC, 123 - Centro - SP               │ │ │
│ │ └──────────────────────────────────────────────────────┘ │ │
│ │ ┌──────────────────────────────────────────────────────┐ │ │
│ │ │ Atividade: Comércio varejista de artigos...        │ │ │
│ │ └──────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ 📝 Dados Encontrados ────────────── [+ Adicionar Info] ┐ │
│ │                                                          │ │
│ │ ┌─ 📞 Telefone (2) ────────────────────────────────────┐│ │
│ │ │ ┌──────────────────────────────────────────────────┐ ││ │
│ │ │ │ Celular do Sócio João           [🔵 Google]      │ ││ │
│ │ │ │ (11) 98765-4321                                  │ ││ │
│ │ │ │ Obs: Atende horário comercial                    │ ││ │
│ │ │ │ Encontrado em: 03/11/2025                       │ ││ │
│ │ │ │                         [Editar] [Excluir]       │ ││ │
│ │ │ └──────────────────────────────────────────────────┘ ││ │
│ │ │ ┌──────────────────────────────────────────────────┐ ││ │
│ │ │ │ WhatsApp da Empresa         [🔵 Site]           │ ││ │
│ │ │ │ (11) 91234-5678                                  │ ││ │
│ │ │ │                         [Editar] [Excluir]       │ ││ │
│ │ │ └──────────────────────────────────────────────────┘ ││ │
│ │ └──────────────────────────────────────────────────────┘│ │
│ │                                                          │ │
│ │ ┌─ 📧 Email (1) ───────────────────────────────────────┐│ │
│ │ │ ┌──────────────────────────────────────────────────┐ ││ │
│ │ │ │ Email Financeiro            [🔵 Indicação]       │ ││ │
│ │ │ │ financeiro@acme.com.br                           │ ││ │
│ │ │ │ Obs: Falar com Maria                            │ ││ │
│ │ │ │                         [Editar] [Excluir]       │ ││ │
│ │ │ └──────────────────────────────────────────────────┘ ││ │
│ │ └──────────────────────────────────────────────────────┘│ │
│ │                                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│        [Editar Dados Complementares (QSA, Processos, etc.)]│
└─────────────────────────────────────────────────────────────┘
```

## 📋 Modal de Adicionar Informação

```
┌─────────────────────────────────────────────────────┐
│ ✕  Adicionar Informação Encontrada                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Tipo de Informação*                                 │
│ ┌──────────────────────────────────────────────────┐│
│ │ 📞 Telefone                              ▼       ││
│ └──────────────────────────────────────────────────┘│
│                                                     │
│ Título*                                             │
│ ┌──────────────────────────────────────────────────┐│
│ │ Celular do Sócio João                            ││
│ └──────────────────────────────────────────────────┘│
│                                                     │
│ Conteúdo*                                           │
│ ┌──────────────────────────────────────────────────┐│
│ │ (11) 98765-4321                                  ││
│ │                                                  ││
│ │                                                  ││
│ └──────────────────────────────────────────────────┘│
│                                                     │
│ Fonte                                               │
│ ┌──────────────────────────────────────────────────┐│
│ │ Google                                   ▼       ││
│ └──────────────────────────────────────────────────┘│
│                                                     │
│ Observações                                         │
│ ┌──────────────────────────────────────────────────┐│
│ │ Atende horário comercial                         ││
│ │                                                  ││
│ └──────────────────────────────────────────────────┘│
│                                                     │
│ Data Encontrado                                     │
│ ┌──────────────────────────────────────────────────┐│
│ │ 03/11/2025                                       ││
│ └──────────────────────────────────────────────────┘│
│                                                     │
│ ──────────────────────────────────────────────────  │
│                                                     │
│  [   Salvar   ]    [ Cancelar ]                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 📄 Relatório de Cobrança (Ficha)

### ANTES (Final do Relatório)
```
...
┌─ Processos Judiciais ─────────────────────────────────┐
│ Processo: 1234567-89.2024.8.26.0100                  │
│ Tipo: Cível                                           │
│ Status: Em andamento                                  │
└───────────────────────────────────────────────────────┘
                                                   [FIM]
```

### DEPOIS (Final do Relatório)
```
...
┌─ Processos Judiciais ─────────────────────────────────┐
│ Processo: 1234567-89.2024.8.26.0100                  │
│ Tipo: Cível                                           │
│ Status: Em andamento                                  │
└───────────────────────────────────────────────────────┘

┌─ Dados Encontrados (Pesquisa Manual) ────────────────┐
│                                                       │
│ ┌─ 📞 Telefones Encontrados ────────────────────────┐│
│ │ ┌───────────────────────────────────────────────┐ ││
│ │ │ Celular do Sócio João      [🔵 Google]        │ ││
│ │ │ (11) 98765-4321                               │ ││
│ │ │ Obs: Atende horário comercial                 │ ││
│ │ │ Encontrado em: 03/11/2025                    │ ││
│ │ └───────────────────────────────────────────────┘ ││
│ │ ┌───────────────────────────────────────────────┐ ││
│ │ │ WhatsApp da Empresa        [🔵 Site]          │ ││
│ │ │ (11) 91234-5678                               │ ││
│ │ │ Encontrado em: 03/11/2025                    │ ││
│ │ └───────────────────────────────────────────────┘ ││
│ └───────────────────────────────────────────────────┘│
│                                                       │
│ ┌─ 📧 Emails Encontrados ───────────────────────────┐│
│ │ ┌───────────────────────────────────────────────┐ ││
│ │ │ Email Financeiro           [🔵 Indicação]     │ ││
│ │ │ financeiro@acme.com.br                        │ ││
│ │ │ Obs: Falar com Maria                         │ ││
│ │ │ Encontrado em: 02/11/2025                    │ ││
│ │ └───────────────────────────────────────────────┘ ││
│ └───────────────────────────────────────────────────┘│
│                                                       │
│ ┌─ 👤 Pessoas Relacionadas ─────────────────────────┐│
│ │ ┌───────────────────────────────────────────────┐ ││
│ │ │ Gerente Comercial          [🔵 LinkedIn]      │ ││
│ │ │ João Silva - Contato direto para negociações │ ││
│ │ │ Encontrado em: 01/11/2025                    │ ││
│ │ └───────────────────────────────────────────────┘ ││
│ └───────────────────────────────────────────────────┘│
│                                                       │
└───────────────────────────────────────────────────────┘
                                                   [FIM]
```

## 🎨 Paleta de Cores

### Dados da Receita Federal
- **Background**: `#f0f9ff` → `#e0f2fe` (gradiente azul claro)
- **Borda**: `#bae6fd` (azul suave)
- **Cards**: `#ffffff` (branco)
- **Título**: `#0369a1` (azul médio)

### Dados Encontrados
- **Background seção**: `#f8fafc` (cinza muito claro)
- **Borda seção**: `#e2e8f0` (cinza claro)
- **Cards individuais**: `#ffffff` (branco)
- **Borda cards**: `#e2e8f0` (cinza claro)

### Badges
- **Fonte (Info)**: `#3b82f6` (azul)
- **Origem API**: `#3b82f6` (azul)
- **Origem Manual**: `#64748b` (cinza)

## 📊 Grid Responsivo

### Desktop (lg+)
```
┌──────┬──────┬──────┬──────┐
│ Col1 │ Col2 │ Col3 │ Col4 │  ← 4 colunas
└──────┴──────┴──────┴──────┘
```

### Tablet (sm-md)
```
┌──────────┬──────────┐
│   Col1   │   Col2   │          ← 2 colunas
└──────────┴──────────┘
```

### Mobile (xs)
```
┌────────────────────┐
│       Col1         │          ← 1 coluna
├────────────────────┤
│       Col2         │
└────────────────────┘
```

## 🔄 Comparação de Espaço

### ANTES
- **Altura média**: ~800px
- **Informações por tela**: 6-8 campos
- **Densidade**: Baixa

### DEPOIS
- **Altura média**: ~600px (Receita) + dinâmico (Dados Encontrados)
- **Informações por tela**: 8+ campos (Receita) + ilimitado (Encontrados)
- **Densidade**: Alta (compacto mas legível)

## 📱 Icons e Emojis Utilizados

| Elemento | Ícone | Uso |
|----------|-------|-----|
| Receita Federal | 🏛️ | Seção de dados oficiais |
| Telefone | 📞 | Categoria telefones |
| Email | 📧 | Categoria emails |
| Endereço | 📍 | Categoria endereços |
| Pessoa | 👤 | Categoria pessoas |
| Empresa | 🏢 | Categoria empresas |
| Processo | ⚖️ | Categoria processos |
| Outros | 📝 | Categoria outros |
| Fonte | 🔵 | Badge de fonte |

## ✨ Destaques Visuais

### Hierarquia de Informação
1. **Nome da Empresa** (h1, grande, bold)
2. **Seções** (h2, médio, bold, ícone)
3. **Categorias** (h3, pequeno, semibold, ícone)
4. **Dados** (text, normal)

### Espaçamento
- **Entre seções**: 24px
- **Entre cards**: 12px
- **Padding interno**: 12-16px
- **Grid gap**: 12px

### Bordas
- **Radius**: 8px (arredondado)
- **Width**: 1px (fina)
- **Cor**: `#e2e8f0` (cinza claro)

---

**Design**: Clean, moderno e profissional  
**Inspiração**: Dashboards SaaS modernos  
**Princípios**: Densidade + Clareza + Hierarquia
