# 📥 Modelo de Importação de Títulos - Excel/CSV

## ✅ Formato Aceito

O sistema aceita **qualquer nome de coluna** desde que contenha as informações necessárias. A detecção é automática e flexível.

## 📋 Colunas Obrigatórias

### 1. **CNPJ do Sacado** (Obrigatório)
O sistema procura por qualquer uma dessas colunas:
- `cnpj`
- `CNPJ`
- `cnpj_sacado`
- `CNPJ_Sacado`
- `cpf_cnpj`
- `documento`

**Formato aceito:**
- Com ou sem formatação: `12.345.678/0001-90` ou `12345678000190`
- Deve ter 14 dígitos e ser um CNPJ válido

### 2. **Número do Título** (Obrigatório)
O sistema procura por qualquer uma dessas colunas:
- `numero_titulo`
- `Número do Título`
- `Duplicata`
- `Nº Título`
- `numero`

### 3. **Valor Original** (Obrigatório)
O sistema procura por qualquer uma dessas colunas:
- `valor_original`
- `Valor Original`
- `valor`
- `Valor`

**Formato aceito:** Número (ex: `1000.50` ou `1000,50`)

### 4. **Data de Vencimento** (Obrigatório)
O sistema procura por qualquer uma dessas colunas:
- `data_vencimento`
- `Data Vencimento`
- `vencimento`
- `Vencimento`

**Formato aceito:** Data (ex: `2024-01-15` ou `15/01/2024`)

## 📋 Colunas Opcionais

### 5. **Valor Atualizado**
- `valor_atualizado`
- `Valor Atualizado`
- `valor_total`

**Se não informado:** Usa o mesmo valor do "Valor Original"

### 6. **Razão Social do Sacado**
- `razao_social`
- `Razão Social`
- `sacado`
- `Sacado`

**Uso:** Usado ao criar novo sacado se CNPJ não existir

### 7. **Nome Fantasia**
- `nome_fantasia`
- `Nome Fantasia`

### 8. **Telefone**
- `telefone`
- `Telefone`

### 9. **Crítica**
- `critica`
- `Crítica`
- `status`

**Valores comuns:** `Protestado`, `Enviado a Cartório`, `Recebido Instrumento de Protesto`

### 10. **Checagem**
- `checagem`
- `Checagem`
- `observacoes`

### 11. **VADU**
- `vadu`
- `VADU`

## 📊 Exemplo de Planilha

### Formato Simples (Mínimo)

| CNPJ | Número do Título | Valor Original | Data Vencimento |
|------|------------------|----------------|-----------------|
| 12345678000190 | 001 | 1000.00 | 2024-01-15 |
| 12345678000190 | 002 | 2000.00 | 2024-02-20 |
| 98765432000111 | 003 | 1500.00 | 2024-03-10 |

### Formato Completo (Recomendado)

| CNPJ | Razão Social | Nome Fantasia | Número do Título | Valor Original | Valor Atualizado | Data Vencimento | Telefone | Crítica | Checagem | VADU |
|------|--------------|---------------|------------------|----------------|------------------|-----------------|----------|---------|----------|------|
| 12.345.678/0001-90 | Empresa ABC LTDA | ABC | 001 | 1000.00 | 1200.00 | 15/01/2024 | (11) 99999-9999 | Protestado | Confirmado | Autorizado |
| 12.345.678/0001-90 | Empresa ABC LTDA | ABC | 002 | 2000.00 | 2400.00 | 20/02/2024 | (11) 99999-9999 | Enviado a Cartório | Pendente | - |
| 98.765.432/0001-11 | Empresa XYZ EIRELI | XYZ | 003 | 1500.00 | 1500.00 | 10/03/2024 | (21) 88888-8888 | - | - | - |

## ⚠️ Importante

1. **CNPJ é obrigatório:** Títulos sem CNPJ válido **não serão importados**
2. **Primeira linha:** Deve conter os cabeçalhos (nomes das colunas)
3. **Formato de data:** Aceita `YYYY-MM-DD` ou `DD/MM/YYYY`
4. **Formato de valor:** Aceita ponto ou vírgula como separador decimal
5. **CNPJ duplicado:** Se o mesmo CNPJ aparecer várias vezes, o sacado será criado apenas uma vez

## 🔄 Fluxo de Importação

1. **Clique em "📥 Importar Excel/CSV"**
2. **Selecione o arquivo** (.xlsx, .xls ou .csv)
3. **Visualize o preview** dos dados
4. **Marque "Consultar APIs"** se quiser buscar dados complementares dos sacados novos
5. **Clique em "Salvar Importação"**

## ✅ O que acontece na importação

### Se o sacado **NÃO existe** (novo CNPJ):
- ✅ Cria o sacado automaticamente
- ✅ Se marcou "Consultar APIs": busca e salva endereços, telefones, emails e QSA
- ✅ Cria o título vinculado ao sacado

### Se o sacado **JÁ existe**:
- ✅ Cria apenas o título vinculado ao sacado existente
- ⚠️ Não consulta APIs novamente (para não sobrescrever dados)

### Se **NÃO tiver CNPJ**:
- ❌ Título **não será importado**
- ⚠️ Aparece no preview marcado como "Sem CNPJ"
- 💡 **Solução:** Adicione o CNPJ na planilha ou cadastre manualmente

## 📝 Dicas

1. **Use o formato completo** para melhor resultado
2. **Verifique o CNPJ** antes de importar (deve ter 14 dígitos válidos)
3. **Marque "Consultar APIs"** para sacados novos (enriquece os dados automaticamente)
4. **Títulos duplicados** são ignorados automaticamente (não gera erro)

## 🎯 Exemplo Prático

### Planilha de entrada:
```
CNPJ              | Duplicata | Valor    | Vencimento
12345678000190    | 001       | 1000.00  | 2024-01-15
12345678000190    | 002       | 2000.00  | 2024-02-20
```

### Resultado:
- ✅ Sacado `12345678000190` criado (se não existir)
- ✅ 2 títulos criados vinculados a esse sacado
- ✅ Se marcou "Consultar APIs": dados complementares salvos

---

**Pronto para usar!** Basta ter as colunas com os nomes acima (ou variações) e o sistema detecta automaticamente.

