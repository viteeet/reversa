# 🧭 Guia de Navegação - Hierarquia Cedente → Sacado

## 📊 Estrutura Atual

```
Sistema de Cobrança e Recuperação de Ativos
│
├── 🏢 CEDENTES (Clientes do Sistema)
│   ├── Lista de Cedentes (/cedentes)
│   └── Detalhe do Cedente (/cedentes/[id])
│       ├── Aba: 📋 Informações
│       │   ├── Dados Cadastrais
│       │   └── 📝 Dados Encontrados ✨ NOVO
│       ├── Aba: 👥 Sacados (N)
│       │   └── Lista de Sacados vinculados
│       └── Aba: 📞 Atividades
│
└── 👤 SACADOS (Devedores, dentro de cada Cedente)
    └── Detalhe do Sacado (/sacados/[cnpj])
        ├── Aba: 📋 Informações
        │   ├── Dados da Receita Federal
        │   └── 📝 Dados Encontrados ✨ NOVO
        └── Aba: 📞 Atividades
```

---

## 🔄 Fluxo de Trabalho Operacional

### 1️⃣ Cadastrar Cedente (Cliente)
```
Início → Cedentes → + Novo Cedente
   ↓
Preencher dados (pode buscar CNPJ na Receita)
   ↓
Salvar
```

### 2️⃣ Adicionar Sacados ao Cedente
```
Cedentes → [Selecionar Cedente] → Aba "Sacados"
   ↓
+ Adicionar Sacado
   ↓
Preencher CNPJ/Nome (pode buscar na Receita)
   ↓
Sacado automaticamente vinculado ao Cedente
```

### 3️⃣ Adicionar Dados Encontrados
```
PARA CEDENTE:
Cedentes → [Selecionar] → Aba "Informações"
   ↓
Seção "Dados Encontrados"
   ↓
+ Adicionar Informação
   ↓
Preencher: Tipo, Título, Conteúdo, Fonte, etc.

PARA SACADO:
Cedentes → [Selecionar] → Aba "Sacados" → [Ver Sacado]
   ↓
Seção "Dados Encontrados"
   ↓
+ Adicionar Informação
```

### 4️⃣ Registrar Atividades de Cobrança
```
Cedente ou Sacado → Aba "Atividades"
   ↓
+ Nova Atividade
   ↓
Tipo: Ligação, Email, Reunião, WhatsApp, etc.
   ↓
Status: Pendente / Concluída
```

### 5️⃣ Gerar Ficha de Cobrança
```
Sacado → Botão "Gerar Ficha de Cobrança"
   ↓
Relatório completo com:
- Dados da Receita
- Dados Encontrados
- QSA (Sócios)
- Processos
- Atividades
```

---

## 🗂️ Estrutura de Menus Recomendada

### Menu Principal (Sidebar/Header)

```
🏠 Dashboard
   └── Visão geral do sistema

📊 Operacional
   ├── 🏢 Cedentes (Lista de clientes)
   │   ├── Ver todos
   │   ├── Adicionar novo
   │   └── [Dentro de cada cedente]
   │       └── 👥 Sacados (Lista de devedores)
   │           ├── Ver sacados
   │           ├── Adicionar sacado
   │           └── Gerar fichas
   │
   └── 📞 Atividades (Global)
       ├── Minhas atividades
       ├── Todas atividades
       └── Calendário

💰 Financeiro
   ├── 📈 Dashboard Financeiro
   ├── 💸 Contas a Pagar
   ├── 💰 Contas a Receber
   ├── 💹 Fluxo de Caixa
   ├── 📊 Faturamento
   └── ⚙️ Configurações
       ├── Categorias
       ├── Contas Bancárias
       ├── Meios de Pagamento
       └── Elementos Financeiros

🔧 Utilitários
   ├── 🔍 Busca CNPJ (Receita)
   ├── 📊 BI - CVM
   └── 📄 Relatórios

⚙️ Configurações
   ├── 👤 Perfil
   ├── 🏷️ Status
   └── 🎨 Preferências
```

---

## 🚫 Mudanças Necessárias nos Menus

### ❌ REMOVER:
- Link direto "Sacados" do menu principal
- Página `/sacados` (lista de todos os sacados)
- Qualquer rota que liste sacados globalmente

