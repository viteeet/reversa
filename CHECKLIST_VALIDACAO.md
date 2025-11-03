# ✅ Checklist de Instalação e Validação

## 📋 Pré-requisitos

- [ ] Acesso ao Supabase Dashboard
- [ ] Projeto Next.js rodando
- [ ] Usuário autenticado no sistema

## 🗄️ Banco de Dados

### Criação da Tabela
- [ ] Acessou SQL Editor no Supabase
- [ ] Copiou conteúdo do arquivo `database_schema_dados_encontrados.sql`
- [ ] Executou o script completo (sucesso sem erros)
- [ ] Verificou criação: `SELECT COUNT(*) FROM sacados_dados_encontrados;`

### Políticas RLS
- [ ] RLS está habilitado (`ENABLE ROW LEVEL SECURITY`)
- [ ] Policy SELECT criada
- [ ] Policy INSERT criada
- [ ] Policy UPDATE criada
- [ ] Policy DELETE criada

### Índices
- [ ] Índice por CNPJ criado
- [ ] Índice por tipo criado

## 📁 Arquivos do Projeto

### Arquivos Criados
- [ ] `database_schema_dados_encontrados.sql` existe
- [ ] `src/components/sacados/FoundDataManager.tsx` existe
- [ ] `DADOS_ENCONTRADOS.md` existe
- [ ] `SETUP_DADOS_ENCONTRADOS.md` existe
- [ ] `RESUMO_DADOS_ENCONTRADOS.md` existe
- [ ] `GUIA_VISUAL_ANTES_DEPOIS.md` existe

### Arquivos Modificados
- [ ] `src/app/sacados/[cnpj]/page.tsx` atualizado
- [ ] `src/app/sacados/[cnpj]/cobranca/page.tsx` atualizado

## 🔍 Verificação de Código

### Imports e Tipos
- [ ] `FoundDataManager` importado em `page.tsx`
- [ ] Tipo `FoundDataItem` definido
- [ ] Estado `foundData` criado
- [ ] Função `loadFoundData()` implementada

### Componentes
- [ ] `FoundDataManager.tsx` sem erros de TypeScript
- [ ] `page.tsx` sem erros de TypeScript
- [ ] `cobranca/page.tsx` sem erros de TypeScript

## 🚀 Testes Funcionais

### Teste 1: Visualização
- [ ] Acessou `/sacados/[CNPJ_QUALQUER]`
- [ ] Aba "📋 Informações" aparece
- [ ] Seção "🏛️ Dados da Receita Federal" visível
- [ ] Seção "📝 Dados Encontrados" visível
- [ ] Botão "+ Adicionar Informação" presente

### Teste 2: Adicionar Dado
- [ ] Clicou em "+ Adicionar Informação"
- [ ] Modal abriu corretamente
- [ ] Formulário possui todos os campos:
  - [ ] Tipo de Informação (select com 7 opções)
  - [ ] Título (text input)
  - [ ] Conteúdo (textarea)
  - [ ] Fonte (select com 8 opções)
  - [ ] Observações (textarea)
  - [ ] Data Encontrado (date input)
- [ ] Preencheu formulário de teste:
  - Tipo: "Telefone"
  - Título: "Teste Sistema"
  - Conteúdo: "(11) 99999-9999"
  - Fonte: "Outros"
- [ ] Clicou em "Salvar"
- [ ] Modal fechou automaticamente
- [ ] Dado apareceu na seção "📞 Telefone"

### Teste 3: Visualizar Dado
- [ ] Card do dado exibe título
- [ ] Card do dado exibe conteúdo
- [ ] Badge de fonte aparece (se preenchido)
- [ ] Data de descoberta aparece (se preenchido)
- [ ] Observações aparecem (se preenchidas)
- [ ] Botões "Editar" e "Excluir" presentes

### Teste 4: Editar Dado
- [ ] Clicou em "Editar"
- [ ] Modal abriu com dados preenchidos
- [ ] Alterou o conteúdo
- [ ] Clicou em "Salvar"
- [ ] Alteração apareceu na lista

### Teste 5: Excluir Dado
- [ ] Clicou em "Excluir"
- [ ] Confirmação apareceu
- [ ] Confirmou exclusão
- [ ] Dado sumiu da lista

### Teste 6: Múltiplos Dados
- [ ] Adicionou telefone
- [ ] Adicionou email
- [ ] Adicionou endereço
- [ ] Todos aparecem agrupados por tipo
- [ ] Cada tipo tem seu ícone correto
- [ ] Contadores de quantidade corretos

