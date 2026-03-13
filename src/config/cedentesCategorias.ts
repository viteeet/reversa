// Configuração de categorias para o cadastro de cedentes
// Para adicionar uma nova categoria, adicione uma entrada aqui e crie a tabela correspondente no banco

export type CategoriaConfig = {
  id: string; // ID único da categoria (usado como sufixo da tabela)
  title: string; // Título exibido na interface
  tableName: string; // Nome da tabela no banco (ex: cedentes_categoria_exemplo)
  apiType?: string; // Tipo para buscar da API (se aplicável)
  fields: {
    key: string;
    label: string;
    type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea';
    options?: string[];
    required?: boolean;
    placeholder?: string;
    width?: 'full' | 'half' | 'third';
    tooltip?: string; // Texto de ajuda para o campo
  }[];
  displayFields: string[]; // Campos exibidos na lista
  showDetailsButton?: boolean; // Se deve mostrar botão de detalhes
  group?: string; // Grupo para agrupamento visual (ex: 'contatos', 'relacionamentos')
};

export const categoriasCedentes: CategoriaConfig[] = [
  {
    id: 'enderecos',
    title: 'Endereços',
    tableName: 'cedentes_enderecos',
    apiType: 'enderecos',
    group: 'contatos',
    fields: [
      { key: 'endereco', label: 'Endereço', type: 'text', required: true, width: 'full', tooltip: 'Endereço completo: rua, número, complemento' },
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['comercial', 'residencial', 'correspondencia'], tooltip: 'Tipo de endereço' },
      { key: 'cep', label: 'CEP', type: 'text', tooltip: 'CEP no formato 00000-000' },
      { key: 'cidade', label: 'Cidade', type: 'text', tooltip: 'Nome da cidade' },
      { key: 'estado', label: 'UF', type: 'text', tooltip: 'Estado (sigla de 2 letras)' }
    ],
    displayFields: ['endereco', 'tipo', 'cidade']
  },
  {
    id: 'telefones',
    title: 'Telefones',
    tableName: 'cedentes_telefones',
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
    tableName: 'cedentes_emails',
    apiType: 'emails',
    group: 'contatos',
    fields: [
      { key: 'email', label: 'E-mail', type: 'email', required: true, width: 'half', tooltip: 'Endereço de e-mail válido' },
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['comercial', 'pessoal', 'financeiro'], tooltip: 'Tipo de e-mail' },
      { key: 'nome_contato', label: 'Contato', type: 'text', tooltip: 'Nome da pessoa responsável por este e-mail' }
    ],
    displayFields: ['email', 'tipo', 'nome_contato']
  },
  {
    id: 'pessoas_ligadas',
    title: 'Pessoas Ligadas / Familiares',
    tableName: 'cedentes_pessoas_ligadas',
    apiType: 'pessoas_ligadas',
    group: 'relacionamentos',
    fields: [
      { key: 'cpf', label: 'CPF', type: 'text', placeholder: '000.000.000-00', tooltip: 'CPF no formato 000.000.000-00' },
      { key: 'nome', label: 'Nome', type: 'text', required: true, placeholder: 'Nome completo', width: 'half', tooltip: 'Nome completo da pessoa' },
      { key: 'tipo_relacionamento', label: 'Categoria', type: 'select', 
        options: ['funcionario', 'pai', 'mae', 'conjuge', 'filho', 'filha', 'irmao', 'irma', 'avô', 'avó', 'neto', 'neta', 'socio', 'socio_oculto', 'administrador', 'parente', 'outro'],
        tooltip: 'Categoria da pessoa (funcionário, parente, cônjuge, etc.)' },
      { key: 'telefone', label: 'Telefone', type: 'tel', placeholder: '(00) 00000-0000', tooltip: 'Telefone de contato desta pessoa' },
      { key: 'email', label: 'E-mail', type: 'email', placeholder: 'email@exemplo.com', tooltip: 'E-mail de contato desta pessoa' },
      { key: 'endereco', label: 'Endereço', type: 'text', placeholder: 'Rua, número, bairro', width: 'half', tooltip: 'Endereço completo desta pessoa' },
      { key: 'cidade', label: 'Cidade', type: 'text', tooltip: 'Cidade do endereço' },
      { key: 'estado', label: 'UF', type: 'text', placeholder: 'SP', tooltip: 'Estado (sigla de 2 letras)' },
      { key: 'observacoes', label: 'Observações', type: 'textarea', placeholder: 'Informações adicionais...', width: 'full', tooltip: 'Informações adicionais sobre esta pessoa' }
    ],
    displayFields: ['nome', 'cpf', 'tipo_relacionamento', 'telefone']
  },
  {
    id: 'empresas_ligadas',
    title: 'Empresas Ligadas',
    tableName: 'cedentes_empresas_ligadas',
    apiType: 'empresas_relacionadas',
    group: 'relacionamentos',
    fields: [
      { key: 'cnpj_relacionado', label: 'CNPJ', type: 'text', required: true, tooltip: 'CNPJ da empresa relacionada' },
      { key: 'razao_social', label: 'Razão Social', type: 'text', required: true, width: 'half', tooltip: 'Razão social da empresa' },
      { key: 'tipo_relacionamento', label: 'Tipo', type: 'select', 
        options: ['grupo', 'filial', 'matriz', 'sociedade'],
        tooltip: 'Tipo de relacionamento com o cedente' },
      { key: 'participacao', label: 'Part.%', type: 'number', tooltip: 'Percentual de participação (0-100)' },
      { key: 'observacoes', label: 'Obs', type: 'text', width: 'half', tooltip: 'Observações sobre o relacionamento' }
    ],
    displayFields: ['razao_social', 'cnpj_relacionado', 'tipo_relacionamento']
  },
  {
    id: 'qsa',
    title: 'QSA - Quadro de Sócios e Administradores',
    tableName: 'cedentes_qsa',
    apiType: 'qsa',
    group: 'relacionamentos',
    fields: [
      { key: 'cpf', label: 'CPF', type: 'text', placeholder: '000.000.000-00', tooltip: 'CPF no formato 000.000.000-00' },
      { key: 'nome', label: 'Nome', type: 'text', required: true, placeholder: 'Nome completo', width: 'half', tooltip: 'Nome completo do sócio ou administrador' },
      { key: 'qualificacao', label: 'Qualificação', type: 'text', placeholder: 'Administrador, Sócio', tooltip: 'Cargo ou qualificação (ex: Sócio, Administrador)' },
      { key: 'participacao', label: 'Part.%', type: 'number', placeholder: '0-100', tooltip: 'Percentual de participação societária (0-100)' },
      { key: 'data_entrada', label: 'Data Entrada', type: 'date', tooltip: 'Data de entrada na sociedade' },
      { key: 'observacoes', label: 'OBS (Detalhes, endereços, telefones, processos, etc.)', type: 'textarea', placeholder: 'Informações completas desta pessoa...', width: 'full', tooltip: 'Informações adicionais: endereços, telefones, processos judiciais, etc.' }
    ],
    displayFields: ['nome', 'cpf', 'qualificacao', 'participacao'],
    showDetailsButton: true
  }
  // Para adicionar uma nova categoria, adicione um objeto aqui seguindo o mesmo padrão
  // Exemplo:
  // {
  //   id: 'contatos_importantes',
  //   title: 'Contatos Importantes',
  //   tableName: 'cedentes_contatos_importantes',
  //   fields: [
  //     { key: 'nome', label: 'Nome', type: 'text', required: true },
  //     { key: 'cargo', label: 'Cargo', type: 'text' },
  //     { key: 'telefone', label: 'Telefone', type: 'tel' },
  //     { key: 'observacoes', label: 'Observações', type: 'textarea', width: 'full' }
  //   ],
  //   displayFields: ['nome', 'cargo', 'telefone']
  // }
];

