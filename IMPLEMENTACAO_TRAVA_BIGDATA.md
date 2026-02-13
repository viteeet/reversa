# Implementação da Trava de Segurança BigData

## Resumo das Implementações

### 1. ✅ Tabela de Controle de Consultas

**Arquivo**: `database_schema_bigdata_consultas.sql`

Criada tabela `bigdata_consultas` no Supabase para armazenar histórico de consultas:
- Campo `documento`: CNPJ ou CPF (apenas números)
- Campo `tipo`: Tipo de consulta (basico, qsa, enderecos, telefones, emails, processos, pessoa_fisica)
- Campo `data_consulta`: Data e hora da consulta
- Campo `user_id`: ID do usuário que fez a consulta (opcional)
- Índices para busca rápida
- Função para limpeza automática de registros antigos (7 dias)

**Para aplicar**: Execute o script SQL no Supabase

---

### 2. ✅ Trava de Segurança no Endpoint

**Arquivo**: `src/app/api/bigdata/route.ts`

Implementada verificação que:
- Verifica se o documento (CNPJ/CPF) já foi consultado nas últimas 24 horas
- Bloqueia consultas duplicadas retornando erro 429 (Too Many Requests)
- Registra consultas bem-sucedidas no banco de dados
- Valida formato básico de CPF (11 dígitos) e CNPJ (14 dígitos)
- Retorna mensagem clara informando quando foi a última consulta

**Funcionalidades**:
- Verificação antes de fazer a chamada à API BigData
- Registro após sucesso da consulta
- Tratamento de erros (não bloqueia se houver problema no banco)
- Suporte a autenticação de usuário (opcional)

**Mensagem de erro retornada**:
```json
{
  "error": "Este CNPJ já foi consultado há X hora(s). Aguarde Y hora(s) antes de consultar novamente.",
  "ultima_consulta": "2024-01-01T12:00:00Z",
  "bloqueado": true
}
```

---

### 3. ✅ Melhorias nas Funções de Formatação

**Arquivo**: `src/lib/format.ts`

Funções atualizadas para:
- **`formatCpf()`**: Permite apenas números, limita a 11 dígitos, aplica máscara progressiva
- **`formatCnpj()`**: Permite apenas números, limita a 14 dígitos, aplica máscara progressiva
- **`formatCpfCnpj()`**: Detecta automaticamente se é CPF ou CNPJ e aplica máscara apropriada
- **`onlyDigits()`**: Remove todos os caracteres não numéricos

**Novas funções auxiliares**:
- `handleCpfInput()`: Handler específico para inputs de CPF
- `handleCnpjInput()`: Handler específico para inputs de CNPJ
- `handleCpfCnpjInput()`: Handler para inputs que aceitam ambos

**Comportamento**:
- Remove automaticamente caracteres não numéricos durante a digitação
- Aplica máscara progressivamente conforme o usuário digita
- Limita o tamanho máximo (11 para CPF, 14 para CNPJ)

---

## Como Funciona a Trava

### Fluxo de Consulta:

1. **Cliente faz requisição** → `/api/bigdata?cnpj=12345678000190&tipo=enderecos`

2. **Endpoint valida formato** → Verifica se CNPJ tem 14 dígitos ou CPF tem 11 dígitos

3. **Endpoint verifica histórico** → Consulta tabela `bigdata_consultas` para verificar se já foi consultado nas últimas 24h

4. **Se já foi consultado** → Retorna erro 429 com mensagem informativa

5. **Se não foi consultado** → Faz a chamada à API BigData

6. **Após sucesso** → Registra a consulta no banco de dados

### Exemplo de Bloqueio:

```
Requisição 1 (10:00): /api/bigdata?cnpj=12345678000190&tipo=enderecos
→ ✅ Sucesso, consulta registrada

Requisição 2 (10:30): /api/bigdata?cnpj=12345678000190&tipo=enderecos
→ ❌ Bloqueado: "Este CNPJ já foi consultado há 0 hora(s). Aguarde 24 hora(s) antes de consultar novamente."

Requisição 3 (11:00): /api/bigdata?cnpj=12345678000190&tipo=qsa
→ ✅ Sucesso (tipo diferente, trava é por tipo)
```

---

## Configuração Necessária

### Variáveis de Ambiente

Certifique-se de ter configurado:
- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço do Supabase (para acesso direto ao banco)

**Nota**: Se as variáveis não estiverem configuradas, a trava não será aplicada (modo de desenvolvimento).

---

## Campos de CPF/CNPJ

Todos os campos de CPF/CNPJ no sistema já estão usando as funções de formatação que:
- ✅ Permitem apenas números
- ✅ Aplicam máscara automaticamente
- ✅ Limitam o tamanho máximo

**Arquivos que já usam as máscaras**:
- `src/app/sacados/new/page.tsx`
- `src/app/sacados/[cnpj]/editar/page.tsx`
- `src/app/cedentes/page.tsx`
- `src/app/cedentes/[id]/editar/page.tsx`
- `src/app/pessoas-fisicas/[cpf]/editar/page.tsx`
- E outros...

---

## Testes Recomendados

1. **Teste de bloqueio**:
   - Faça uma consulta de CNPJ
   - Tente fazer a mesma consulta novamente
   - Verifique se retorna erro 429

2. **Teste de tipos diferentes**:
   - Consulte `enderecos` de um CNPJ
   - Consulte `qsa` do mesmo CNPJ
   - Deve permitir (trava é por tipo)

3. **Teste de máscara**:
   - Digite letras em um campo de CNPJ
   - Verifique se apenas números são aceitos
   - Verifique se a máscara é aplicada automaticamente

---

## Próximos Passos (Opcional)

1. **Interface de histórico**: Criar página para visualizar histórico de consultas
2. **Exceções para administradores**: Permitir consultas forçadas para admins
3. **Cache de resultados**: Armazenar resultados em cache para retornar sem consultar a API
4. **Limpeza automática**: Configurar cron job para limpar registros antigos

---

## Observações Importantes

- A trava é **por documento E tipo**: Um CNPJ pode ser consultado para diferentes tipos na mesma hora
- A trava é **por 24 horas**: Conta a partir da última consulta bem-sucedida
- A trava **não bloqueia em caso de erro no banco**: Sistema continua funcionando mesmo se houver problema
- A validação de formato é **básica**: Verifica apenas quantidade de dígitos, não valida dígitos verificadores na API
