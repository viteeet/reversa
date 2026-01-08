# 📋 Guia de Uso - Histórico de Cobrança e Relatório de Vencidos

## 🚀 Passo 1: Configuração Inicial

### 1.1 Criar a tabela de atividades de títulos

Execute o script SQL no Supabase:

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Abra o arquivo `database_schema_atividades_titulos.sql`
4. Copie e cole o conteúdo no editor SQL
5. Clique em **Run** para executar

Isso criará a tabela `titulos_atividades` necessária para o histórico de cobrança.

---

## 📊 Passo 2: Usar o Relatório de Vencidos

### 2.1 Acessar o Relatório

1. No menu principal, vá em **Relatórios** → **Vencidos**
2. Ou acesse diretamente: `/relatorios/vencidos`

### 2.2 Filtros Disponíveis

O relatório possui **5 filtros principais**:

#### **Filtro 1: Tipo**
- **Todos (Títulos + Acordos)**: Mostra títulos originais e parcelas de acordos
- **Apenas Títulos**: Mostra somente títulos originais vencidos
- **Apenas Acordos**: Mostra somente parcelas vencidas de acordos

#### **Filtro 2: Visualizar por**
- **Cedentes**: Agrupa por cedente (mostra todos os títulos/acordos de cada cedente)
- **Sacados**: Agrupa por sacado (mostra todos os títulos/acordos de cada sacado)

#### **Filtro 3: Fundo**
- **Todos os fundos**: Mostra todos os fundos
- **[Nome do Fundo]**: Filtra por um fundo específico

#### **Filtro 4: Período**
- **Vencendo hoje**: Apenas títulos/parcelas que vencem hoje
- **Vencidos**: Apenas títulos/parcelas já vencidos
- **Todos**: Todos os títulos/parcelas (independente da data)

#### **Filtro 5: Buscar**
- Digite nome do cedente/sacado ou CNPJ para buscar

### 2.3 Visualizar Histórico de Cobrança

No relatório, cada demanda mostra:

- **Últimas 3 atividades** de cobrança (se houver)
- **Badge** indicando o tipo de atividade (Ligação, Email, Negociação, etc.)
- **Data e hora** da atividade
- **Status** (Pendente ou Concluída)
- **Descrição** da atividade
- **Próxima ação** (se definida)

### 2.4 Registrar Nova Cobrança pelo Relatório

1. Encontre a demanda que deseja cobrar
2. Clique no botão **"+ Registrar Cobrança do Título"**
3. Você será redirecionado para a página do cedente, na aba de títulos
4. O título específico será destacado

---

## 💼 Passo 3: Registrar Atividades de Cobrança por Título

### 3.1 Pela Página do Cedente

1. Acesse o **Cedente** desejado
2. Vá na aba **"Títulos"**
3. Na tabela de títulos, encontre o título desejado
4. Clique no botão **"Cobrança"** (botão azul)
5. Um modal será aberto com o histórico de cobrança

### 3.2 Registrar Nova Atividade

No modal de histórico de cobrança:

1. Clique em **"+ Nova Atividade"**
2. Preencha os campos:
   - **Tipo de Atividade**: Ligação, Email, Reunião, Observação, Lembrete, Documento, Negociação
   - **Descrição***: Descreva o que foi feito
   - **Status**: Pendente, Concluída ou Cancelada
   - **Próxima Ação**: O que precisa ser feito depois (opcional)
   - **Data do Lembrete**: Quando você quer ser lembrado (opcional)
   - **Observações**: Informações adicionais (opcional)
3. Clique em **"Salvar"**

### 3.3 Editar ou Excluir Atividade

- **Editar**: Clique no botão **"Editar"** na atividade desejada
- **Excluir**: Clique no botão **"Excluir"** na atividade desejada

### 3.4 Filtrar Atividades

Use o dropdown no topo para filtrar:
- **Todas**: Mostra todas as atividades
- **Pendentes**: Apenas atividades pendentes
- **Concluídas**: Apenas atividades concluídas

---

## 📈 Passo 4: Entender a Diferença entre Títulos e Acordos

