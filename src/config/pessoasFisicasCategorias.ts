// Configuração de categorias para o cadastro de pessoas físicas
// Similar à estrutura de cedentes, adaptada para pessoas físicas

import { CategoriaConfig } from './cedentesCategorias';

export const categoriasPessoasFisicas: CategoriaConfig[] = [
  {
    id: 'enderecos',
    title: 'Endereços',
    tableName: 'pessoas_fisicas_enderecos',
    apiType: 'enderecos',
    group: 'contatos',
    fields: [
      { key: 'endereco', label: 'Endereço', type: 'text', required: true, width: 'full', tooltip: 'Endereço completo: rua, número, complemento' },
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['residencial', 'comercial', 'correspondencia'], tooltip: 'Tipo de endereço' },
      { key: 'cep', label: 'CEP', type: 'text', tooltip: 'CEP no formato 00000-000' },
      { key: 'cidade', label: 'Cidade', type: 'text', tooltip: 'Nome da cidade' },
      { key: 'estado', label: 'UF', type: 'text', tooltip: 'Estado (sigla de 2 letras)' }
    ],
    displayFields: ['endereco', 'tipo', 'cidade']
  },
  {
    id: 'telefones',
    title: 'Telefones',
    tableName: 'pessoas_fisicas_telefones',
    apiType: 'telefones',
    group: 'contatos',
    fields: [
      { key: 'telefone', label: 'Telefone', type: 'tel', required: true, tooltip: 'Número de telefone com DDD' },
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['celular', 'fixo', 'comercial'], tooltip: 'Tipo de telefone' },
      { key: 'nome_contato', label: 'Contato', type: 'text', tooltip: 'Nome da pessoa responsável por este telefone' }
    ],
    displayFields: ['telefone', 'tipo', 'nome_contato']
  },
  {
    id: 'emails',
    title: 'E-mails',
    tableName: 'pessoas_fisicas_emails',
    apiType: 'emails',
    group: 'contatos',
    fields: [
      { key: 'email', label: 'E-mail', type: 'email', required: true, width: 'half', tooltip: 'Endereço de e-mail válido' },
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['pessoal', 'comercial'], tooltip: 'Tipo de e-mail' },
      { key: 'nome_contato', label: 'Contato', type: 'text', tooltip: 'Nome da pessoa responsável por este e-mail' }
    ],
    displayFields: ['email', 'tipo', 'nome_contato']
  },
  {
    id: 'familiares',
    title: 'Familiares / Relacionamentos',
    tableName: 'pessoas_fisicas_familiares',
    group: 'relacionamentos',
    fields: [
      { key: 'familiar_cpf', label: 'CPF', type: 'text', placeholder: '000.000.000-00', tooltip: 'CPF do familiar' },
      { key: 'familiar_nome', label: 'Nome', type: 'text', required: true, placeholder: 'Nome completo', width: 'half', tooltip: 'Nome completo do familiar' },
      { key: 'tipo_relacionamento', label: 'Relacionamento', type: 'select', 
        options: ['pai', 'mae', 'conjuge', 'filho', 'filha', 'irmao', 'irma', 'avô', 'avó', 'neto', 'neta', 'tio', 'tia', 'primo', 'prima', 'sobrinho', 'sobrinha', 'cunhado', 'cunhada', 'sogro', 'sogra', 'genro', 'nora', 'outro'],
        tooltip: 'Tipo de relacionamento familiar' },
      { key: 'observacoes', label: 'Observações', type: 'textarea', placeholder: 'Informações adicionais...', width: 'full', tooltip: 'Informações adicionais sobre este familiar' }
    ],
    displayFields: ['familiar_nome', 'familiar_cpf', 'tipo_relacionamento']
  },
  {
    id: 'empresas',
    title: 'Empresas Ligadas',
    tableName: 'pessoas_fisicas_empresas',
    group: 'relacionamentos',
    fields: [
      { key: 'empresa_cnpj', label: 'CNPJ', type: 'text', required: true, tooltip: 'CNPJ da empresa' },
      { key: 'empresa_razao_social', label: 'Razão Social', type: 'text', required: true, width: 'half', tooltip: 'Razão social da empresa' },
      { key: 'tipo_relacionamento', label: 'Tipo', type: 'select', 
        options: ['socio', 'administrador', 'funcionario', 'proprietario', 'outro'],
        tooltip: 'Tipo de relacionamento com a empresa' },
      { key: 'participacao', label: 'Part.%', type: 'number', tooltip: 'Percentual de participação (0-100)' },
      { key: 'cargo', label: 'Cargo', type: 'text', tooltip: 'Cargo/função na empresa' },
      { key: 'data_inicio', label: 'Data Início', type: 'date', tooltip: 'Data de início do relacionamento' },
      { key: 'data_fim', label: 'Data Fim', type: 'date', tooltip: 'Data de fim do relacionamento (se aplicável)' },
      { key: 'observacoes', label: 'Observações', type: 'textarea', width: 'full', tooltip: 'Informações adicionais sobre o relacionamento' }
    ],
    displayFields: ['empresa_razao_social', 'empresa_cnpj', 'tipo_relacionamento', 'cargo']
  }
];

