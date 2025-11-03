'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CompactDataManager from '@/components/shared/CompactDataManager';

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
  const [processosTexto, setProcessosTexto] = useState(''); // TEXTO SIMPLES
  
  // Observações gerais DA EMPRESA (uma única observação)
  const [observacoesGerais, setObservacoesGerais] = useState('');
  
  // Modal de detalhes de pessoa do QSA
  const [showQsaDetails, setShowQsaDetails] = useState(false);
  const [selectedQsa, setSelectedQsa] = useState<any>(null);
  const [qsaDetalhes, setQsaDetalhes] = useState('');

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
      loadEmpresasLigadas(),
      loadProcessos(),
      loadObservacoes()
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

  async function loadProcessos() {
    // Carrega texto de processos da tabela de observações gerais ou criar campo separado
    const { data } = await supabase
      .from('cedentes_observacoes_gerais')
      .select('processos_texto')
      .eq('cedente_id', id)
      .single();
    
    if (data) setProcessosTexto(data.processos_texto || '');
  }

  async function loadObservacoes() {
    // Carrega observação geral única da empresa
    const { data } = await supabase
      .from('cedentes_observacoes_gerais')
      .select('observacoes')
      .eq('cedente_id', id)
      .single();
    
    if (data) setObservacoesGerais(data.observacoes);
  }

  async function saveObservacaoGeral(observacoes: string) {
    try {
      const { error } = await supabase
        .from('cedentes_observacoes_gerais')
        .upsert({
          cedente_id: id,
          observacoes,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'cedente_id'
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao salvar observação:', error);
    }
  }

  async function saveProcessosTexto(texto: string) {
    try {
      const { error } = await supabase
        .from('cedentes_observacoes_gerais')
        .upsert({
          cedente_id: id,
          processos_texto: texto,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'cedente_id'
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao salvar processos:', error);
    }
  }

  async function saveQsaDetalhes() {
    if (!selectedQsa) return;
    
    try {
      const { error } = await supabase
        .from('cedentes_qsa_detalhes')
        .upsert({
          qsa_id: selectedQsa.id,
          cedente_id: id,
          detalhes_completos: qsaDetalhes,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'qsa_id'
        });
      
      if (error) throw error;
      
      alert('Detalhes salvos com sucesso!');
      setShowQsaDetails(false);
      setSelectedQsa(null);
      setQsaDetalhes('');
    } catch (error) {
      console.error('Erro ao salvar detalhes da pessoa:', error);
      alert('Erro ao salvar detalhes');
    }
  }

  async function openQsaDetails(item: any) {
    setSelectedQsa(item);
    
    // Carrega detalhes existentes
    const { data } = await supabase
      .from('cedentes_qsa_detalhes')
      .select('detalhes_completos')
      .eq('qsa_id', item.id)
      .single();
    
    if (data) {
      setQsaDetalhes(data.detalhes_completos || '');
    } else {
      setQsaDetalhes('');
    }
    
    setShowQsaDetails(true);
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

        {/* Observações Gerais da Empresa - TOPO */}
        <Card>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              💬 Observações Gerais - {cedente.nome}
            </label>
            <textarea
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-y"
              value={observacoesGerais}
              onChange={e => {
                setObservacoesGerais(e.target.value);
                saveObservacaoGeral(e.target.value);
              }}
              placeholder="Digite observações gerais sobre esta empresa: contexto, histórico, alertas, etc..."
            />
            <p className="text-xs text-gray-500">Salva automaticamente ao digitar</p>
          </div>
        </Card>

        {/* Endereços */}
        <Card>
          <CompactDataManager
            title="Endereços"
            entityId={id}
            tableName="cedentes_enderecos"
            items={enderecos}
            onRefresh={loadEnderecos}
            onFetchFromAPI={cedente.cnpj ? () => fetchFromAPI('enderecos') : undefined}
            fields={[
              { key: 'endereco', label: 'Endereço', type: 'text', required: true, width: 'full' },
              { key: 'tipo', label: 'Tipo', type: 'select', options: ['comercial', 'residencial', 'correspondencia'] },
              { key: 'cep', label: 'CEP', type: 'text' },
              { key: 'cidade', label: 'Cidade', type: 'text' },
              { key: 'estado', label: 'UF', type: 'text' }
            ]}
            displayFields={['endereco', 'tipo', 'cidade']}
          />
        </Card>

        {/* Telefones */}
        <Card>
          <CompactDataManager
            title="Telefones"
            entityId={id}
            tableName="cedentes_telefones"
            items={telefones}
            onRefresh={loadTelefones}
            onFetchFromAPI={cedente.cnpj ? () => fetchFromAPI('telefones') : undefined}
            fields={[
              { key: 'telefone', label: 'Telefone', type: 'tel', required: true },
              { key: 'tipo', label: 'Tipo', type: 'select', options: ['celular', 'fixo', 'comercial'] },
              { key: 'nome_contato', label: 'Contato', type: 'text' }
            ]}
            displayFields={['telefone', 'tipo', 'nome_contato']}
          />
        </Card>

        {/* E-mails */}
        <Card>
          <CompactDataManager
            title="E-mails"
            entityId={id}
            tableName="cedentes_emails"
            items={emails}
            onRefresh={loadEmails}
            onFetchFromAPI={cedente.cnpj ? () => fetchFromAPI('emails') : undefined}
            fields={[
              { key: 'email', label: 'E-mail', type: 'email', required: true, width: 'half' },
              { key: 'tipo', label: 'Tipo', type: 'select', options: ['comercial', 'pessoal', 'financeiro'] },
              { key: 'nome_contato', label: 'Contato', type: 'text' }
            ]}
            displayFields={['email', 'tipo', 'nome_contato']}
          />
        </Card>

        {/* Pessoas Ligadas */}
        <Card>
          <CompactDataManager
            title="Pessoas Ligadas"
            entityId={id}
            tableName="cedentes_pessoas_ligadas"
            items={pessoasLigadas}
            onRefresh={loadPessoasLigadas}
            onFetchFromAPI={cedente.cnpj ? () => fetchFromAPI('pessoas_ligadas') : undefined}
            fields={[
              { key: 'cpf', label: 'CPF', type: 'text' },
              { key: 'nome', label: 'Nome', type: 'text', required: true, width: 'half' },
              { key: 'tipo_relacionamento', label: 'Relacionamento', type: 'select', 
                options: ['pai', 'mae', 'conjuge', 'filho', 'irmao', 'socio', 'administrador', 'outro'] },
              { key: 'observacoes', label: 'Obs', type: 'text', width: 'half' }
            ]}
            displayFields={['nome', 'cpf', 'tipo_relacionamento']}
          />
        </Card>

        {/* Empresas Ligadas */}
        <Card>
          <CompactDataManager
            title="Empresas Ligadas"
            entityId={id}
            tableName="cedentes_empresas_ligadas"
            items={empresasLigadas}
            onRefresh={loadEmpresasLigadas}
            onFetchFromAPI={cedente.cnpj ? () => fetchFromAPI('empresas_relacionadas') : undefined}
            fields={[
              { key: 'cnpj_relacionado', label: 'CNPJ', type: 'text', required: true },
              { key: 'razao_social', label: 'Razão Social', type: 'text', required: true, width: 'half' },
              { key: 'tipo_relacionamento', label: 'Tipo', type: 'select', 
                options: ['grupo', 'filial', 'matriz', 'sociedade'] },
              { key: 'participacao', label: 'Part.%', type: 'number' },
              { key: 'observacoes', label: 'Obs', type: 'text', width: 'half' }
            ]}
            displayFields={['razao_social', 'cnpj_relacionado', 'tipo_relacionamento']}
          />
        </Card>

        {/* Processos Judiciais - SIMPLIFICADO */}
        <Card>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              ⚖️ Processos Judiciais e Informações Relevantes
            </label>
            <textarea
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[300px] resize-y font-mono"
              value={processosTexto}
              onChange={e => {
                setProcessosTexto(e.target.value);
                saveProcessosTexto(e.target.value);
              }}
              placeholder="Cole aqui todos os processos e informações relevantes encontradas...&#10;&#10;Exemplo:&#10;PROCESSOS: 13&#10;&#10;Processo 1: ...&#10;Processo 2: ...&#10;&#10;INFORMAÇÕES:&#10;- Detalhes importantes&#10;- Endereços relacionados&#10;- Contatos úteis"
            />
            <p className="text-xs text-gray-500">Salva automaticamente ao digitar</p>
          </div>
        </Card>

        {/* QSA com Botão de Detalhes */}
        <Card>
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">
                QSA - Quadro de Sócios e Administradores
              </h3>
              <div className="flex gap-2">
                {cedente.cnpj && (
                  <button
                    onClick={() => fetchFromAPI('qsa')}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
                  >
                    🔄 API
                  </button>
                )}
              </div>
            </div>

            <CompactDataManager
              title=""
              entityId={id}
              tableName="cedentes_qsa"
              items={qsa}
              onRefresh={loadQSA}
              fields={[
                { key: 'cpf', label: 'CPF', type: 'text', placeholder: '000.000.000-00' },
                { key: 'nome', label: 'Nome', type: 'text', required: true, placeholder: 'Nome completo', width: 'half' },
                { key: 'qualificacao', label: 'Qualificação', type: 'text', placeholder: 'Administrador, Sócio' },
                { key: 'participacao', label: 'Part.%', type: 'number', placeholder: '0-100' },
                { key: 'data_entrada', label: 'Data Entrada', type: 'date' },
                { key: 'observacoes', label: 'OBS (Detalhes, endereços, telefones, processos, etc.)', type: 'textarea', placeholder: 'Informações completas desta pessoa...', width: 'full' }
              ]}
              displayFields={['nome', 'cpf', 'qualificacao', 'participacao']}
              showDetailsButton={true}
            />
          </div>
        </Card>

        {/* Endereços */}
        <Card>
          <CompactDataManager
            title="Endereços"
            entityId={id}
            tableName="cedentes_enderecos"
            items={enderecos}
            onRefresh={loadEnderecos}
            onFetchFromAPI={cedente.cnpj ? () => fetchFromAPI('enderecos') : undefined}
            fields={[
              { key: 'endereco', label: 'Endereço', type: 'text', required: true, width: 'full' },
              { key: 'tipo', label: 'Tipo', type: 'select', options: ['comercial', 'residencial', 'correspondencia'] },
              { key: 'cep', label: 'CEP', type: 'text' },
              { key: 'cidade', label: 'Cidade', type: 'text' },
              { key: 'estado', label: 'UF', type: 'text' }
            ]}
            displayFields={['endereco', 'tipo', 'cidade']}
          />
        </Card>

        {/* Telefones */}
        <Card>
          <CompactDataManager
            title="Telefones"
            entityId={id}
            tableName="cedentes_telefones"
            items={telefones}
            onRefresh={loadTelefones}
            onFetchFromAPI={cedente.cnpj ? () => fetchFromAPI('telefones') : undefined}
            fields={[
              { key: 'telefone', label: 'Telefone', type: 'tel', required: true },
              { key: 'tipo', label: 'Tipo', type: 'select', options: ['celular', 'fixo', 'comercial'] },
              { key: 'nome_contato', label: 'Contato', type: 'text' }
            ]}
            displayFields={['telefone', 'tipo', 'nome_contato']}
          />
        </Card>

        {/* E-mails */}
        <Card>
          <CompactDataManager
            title="E-mails"
            entityId={id}
            tableName="cedentes_emails"
            items={emails}
            onRefresh={loadEmails}
            onFetchFromAPI={cedente.cnpj ? () => fetchFromAPI('emails') : undefined}
            fields={[
              { key: 'email', label: 'E-mail', type: 'email', required: true, width: 'half' },
              { key: 'tipo', label: 'Tipo', type: 'select', options: ['comercial', 'pessoal', 'financeiro'] },
              { key: 'nome_contato', label: 'Contato', type: 'text' }
            ]}
            displayFields={['email', 'tipo', 'nome_contato']}
          />
        </Card>

        {/* Pessoas Ligadas */}
        <Card>
          <CompactDataManager
            title="Pessoas Ligadas"
            entityId={id}
            tableName="cedentes_pessoas_ligadas"
            items={pessoasLigadas}
            onRefresh={loadPessoasLigadas}
            onFetchFromAPI={cedente.cnpj ? () => fetchFromAPI('pessoas_ligadas') : undefined}
            fields={[
              { key: 'cpf', label: 'CPF', type: 'text' },
              { key: 'nome', label: 'Nome', type: 'text', required: true, width: 'half' },
              { key: 'tipo_relacionamento', label: 'Relacionamento', type: 'select', 
                options: ['pai', 'mae', 'conjuge', 'filho', 'irmao', 'socio', 'administrador', 'outro'] },
              { key: 'observacoes', label: 'Obs', type: 'text', width: 'half' }
            ]}
            displayFields={['nome', 'cpf', 'tipo_relacionamento']}
          />
        </Card>

        {/* Empresas Ligadas */}
        <Card>
          <CompactDataManager
            title="Empresas Ligadas"
            entityId={id}
            tableName="cedentes_empresas_ligadas"
            items={empresasLigadas}
            onRefresh={loadEmpresasLigadas}
            onFetchFromAPI={cedente.cnpj ? () => fetchFromAPI('empresas_relacionadas') : undefined}
            fields={[
              { key: 'cnpj_relacionado', label: 'CNPJ', type: 'text', required: true },
              { key: 'razao_social', label: 'Razão Social', type: 'text', required: true, width: 'half' },
              { key: 'tipo_relacionamento', label: 'Tipo', type: 'select', 
                options: ['grupo', 'filial', 'matriz', 'sociedade'] },
              { key: 'participacao', label: 'Part.%', type: 'number' },
              { key: 'observacoes', label: 'Obs', type: 'text', width: 'half' }
            ]}
            displayFields={['razao_social', 'cnpj_relacionado', 'tipo_relacionamento']}
          />
        </Card>
      </div>
    </main>
  );
}