### Títulos Originais
- São os títulos vencidos **antes** de fazer o acordo
- Status: `vencido`, `renegociado`, `parcelado`, `pago`, `cancelado`
- Aparecem no relatório com badge **"Título"**

### Acordos (Parcelamentos)
- São os acordos/renegociações criados **depois** do acordo
- Contêm um ou mais títulos originais
- Geram parcelas que podem vencer
- Aparecem no relatório com badge **"Acordo"** e texto "Acordo - Parcela X"

### Histórico de Cobrança

- **Para Títulos Originais**: As atividades são registradas diretamente no título
- **Para Parcelas de Acordos**: As atividades são vinculadas ao **título original** relacionado ao acordo

**Exemplo:**
- Título #12345 foi incluído em um acordo
- O acordo gerou 3 parcelas
- Ao registrar cobrança da Parcela 1, a atividade fica vinculada ao Título #12345
- Assim, você vê todo o histórico de cobrança do título original, mesmo depois do acordo

---

## 🎯 Casos de Uso Práticos

### Caso 1: Ver quem preciso cobrar hoje

1. Acesse **Relatório de Vencidos**
2. Configure os filtros:
   - **Tipo**: Todos
   - **Período**: Vencendo hoje
   - **Fundo**: Selecione seu fundo (ou deixe "Todos")
3. Visualize a lista de demandas
4. Veja o histórico de cobrança de cada uma
5. Clique em **"+ Registrar Cobrança"** após fazer a ligação/email

### Caso 2: Acompanhar histórico completo de um título

1. Acesse o **Cedente**
2. Vá na aba **"Títulos"**
3. Clique em **"Cobrança"** no título desejado
4. Veja todo o histórico de atividades
5. Registre novas atividades conforme necessário

### Caso 3: Filtrar apenas acordos vencidos

1. Acesse **Relatório de Vencidos**
2. Configure:
   - **Tipo**: Apenas Acordos
   - **Período**: Vencidos
3. Veja apenas as parcelas de acordos que estão vencidas

### Caso 4: Ver todas as cobranças de um sacado

1. Acesse **Relatório de Vencidos**
2. Configure:
   - **Visualizar por**: Sacados
   - **Buscar**: Digite o nome ou CNPJ do sacado
3. Veja todos os títulos/acordos desse sacado agrupados
4. Veja o histórico de cobrança de cada um

---

## 💡 Dicas Importantes

1. **Sempre registre atividades**: Quanto mais completo o histórico, melhor o acompanhamento

2. **Use "Próxima Ação"**: Defina o que precisa ser feito depois para não esquecer

3. **Configure lembretes**: Use "Data do Lembrete" para atividades futuras importantes

4. **Status "Pendente"**: Use para atividades que ainda precisam ser concluídas

5. **Histórico unificado**: Mesmo depois de fazer acordo, o histórico continua vinculado ao título original

6. **Filtros combinados**: Combine múltiplos filtros para encontrar exatamente o que precisa

---

## 🔍 Resumo Rápido

| Onde | O que fazer |
|------|-------------|
| **Relatório de Vencidos** | Ver tudo que está vencido, com filtros e histórico |
| **Página do Cedente → Aba Títulos → Botão "Cobrança"** | Registrar e ver histórico completo de um título específico |
| **Botão "+ Registrar Cobrança"** no relatório | Registrar nova atividade rapidamente |

---

## ❓ Dúvidas Frequentes

**P: Posso registrar atividades para parcelas de acordos?**  
R: Sim! As atividades são vinculadas ao título original relacionado ao acordo.

**P: O histórico desaparece quando faço um acordo?**  
R: Não! O histórico permanece vinculado ao título original.

**P: Posso filtrar apenas títulos sem acordo?**  
R: Sim! Use o filtro "Tipo: Apenas Títulos".

**P: Como vejo atividades pendentes?**  
R: No modal de histórico, use o filtro "Pendentes" ou veja o badge amarelo "Pendente".

**P: Posso editar atividades antigas?**  
R: Sim! Clique em "Editar" na atividade desejada.

---

## 🎉 Pronto para usar!

Agora você tem controle total sobre o histórico de cobrança e pode acompanhar todas as demandas vencidas em um só lugar!