### ✅ MANTER:
- Rotas de detalhe: `/sacados/[cnpj]` (acesso via cedente)
- Rotas de edição: `/sacados/[cnpj]/editar`
- Rotas de cobrança: `/sacados/[cnpj]/cobranca`

### ✨ ADICIONAR:
- Breadcrumbs mostrando hierarquia:
  ```
  Cedentes > [Nome do Cedente] > Sacados > [Nome do Sacado]
  ```
- Botão "Voltar para Cedente" nas páginas de sacado
- Contador de sacados no card/badge do cedente

---

## 🔗 Navegação Entre Páginas

### Da Lista de Cedentes → Detalhe do Cedente:
```tsx
// Rota: /cedentes/[id]
<Link href={`/cedentes/${cedente.id}`}>
  <Button>Ver Cedente</Button>
</Link>
```

### Do Cedente → Lista de Sacados:
```tsx
// Já está na página do cedente, apenas mudar aba
<button onClick={() => setActiveTab('sacados')}>
  Sacados (5)
</button>
```

### Da Lista de Sacados → Detalhe do Sacado:
```tsx
// Rota: /sacados/[cnpj]
<Link href={`/sacados/${encodeURIComponent(sacado.cnpj)}`}>
  <Button>Ver Sacado</Button>
</Link>
```

### Do Sacado → Volta para Cedente:
```tsx
// Adicionar no componente do sacado
const [cedenteInfo, setCedenteInfo] = useState(null);

// Carregar info do cedente
const { data } = await supabase
  .from('sacados')
  .select('cedente_id, cedentes(id, nome)')
  .eq('cnpj', cnpj)
  .single();

// Botão de navegação
<Link href={`/cedentes/${cedenteInfo.cedente_id}`}>
  ← Voltar para {cedenteInfo.cedentes.nome}
</Link>
```

---

## 📋 Breadcrumbs Recomendados

### Exemplo de Componente:
```tsx
// src/components/layout/Breadcrumb.tsx
export default function Breadcrumb({ items }) {
  return (
    <nav className="flex text-sm text-gray-600 mb-4">
      {items.map((item, index) => (
        <span key={index}>
          {index > 0 && <span className="mx-2">/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-blue-600">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
```

### Uso nas Páginas:

**Página do Cedente:**
```tsx
<Breadcrumb items={[
  { label: 'Cedentes', href: '/cedentes' },
  { label: cedente.nome }
]} />
```

**Página do Sacado:**
```tsx
<Breadcrumb items={[
  { label: 'Cedentes', href: '/cedentes' },
  { label: cedente.nome, href: `/cedentes/${cedente.id}` },
  { label: 'Sacados', href: `/cedentes/${cedente.id}?tab=sacados` },
  { label: sacado.razao_social }
]} />
```

---

## 🎯 Próximas Ações

### 1. Atualizar Menu Principal
- [ ] Remover link "Sacados" standalone
- [ ] Manter apenas "Cedentes" no menu operacional
- [ ] Adicionar contador de sacados no card do cedente

### 2. Adicionar Breadcrumbs
- [ ] Criar componente Breadcrumb
- [ ] Implementar em página do cedente
- [ ] Implementar em página do sacado com link de volta

### 3. Melhorar UX
- [ ] Adicionar botão "← Voltar para Cedente" nas páginas de sacado
- [ ] Mostrar nome do cedente no header da página do sacado
- [ ] Adicionar indicador visual da hierarquia (ícones, cores)

### 4. Validações
- [ ] Garantir que todo sacado tenha cedente_id
- [ ] Impedir criação de sacado sem cedente
- [ ] Redirecionar corretamente após ações

---

## ✅ Status Atual

- ✅ Relação cedente→sacado no banco de dados
- ✅ Sacados mostrados na aba do cedente
- ✅ Criação de sacado exige seleção de cedente
- ✅ Dados encontrados para ambos (cedente e sacado)
- ⏳ Menus ainda não atualizados
- ⏳ Breadcrumbs não implementados

---

**Recomendação:** Priorizar atualização dos menus e breadcrumbs para refletir a hierarquia correta do sistema!
