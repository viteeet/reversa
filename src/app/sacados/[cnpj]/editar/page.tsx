'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DataManager from '@/components/sacados/DataManager';

type Sacado = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
};

export default function EditarSacadoPage() {
  const router = useRouter();
  const params = useParams();
  const cnpj = decodeURIComponent(params.cnpj as string);
  
  const [sacado, setSacado] = useState<Sacado | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para cada tipo de dado
  const [qsa, setQsa] = useState([]);
  const [enderecos, setEnderecos] = useState([]);
  const [telefones, setTelefones] = useState([]);
  const [emails, setEmails] = useState([]);
  const [pessoasLigadas, setPessoasLigadas] = useState([]);
  const [empresasLigadas, setEmpresasLigadas] = useState([]);
  const [processos, setProcessos] = useState([]);

  useEffect(() => {
    loadAllData();
  }, [cnpj]);

  async function loadAllData() {
    setLoading(true);
    
    // Carrega dados do sacado
    const { data: sacadoData } = await supabase
      .from('sacados')
      .select('cnpj, razao_social, nome_fantasia')
      .eq('cnpj', cnpj)
      .single();
    
    setSacado(sacadoData);

    // Carrega todos os dados complementares
    await Promise.all([
      loadQSA(),
      loadEnderecos(),
      loadTelefones(),
      loadEmails(),
      loadPessoasLigadas(),
      loadEmpresasLigadas(),
      loadProcessos()
    ]);
    
    setLoading(false);
  }

  async function loadQSA() {
    const { data } = await supabase
      .from('sacados_qsa')
      .select('*')
      .eq('sacado_cnpj', cnpj)
      .eq('ativo', true)
      .order('nome');
    setQsa(data || []);
  }

  async function loadEnderecos() {
    const { data } = await supabase
      .from('sacados_enderecos')
      .select('*')
      .eq('sacado_cnpj', cnpj)
      .eq('ativo', true)
      .order('principal', { ascending: false });
    setEnderecos(data || []);
  }

  async function loadTelefones() {
    const { data } = await supabase
      .from('sacados_telefones')
      .select('*')
      .eq('sacado_cnpj', cnpj)
      .eq('ativo', true)
      .order('principal', { ascending: false });
    setTelefones(data || []);
  }

  async function loadEmails() {
    const { data } = await supabase
      .from('sacados_emails')
      .select('*')
      .eq('sacado_cnpj', cnpj)
      .eq('ativo', true)
      .order('principal', { ascending: false });
    setEmails(data || []);
  }

  async function loadPessoasLigadas() {
    const { data } = await supabase
      .from('sacados_pessoas_ligadas')
      .select('*')
      .eq('sacado_cnpj', cnpj)
      .eq('ativo', true)
      .order('nome');
    setPessoasLigadas(data || []);
  }

  async function loadEmpresasLigadas() {
    const { data } = await supabase
      .from('sacados_empresas_ligadas')
      .select('*')
      .eq('sacado_cnpj', cnpj)
      .eq('ativo', true)
      .order('razao_social');
    setEmpresasLigadas(data || []);
  }

  async function loadProcessos() {
    const { data } = await supabase
      .from('sacados_processos')
      .select('*')
      .eq('sacado_cnpj', cnpj)
      .eq('ativo', true)
      .order('data_distribuicao', { ascending: false });
    setProcessos(data || []);
  }

  async function fetchFromAPI(tipo: string) {
    try {
      const res = await fetch(`/api/bigdata?cnpj=${encodeURIComponent(cnpj)}&tipo=${tipo}`);
      const response = await res.json();
      
      if (!res.ok) {
        throw new Error(response.error || 'Erro ao buscar dados');
      }

      const dados = response.mock ? response.data : response;
      
      // Salva os dados no banco
      if (Array.isArray(dados) && dados.length > 0) {
        const tableName = getTableNameByType(tipo);
        
        // PASSO 1: Remove dados antigos da API para evitar duplicatas
        // (mantém dados adicionados manualmente - origem='manual')
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .eq('sacado_cnpj', cnpj)
          .eq('origem', 'api');

        if (deleteError) {
          console.error('Erro ao limpar dados antigos da API:', deleteError);
        }

        // PASSO 2: Insere os novos dados da API
        const dataToInsert = dados.map(item => ({
          ...item,
          sacado_cnpj: cnpj,
          origem: 'api',
          ativo: true
        }));

        const { error } = await supabase
          .from(tableName)
          .insert(dataToInsert);

        if (error) {
          console.error('Erro ao salvar dados da API:', error);
          alert('Alguns dados não puderam ser salvos');
        }
      }
    } catch (error) {
      console.error('Erro ao buscar da API:', error);
      throw error;
    }
  }

  function getTableNameByType(tipo: string): string {
    const mapping: Record<string, string> = {
      'qsa': 'sacados_qsa',
      'enderecos': 'sacados_enderecos',
      'telefones': 'sacados_telefones',
      'emails': 'sacados_emails',
      'pessoas_ligadas': 'sacados_pessoas_ligadas',
      'empresas_relacionadas': 'sacados_empresas_ligadas',
      'processos': 'sacados_processos'
    };
    return mapping[tipo] || '';
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="container max-w-6xl">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-slate-600">Carregando...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!sacado) {
    return (
      <main className="min-h-screen p-6">
        <div className="container max-w-6xl">
          <div className="text-center py-8">
            <p className="text-slate-600">Sacado não encontrado</p>
            <Button variant="primary" onClick={() => router.back()} className="mt-4">
              Voltar
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="container max-w-6xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {sacado.razao_social}
            </h1>
            <p className="text-slate-600">{sacado.nome_fantasia}</p>
            <p className="text-sm text-slate-500 font-mono">{sacado.cnpj}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.push(`/sacados/${encodeURIComponent(cnpj)}/cobranca`)}>
              Ver Ficha
            </Button>
            <Button variant="secondary" onClick={() => router.back()}>
              Voltar
            </Button>
          </div>
        </header>

        {/* QSA */}
        <Card>
          <DataManager
            title="QSA - Quadro de Sócios e Administradores"
            cnpj={cnpj}
            tableName="sacados_qsa"
            items={qsa}
            onRefresh={loadQSA}
            onFetchFromAPI={() => fetchFromAPI('qsa')}
            fields={[
              { key: 'cpf', label: 'CPF', type: 'text' },
              { key: 'nome', label: 'Nome', type: 'text', required: true },
              { key: 'qualificacao', label: 'Qualificação', type: 'text' },
              { key: 'participacao', label: 'Participação (%)', type: 'number' },
              { key: 'data_entrada', label: 'Data de Entrada', type: 'date' }
            ]}
            displayFields={['nome', 'cpf', 'qualificacao', 'participacao']}
          />
        </Card>

        {/* Endereços */}
        <Card>
          <DataManager
            title="Endereços Encontrados"
            cnpj={cnpj}
            tableName="sacados_enderecos"
            items={enderecos}
            onRefresh={loadEnderecos}
            onFetchFromAPI={() => fetchFromAPI('enderecos')}
            fields={[
              { key: 'endereco', label: 'Endereço', type: 'text', required: true },
              { key: 'tipo', label: 'Tipo', type: 'select', options: ['comercial', 'residencial', 'correspondencia'] },
              { key: 'cep', label: 'CEP', type: 'text' },
              { key: 'cidade', label: 'Cidade', type: 'text' },
              { key: 'estado', label: 'Estado', type: 'text' }
            ]}
            displayFields={['endereco', 'tipo', 'cidade', 'estado']}
          />
        </Card>

        {/* Telefones */}
        <Card>
          <DataManager
            title="Telefones Encontrados"
            cnpj={cnpj}
            tableName="sacados_telefones"
            items={telefones}
            onRefresh={loadTelefones}
            onFetchFromAPI={() => fetchFromAPI('telefones')}
            fields={[
              { key: 'telefone', label: 'Telefone', type: 'tel', required: true },
              { key: 'tipo', label: 'Tipo', type: 'select', options: ['celular', 'fixo', 'comercial'] },
              { key: 'nome_contato', label: 'Nome do Contato', type: 'text' }
            ]}
            displayFields={['telefone', 'tipo', 'nome_contato']}
          />
        </Card>

        {/* E-mails */}
        <Card>
          <DataManager
            title="E-mails Encontrados"
            cnpj={cnpj}
            tableName="sacados_emails"
            items={emails}
            onRefresh={loadEmails}
            onFetchFromAPI={() => fetchFromAPI('emails')}
            fields={[
              { key: 'email', label: 'E-mail', type: 'email', required: true },
              { key: 'tipo', label: 'Tipo', type: 'select', options: ['comercial', 'pessoal', 'financeiro'] },
              { key: 'nome_contato', label: 'Nome do Contato', type: 'text' }
            ]}
            displayFields={['email', 'tipo', 'nome_contato']}
          />
        </Card>

        {/* Pessoas Ligadas */}
        <Card>
          <DataManager
            title="Pessoas Ligadas"
            cnpj={cnpj}
            tableName="sacados_pessoas_ligadas"
            items={pessoasLigadas}
            onRefresh={loadPessoasLigadas}
            onFetchFromAPI={() => fetchFromAPI('pessoas_ligadas')}
            fields={[
              { key: 'cpf', label: 'CPF', type: 'text' },
              { key: 'nome', label: 'Nome', type: 'text', required: true },
              { key: 'tipo_relacionamento', label: 'Tipo de Relacionamento', type: 'select', 
                options: ['pai', 'mae', 'conjuge', 'filho', 'irmao', 'socio', 'administrador', 'outro'] },
              { key: 'observacoes', label: 'Observações', type: 'text' }
            ]}
            displayFields={['nome', 'cpf', 'tipo_relacionamento']}
          />
        </Card>

        {/* Empresas Ligadas */}
        <Card>
          <DataManager
            title="Empresas Ligadas"
            cnpj={cnpj}
            tableName="sacados_empresas_ligadas"
            items={empresasLigadas}
            onRefresh={loadEmpresasLigadas}
            onFetchFromAPI={() => fetchFromAPI('empresas_relacionadas')}
            fields={[
              { key: 'cnpj_relacionado', label: 'CNPJ', type: 'text', required: true },
              { key: 'razao_social', label: 'Razão Social', type: 'text', required: true },
              { key: 'tipo_relacionamento', label: 'Tipo de Relacionamento', type: 'select', 
                options: ['grupo', 'filial', 'matriz', 'sociedade'] },
              { key: 'participacao', label: 'Participação (%)', type: 'number' },
              { key: 'observacoes', label: 'Observações', type: 'text' }
            ]}
            displayFields={['razao_social', 'cnpj_relacionado', 'tipo_relacionamento', 'participacao']}
          />
        </Card>

        {/* Processos */}
        <Card>
          <DataManager
            title="Processos Judiciais"
            cnpj={cnpj}
            tableName="sacados_processos"
            items={processos}
            onRefresh={loadProcessos}
            onFetchFromAPI={() => fetchFromAPI('processos')}
            fields={[
              { key: 'numero_processo', label: 'Número do Processo', type: 'text', required: true },
              { key: 'tipo', label: 'Tipo', type: 'select', 
                options: ['civel', 'trabalhista', 'tributario', 'criminal', 'outro'] },
              { key: 'tribunal', label: 'Tribunal', type: 'text' },
              { key: 'vara', label: 'Vara', type: 'text' },
              { key: 'data_distribuicao', label: 'Data de Distribuição', type: 'date' },
              { key: 'status', label: 'Status', type: 'select', 
                options: ['em_andamento', 'suspenso', 'arquivado', 'julgado'] },
              { key: 'valor', label: 'Valor', type: 'number' },
              { key: 'observacoes', label: 'Observações', type: 'text' }
            ]}
            displayFields={['numero_processo', 'tipo', 'tribunal', 'status', 'valor']}
          />
        </Card>
      </div>
    </main>
  );
}

