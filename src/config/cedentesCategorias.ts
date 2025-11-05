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
  }[];
  displayFields: string[]; // Campos exibidos na lista
  showDetailsButton?: boolean; // Se deve mostrar botão de detalhes
};

export const categoriasCedentes: CategoriaConfig[] = [
  {
    id: 'enderecos',
    title: 'Endereços',
    tableName: 'cedentes_enderecos',
    apiType: 'enderecos',
    fields: [
      { key: 'endereco', label: 'Endereço', type: 'text', required: true, width: 'full' },
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['comercial', 'residencial', 'correspondencia'] },
      { key: 'cep', label: 'CEP', type: 'text' },
      { key: 'cidade', label: 'Cidade', type: 'text' },
      { key: 'estado', label: 'UF', type: 'text' }
    ],
    displayFields: ['endereco', 'tipo', 'cidade']
  },
  {
    id: 'telefones',
    title: 'Telefones',
    tableName: 'cedentes_telefones',
    apiType: 'telefones',
    fields: [
      { key: 'telefone', label: 'Telefone', type: 'tel', required: true },
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['celular', 'fixo', 'comercial'] },
      { key: 'nome_contato', label: 'Contato', type: 'text' }
    ],
    displayFields: ['telefone', 'tipo', 'nome_contato']
  },
  {
    id: 'emails',
    title: 'E-mails',
    tableName: 'cedentes_emails',
    apiType: 'emails',
    fields: [
      { key: 'email', label: 'E-mail', type: 'email', required: true, width: 'half' },
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['comercial', 'pessoal', 'financeiro'] },
      { key: 'nome_contato', label: 'Contato', type: 'text' }
    ],
    displayFields: ['email', 'tipo', 'nome_contato']
  },
  {
    id: 'pessoas_ligadas',
    title: 'Pessoas Ligadas',
    tableName: 'cedentes_pessoas_ligadas',
    apiType: 'pessoas_ligadas',
    fields: [
      { key: 'cpf', label: 'CPF', type: 'text' },
      { key: 'nome', label: 'Nome', type: 'text', required: true, width: 'half' },
      { key: 'tipo_relacionamento', label: 'Relacionamento', type: 'select', 
        options: ['pai', 'mae', 'conjuge', 'filho', 'irmao', 'socio', 'administrador', 'outro'] },
      { key: 'observacoes', label: 'Obs', type: 'text', width: 'half' }
    ],
    displayFields: ['nome', 'cpf', 'tipo_relacionamento']
  },
  {
    id: 'empresas_ligadas',
    title: 'Empresas Ligadas',
    tableName: 'cedentes_empresas_ligadas',
    apiType: 'empresas_relacionadas',
    fields: [
      { key: 'cnpj_relacionado', label: 'CNPJ', type: 'text', required: true },
      { key: 'razao_social', label: 'Razão Social', type: 'text', required: true, width: 'half' },
      { key: 'tipo_relacionamento', label: 'Tipo', type: 'select', 
        options: ['grupo', 'filial', 'matriz', 'sociedade'] },
      { key: 'participacao', label: 'Part.%', type: 'number' },
      { key: 'observacoes', label: 'Obs', type: 'text', width: 'half' }
    ],
    displayFields: ['razao_social', 'cnpj_relacionado', 'tipo_relacionamento']
  },
  {
    id: 'qsa',
    title: 'QSA - Quadro de Sócios e Administradores',
    tableName: 'cedentes_qsa',
    apiType: 'qsa',
    fields: [
      { key: 'cpf', label: 'CPF', type: 'text', placeholder: '000.000.000-00' },
      { key: 'nome', label: 'Nome', type: 'text', required: true, placeholder: 'Nome completo', width: 'half' },
      { key: 'qualificacao', label: 'Qualificação', type: 'text', placeholder: 'Administrador, Sócio' },
      { key: 'participacao', label: 'Part.%', type: 'number', placeholder: '0-100' },
      { key: 'data_entrada', label: 'Data Entrada', type: 'date' },
      { key: 'observacoes', label: 'OBS (Detalhes, endereços, telefones, processos, etc.)', type: 'textarea', placeholder: 'Informações completas desta pessoa...', width: 'full' }
    ],
    displayFields: ['nome', 'cpf', 'qualificacao', 'participacao'],
    showDetailsButton: true
  },
  {
    id: 'familiares',
    title: 'Familiares',
    tableName: 'cedentes_familiares',
    fields: [
      { key: 'cpf', label: 'CPF', type: 'text', placeholder: '000.000.000-00', required: true },
      { key: 'nome', label: 'Nome', type: 'text', required: true, placeholder: 'Nome completo', width: 'half' },
      { key: 'parentesco', label: 'Parentesco', type: 'select', 
        options: ['pai', 'mae', 'conjuge', 'filho', 'filha', 'irmao', 'irma', 'avô', 'avó', 'neto', 'neta', 'outro'] },
      { key: 'telefone', label: 'Telefone', type: 'tel', placeholder: '(00) 00000-0000' },
      { key: 'email', label: 'E-mail', type: 'email', placeholder: 'email@exemplo.com' },
      { key: 'endereco', label: 'Endereço', type: 'text', placeholder: 'Rua, número, bairro', width: 'half' },
      { key: 'cidade', label: 'Cidade', type: 'text' },
      { key: 'estado', label: 'UF', type: 'text', placeholder: 'SP' },
      { key: 'observacoes', label: 'Observações', type: 'textarea', placeholder: 'Informações adicionais...', width: 'full' }
    ],
    displayFields: ['nome', 'cpf', 'parentesco', 'telefone']
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