### Teste 7: Relatório de Cobrança
- [ ] Acessou `/sacados/[CNPJ]/cobranca`
- [ ] Rolou até o final da página
- [ ] Seção "Dados Encontrados (Pesquisa Manual)" aparece
- [ ] Dados agrupados por tipo
- [ ] Todas as informações visíveis
- [ ] Layout adequado para impressão

### Teste 8: Impressão
- [ ] Clicou em "Imprimir Relatório" (ou Ctrl+P)
- [ ] Dados Encontrados aparecem na preview
- [ ] Formatação está correta
- [ ] Não há quebras indesejadas

## 🎨 Validação Visual

### Layout Compacto
- [ ] Cards da Receita são compactos
- [ ] Grid de 4 colunas em desktop
- [ ] Grid de 2 colunas em tablet
- [ ] Grid de 1 coluna em mobile
- [ ] Background azul claro na seção Receita
- [ ] Cards brancos sobre fundo colorido

### Ícones e Badges
- [ ] 🏛️ aparece em "Dados da Receita"
- [ ] 📝 aparece em "Dados Encontrados"
- [ ] Cada tipo tem seu emoji correto
- [ ] Badges azuis para fontes
- [ ] Badges de quantidade nos títulos

### Responsividade
- [ ] Testado em tela grande (>1024px)
- [ ] Testado em tablet (768px-1024px)
- [ ] Testado em mobile (<768px)
- [ ] Nenhum overflow horizontal
- [ ] Textos legíveis em todos os tamanhos

## 🔒 Segurança

### Autenticação
- [ ] Usuário não autenticado não acessa
- [ ] Redirecionamento para /login funciona

### Permissões
- [ ] Usuário só vê dados do próprio workspace
- [ ] Não consegue acessar dados de outros usuários

### Validação
- [ ] Campos obrigatórios não permitem salvar em branco
- [ ] CNPJ é validado antes de salvar

## 📊 Performance

### Carregamento
- [ ] Página carrega em <2 segundos
- [ ] Dados aparecem progressivamente
- [ ] Sem travamentos ao adicionar dados
- [ ] Modal abre instantaneamente

### Queries
- [ ] Dados são carregados apenas uma vez
- [ ] Refresh funciona corretamente
- [ ] Sem queries duplicadas no console

## 📝 Documentação

### Arquivos de Docs
- [ ] `DADOS_ENCONTRADOS.md` está completo
- [ ] `SETUP_DADOS_ENCONTRADOS.md` está atualizado
- [ ] `RESUMO_DADOS_ENCONTRADOS.md` tem todas as seções
- [ ] `GUIA_VISUAL_ANTES_DEPOIS.md` tem os exemplos

### Comentários no Código
- [ ] Funções principais comentadas
- [ ] Tipos TypeScript documentados
- [ ] Lógica complexa explicada

## 🐛 Troubleshooting

### Problemas Comuns Testados
- [ ] Erro de permissão → Verificar RLS
- [ ] Tabela não existe → Recriar schema
- [ ] Modal não abre → Verificar imports
- [ ] Dados não aparecem → Verificar query
- [ ] Formulário não salva → Verificar validação

## ✨ Features Extras Validadas

### UX
- [ ] Loading states durante salvamento
- [ ] Mensagens de confirmação
- [ ] Animações suaves
- [ ] Feedback visual em ações

### Acessibilidade
- [ ] Labels em todos os inputs
- [ ] Campos obrigatórios marcados
- [ ] Cores com bom contraste
- [ ] Navegação por teclado funciona

## 🎯 Critérios de Aceitação

### Funcionalidade
- ✅ Usuário consegue adicionar dados encontrados
- ✅ Dados aparecem organizados por tipo
- ✅ Possível editar e excluir dados
- ✅ Dados aparecem no relatório de cobrança
- ✅ Layout é compacto e profissional

### Qualidade
- ✅ Zero erros no console
- ✅ Zero erros de TypeScript
- ✅ Código segue padrões do projeto
- ✅ Documentação completa

### Performance
- ✅ Carregamento rápido (<2s)
- ✅ Interações fluidas
- ✅ Sem memory leaks

## 📅 Data de Validação

- **Data**: ___/___/______
- **Validado por**: _________________
- **Status**: [ ] Aprovado  [ ] Pendente  [ ] Reprovado
- **Notas**: _________________________________________

---

## 🎉 Resultado Final

Se todos os itens estão marcados: **✅ SISTEMA PRONTO PARA USO!**

Se algum item falhou: Consulte a documentação ou verifique o troubleshooting.

---

**Última atualização**: Novembro 2025  
**Versão do checklist**: 1.0
