'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DataManager from '@/components/sacados/DataManager';

type Cedente = {
  id: string;
  nome: string;
  razao_social: string | null;
  cnpj: string | null;
};

export default function EditarCedentePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [cedente, setCedente] = useState<Cedente | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para cada tipo de dado
  const [qsa, setQsa] = useState([]);
  const [enderecos, setEnderecos] = useState([]);
  const [telefones, setTelefones] = useState([]);
  const [emails, setEmails] = useState([]);
  const [pessoasLigadas, setPessoasLigadas] = useState([]);
  const [empresasLigadas, setEmpresasLigadas] = useState([]);

  useEffect(() => {
    loadAllData();
  }, [id]);

  async function loadAllData() {
    setLoading(true);
    
    // Carrega dados do cedente
    const { data: cedenteData } = await supabase
      .from('cedentes')
      .select('id, nome, razao_social, cnpj')
      .eq('id', id)
      .single();
    
    setCedente(cedenteData);

    // Carrega todos os dados complementares
    await Promise.all([
      loadQSA(),
      loadEnderecos(),
      loadTelefones(),
      loadEmails(),
      loadPessoasLigadas(),
      loadEmpresasLigadas()
    ]);
    
    setLoading(false);
  }

  async function loadQSA() {
    const { data } = await supabase
      .from('cedentes_qsa')
      .select('*')
      .eq('cedente_id', id)
      .eq('ativo', true)
      .order('nome');
    setQsa(data || []);
  }

  async function loadEnderecos() {
    const { data } = await supabase
      .from('cedentes_enderecos')
      .select('*')
      .eq('cedente_id', id)
      .eq('ativo', true)
      .order('principal', { ascending: false });
    setEnderecos(data || []);
  }

  async function loadTelefones() {
    const { data } = await supabase
      .from('cedentes_telefones')
      .select('*')
      .eq('cedente_id', id)
      .eq('ativo', true)
      .order('principal', { ascending: false });
    setTelefones(data || []);
  }

  async function loadEmails() {
    const { data } = await supabase
      .from('cedentes_emails')
      .select('*')
      .eq('cedente_id', id)
      .eq('ativo', true)
      .order('principal', { ascending: false });
    setEmails(data || []);
  }

  async function loadPessoasLigadas() {
    const { data } = await supabase
      .from('cedentes_pessoas_ligadas')
      .select('*')
      .eq('cedente_id', id)
      .eq('ativo', true)
      .order('nome');
    setPessoasLigadas(data || []);
  }

  async function loadEmpresasLigadas() {
    const { data } = await supabase
      .from('cedentes_empresas_ligadas')
      .select('*')
      .eq('cedente_id', id)
      .eq('ativo', true)
      .order('razao_social');
    setEmpresasLigadas(data || []);
  }

  async function fetchFromAPI(tipo: string) {
    if (!cedente?.cnpj) {
      alert('Cedente sem CNPJ cadastrado');
      return;
    }

    try {
      const res = await fetch(`/api/bigdata?cnpj=${encodeURIComponent(cedente.cnpj)}&tipo=${tipo}`);
      const response = await res.json();
      
      if (!res.ok) {
        throw new Error(response.error || 'Erro ao buscar dados');
      }

      const dados = response.mock ? response.data : response;
      
      // Salva os dados no banco
      if (Array.isArray(dados) && dados.length > 0) {
        const tableName = getTableNameByType(tipo);
        
        // Remove dados antigos da API para evitar duplicatas
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .eq('cedente_id', id)
          .eq('origem', 'api');

        if (deleteError) {
          console.error('Erro ao limpar dados antigos da API:', deleteError);
        }

        // Insere os novos dados da API
        const dataToInsert = dados.map(item => ({
          ...item,
          cedente_id: id,
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
      'qsa': 'cedentes_qsa',
      'enderecos': 'cedentes_enderecos',
      'telefones': 'cedentes_telefones',
      'emails': 'cedentes_emails',
      'pessoas_ligadas': 'cedentes_pessoas_ligadas',
      'empresas_relacionadas': 'cedentes_empresas_ligadas'
    };
    return mapping[tipo] || '';
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0369a1]"></div>
            <p className="mt-2 text-[#64748b]">Carregando...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!cedente) {
    return (
      <main className="min-h-screen p-6 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center py-8">
            <p className="text-[#64748b]">Cedente não encontrado</p>
            <Button variant="primary" onClick={() => router.back()} className="mt-4">
              Voltar
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 bg-white">
      <div className="container max-w-6xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#0369a1]">
              {cedente.nome}
            </h1>
            {cedente.razao_social && <p className="text-[#64748b]">{cedente.razao_social}</p>}
            {cedente.cnpj && <p className="text-sm text-[#64748b] font-mono">{cedente.cnpj}</p>}
          </div>
          <Button variant="secondary" onClick={() => router.back()}>
            Voltar
          </Button>
        </header>

        {/* QSA */}
        <Card>
          <DataManager
            title="QSA - Quadro de Sócios e Administradores"
            cnpj={id}
            tableName="cedentes_qsa"
            items={qsa}
            onRefresh={loadQSA}
            onFetchFromAPI={cedente.cnpj ? () => fetchFromAPI('qsa') : undefined}
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
            cnpj={id}
            tableName="cedentes_enderecos"
            items={enderecos}
            onRefresh={loadEnderecos}
            onFetchFromAPI={cedente.cnpj ? () => fetchFromAPI('enderecos') : undefined}
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
            cnpj={id}
            tableName="cedentes_telefones"
            items={telefones}
            onRefresh={loadTelefones}
            onFetchFromAPI={cedente.cnpj ? () => fetchFromAPI('telefones') : undefined}
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
            cnpj={id}
            tableName="cedentes_emails"
            items={emails}
            onRefresh={loadEmails}
            onFetchFromAPI={cedente.cnpj ? () => fetchFromAPI('emails') : undefined}
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
            cnpj={id}
            tableName="cedentes_pessoas_ligadas"
            items={pessoasLigadas}
            onRefresh={loadPessoasLigadas}
            onFetchFromAPI={cedente.cnpj ? () => fetchFromAPI('pessoas_ligadas') : undefined}
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
            cnpj={id}
            tableName="cedentes_empresas_ligadas"
            items={empresasLigadas}
            onRefresh={loadEmpresasLigadas}
            onFetchFromAPI={cedente.cnpj ? () => fetchFromAPI('empresas_relacionadas') : undefined}
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
      </div>
    </main>
  );
}

