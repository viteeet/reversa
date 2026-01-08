# Como Funciona a Integração de Pessoas Físicas com Pessoas Ligadas

## 📋 Entendendo o Sistema

O sistema tem **duas formas** de trabalhar com pessoas físicas:

### 1. **Pessoas Físicas Cadastradas** (`pessoas_fisicas`)
- Entidades principais e independentes
- Cadastradas em `/pessoas-fisicas`
- Têm cadastro completo com endereços, telefones, e-mails, familiares, etc.

### 2. **Pessoas Ligadas** (`cedentes_pessoas_ligadas` / `sacados_pessoas_ligadas`)
- Relacionamentos de pessoas com cedentes ou sacados
- Podem ser pessoas físicas cadastradas OU apenas dados básicos (CPF + nome)
- Armazenam informações específicas do relacionamento

## 🔗 Como Funciona a Integração

### Ao Cadastrar uma Pessoa Ligada:

1. **Digite CPF ou Nome** no campo CPF
   - O sistema busca automaticamente na tabela `pessoas_fisicas`
   - Mostra sugestões enquanto você digita

2. **Se encontrar uma pessoa física cadastrada:**
   - ✅ Mostra indicador "✓ Cadastrada"
   - ✅ Preenche automaticamente o campo **Nome**
   - ✅ Mostra informações da pessoa (nome da mãe, etc.)
   - ✅ Você pode completar os outros campos (tipo de relacionamento, telefone, etc.)

3. **Se NÃO encontrar:**
   - Você pode cadastrar manualmente
   - Digite o CPF e nome normalmente
   - A pessoa será cadastrada apenas como "pessoa ligada" (não cria registro em `pessoas_fisicas`)

## 🎯 Fluxo de Uso Recomendado

### Opção 1: Pessoa Já Cadastrada
```
1. Vá em "Pessoas Físicas" → Cadastre a pessoa
2. Vá no Cedente/Sacado → "Pessoas Ligadas"
3. Digite o CPF → Sistema encontra automaticamente
4. Nome é preenchido automaticamente
5. Complete os outros campos e salve
```

### Opção 2: Cadastrar Direto como Pessoa Ligada
```
1. Vá no Cedente/Sacado → "Pessoas Ligadas"
2. Digite CPF e nome manualmente
3. Complete os campos e salve
4. (Opcional) Depois pode cadastrar em "Pessoas Físicas" se necessário
```

## 💡 Vantagens da Integração

- ✅ **Evita duplicação**: Se a pessoa já está cadastrada, reutiliza os dados
- ✅ **Preenchimento automático**: Nome é preenchido automaticamente
- ✅ **Busca inteligente**: Busca por CPF ou nome
- ✅ **Sugestões em tempo real**: Mostra pessoas enquanto você digita
- ✅ **Flexibilidade**: Pode cadastrar pessoa ligada sem ter pessoa física cadastrada

## 🔍 Onde Usar

### Em Cedentes:
- Página: `/cedentes/[id]/editar`
- Seção: "Pessoas Ligadas / Familiares"
- Campo CPF agora tem busca integrada

### Em Sacados:
- Página: `/sacados/[cnpj]/editar`
- Seção: "Pessoas Ligadas"
- Campo CPF agora tem busca integrada

## 📝 Notas Importantes

- A busca funciona apenas quando você está **adicionando ou editando** uma pessoa ligada
- Se a pessoa física não estiver cadastrada, você ainda pode cadastrar manualmente
- O CPF é usado como identificador comum entre as duas tabelas
- Não há foreign key direta - a relação é feita pelo CPF

