'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj, formatMoney } from '@/lib/format';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/ui/PageHeader';

type PessoaFisica = {
  id: string;
  cpf: string;
  nome: string;
  nome_mae: string | null;
  data_nascimento: string | null;
  rg: string | null;
  situacao: string | null;
  observacoes_gerais: string | null;
  origem: string | null;
  created_at: string;
  updated_at: string;
};

export default function PessoaFisicaPage() {
  const params = useParams();
  const router = useRouter();
  const cpf = decodeURIComponent(params.cpf as string).replace(/\D+/g, '');
  
  const [pessoa, setPessoa] = useState<PessoaFisica | null>(null);
  const [loading, setLoading] = useState(true);
  const [cedentesVinculados, setCedentesVinculados] = useState<any[]>([]);
  const [sacadosVinculados, setSacadosVinculados] = useState<any[]>([]);
  const [enderecos, setEnderecos] = useState<any[]>([]);
  const [telefones, setTelefones] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [familiares, setFamiliares] = useState<any[]>([]);
  const [processos, setProcessos] = useState<any[]>([]);
  const [empresasLigadas, setEmpresasLigadas] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [cpf]);

  async function loadData() {
    setLoading(true);
    try {
      const cpfLimpo = cpf.replace(/\D+/g, '');
      
      if (!cpfLimpo || cpfLimpo.length !== 11) {
        setPessoa(null);
        setLoading(false);
        return;
      }
      
      // Primeiro, tentar buscar na tabela pessoas_fisicas (ativo ou inativo)
      let { data, error } = await supabase
        .from('pessoas_fisicas')
        .select('*')
        .eq('cpf', cpfLimpo)
        .maybeSingle();
      
      // Se não encontrou, buscar no QSA e criar automaticamente
      if (!data && (!error || error.code === 'PGRST116')) {
        const qsaData = await buscarNoQSA(cpfLimpo);
        
        if (qsaData) {
          // Normalizar CPF do QSA
          const cpfQSA = (qsaData.cpf || cpfLimpo).replace(/\D+/g, '');
          
          if (cpfQSA.length === 11) {
            // Verificar novamente se existe (pode ter sido criado entre as requisições)
            const { data: existeData } = await supabase
              .from('pessoas_fisicas')
              .select('*')
              .eq('cpf', cpfQSA)
              .maybeSingle();
            
            if (existeData) {
              // Já existe, usar os dados existentes
              data = existeData;
            } else {
              // Obter usuário autenticado
              const { data: { user } } = await supabase.auth.getUser();
              
              // Criar registro automaticamente em pessoas_fisicas
              const insertData: any = {
                cpf: cpfQSA,
                nome: (qsaData.nome || '').trim() || 'Nome não informado',
                situacao: 'ativa',
                origem: 'qsa',
                ativo: true
              };
              
              if (user) {
                insertData.user_id = user.id;
              }
              
              const { data: novaPessoa, error: createError } = await supabase
                .from('pessoas_fisicas')
                .insert(insertData)
                .select()
                .single();
              
              if (createError) {
                console.error('Erro ao criar pessoa física do QSA:', createError);
                
                // Se erro for de constraint UNIQUE, tentar buscar novamente
                if (createError.code === '23505') {
                  const { data: retryData } = await supabase
                    .from('pessoas_fisicas')
                    .select('*')
                    .eq('cpf', cpfQSA)
                    .maybeSingle();
                  
                  if (retryData) {
                    data = retryData;
                  } else {
                    setPessoa(null);
                    setLoading(false);
                    return;
                  }
                } else {
                  setPessoa(null);
                  setLoading(false);
                  return;
                }
              } else {
                data = novaPessoa;
              }
            }
          }
        } else {
          setPessoa(null);
          setLoading(false);
          return;
        }
      } else if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar pessoa física:', error);
        setPessoa(null);
        setLoading(false);
        return;
      }
      
      if (data) {
        setPessoa(data);
        if (data.id) {
          await loadVinculacoes(data.id);
          await loadContatos(data.id);
          await loadFamiliares(data.id);
          await loadProcessos(data.id);
          await loadEmpresasLigadas(data.id);
        }
      } else {
        setPessoa(null);
      }
    } catch (err) {
      console.error('Erro:', err);
      setPessoa(null);
    } finally {
      setLoading(false);
    }
  }

  async function buscarNoQSA(cpfLimpo: string): Promise<any> {
    try {
      // Buscar no QSA de cedentes
      const { data: qsaCedentes } = await supabase
        .from('cedentes_qsa')
        .select('id, cpf, nome, cedente_id, qualificacao')
        .eq('ativo', true);

      // Buscar no QSA de sacados
      const { data: qsaSacados } = await supabase
        .from('sacados_qsa')
        .select('id, cpf, nome, sacado_cnpj, qualificacao')
        .eq('ativo', true);

      // Filtrar manualmente para comparar CPFs (formatado e não formatado)
      const qsaCedentesFiltrados = (qsaCedentes || []).filter((qsa: any) => {
        if (!qsa.cpf) return false;
        const qsaCpfLimpo = qsa.cpf.replace(/\D+/g, '');
        return qsaCpfLimpo === cpfLimpo;
      });

      const qsaSacadosFiltrados = (qsaSacados || []).filter((qsa: any) => {
        if (!qsa.cpf) return false;
        const qsaCpfLimpo = qsa.cpf.replace(/\D+/g, '');
        return qsaCpfLimpo === cpfLimpo;
      });

      const qsaData = qsaCedentesFiltrados?.[0] || qsaSacadosFiltrados?.[0];
      
      // Garantir que o CPF está normalizado
      if (qsaData && qsaData.cpf) {
        qsaData.cpf = qsaData.cpf.replace(/\D+/g, '');
      }
      
      return qsaData;
    } catch (error) {
      console.error('Erro ao buscar no QSA:', error);
      return null;
    }
  }

  async function loadVinculacoes(pessoaId: string) {
    try {
      const cpfLimpo = cpf.replace(/\D+/g, '');
      
      // Carregar cedentes vinculados diretamente
      const { data: cedentesData } = await supabase
        .from('pessoas_fisicas_cedentes')
        .select('*')
        .eq('pessoa_id', pessoaId)
        .eq('ativo', true);
      
      // Também buscar no QSA de cedentes
      const { data: qsaCedentes } = await supabase
        .from('cedentes_qsa')
        .select('id, cpf, nome, cedente_id, qualificacao')
        .eq('ativo', true);

      const qsaCedentesFiltrados = (qsaCedentes || []).filter((qsa: any) => {
        if (!qsa.cpf) return false;
        const qsaCpfLimpo = qsa.cpf.replace(/\D+/g, '');
        return qsaCpfLimpo === cpfLimpo;
      });

      // Combinar vinculações diretas com QSA
      const todosCedentes = [...(cedentesData || [])];
      
      if (qsaCedentesFiltrados.length > 0) {
        const cedentesComNomes = await Promise.all(
          qsaCedentesFiltrados.map(async (qsa) => {
            // Verificar se já existe vinculação direta
            const jaExiste = todosCedentes.some(v => v.cedente_id === qsa.cedente_id);
            if (jaExiste) return null;
            
            const { data: cedente } = await supabase
              .from('cedentes')
              .select('nome, razao_social')
              .eq('id', qsa.cedente_id)
              .single();
            return {
              id: qsa.id || '',
              pessoa_id: pessoaId,
              cedente_id: qsa.cedente_id,
              cedente_nome: cedente?.nome || cedente?.razao_social || qsa.cedente_id,
              tipo_relacionamento: 'socio',
              cargo: qsa.qualificacao || null,
              origem: 'qsa'
            };
          })
        );
        todosCedentes.push(...cedentesComNomes.filter(Boolean));
      }

      if (todosCedentes.length > 0) {
        const cedentesComNomes = await Promise.all(
          todosCedentes.map(async (vinc) => {
            if (vinc.cedente_nome) return vinc; // Já tem nome
            const { data: cedente } = await supabase
              .from('cedentes')
              .select('nome, razao_social')
              .eq('id', vinc.cedente_id)
              .single();
            return {
              ...vinc,
              cedente_nome: cedente?.nome || cedente?.razao_social || vinc.cedente_id
            };
          })
        );
        setCedentesVinculados(cedentesComNomes);
      } else {
        setCedentesVinculados([]);
      }

      // Carregar sacados vinculados diretamente
      const { data: sacadosData } = await supabase
        .from('pessoas_fisicas_sacados')
        .select('*')
        .eq('pessoa_id', pessoaId)
        .eq('ativo', true);
      
      // Também buscar no QSA de sacados
      const { data: qsaSacados } = await supabase
        .from('sacados_qsa')
        .select('id, cpf, nome, sacado_cnpj, qualificacao')
        .eq('ativo', true);

      const qsaSacadosFiltrados = (qsaSacados || []).filter((qsa: any) => {
        if (!qsa.cpf) return false;
        const qsaCpfLimpo = qsa.cpf.replace(/\D+/g, '');
        return qsaCpfLimpo === cpfLimpo;
      });

      // Combinar vinculações diretas com QSA
      const todosSacados = [...(sacadosData || [])];
      
      if (qsaSacadosFiltrados.length > 0) {
        const sacadosComNomes = await Promise.all(
          qsaSacadosFiltrados.map(async (qsa) => {
            // Verificar se já existe vinculação direta
            const jaExiste = todosSacados.some(v => v.sacado_cnpj === qsa.sacado_cnpj);
            if (jaExiste) return null;
            
            const { data: sacado } = await supabase
              .from('sacados')
              .select('razao_social, nome_fantasia')
              .eq('cnpj', qsa.sacado_cnpj)
              .single();
            return {
              id: qsa.id || '',
              pessoa_id: pessoaId,
              sacado_cnpj: qsa.sacado_cnpj,
              sacado_nome: sacado?.razao_social || sacado?.nome_fantasia || qsa.sacado_cnpj,
              tipo_relacionamento: 'socio',
              cargo: qsa.qualificacao || null,
              origem: 'qsa'
            };
          })
        );
        todosSacados.push(...sacadosComNomes.filter(Boolean));
      }

      if (todosSacados.length > 0) {
        const sacadosComNomes = await Promise.all(
          todosSacados.map(async (vinc) => {
            if (vinc.sacado_nome) return vinc; // Já tem nome
            const { data: sacado } = await supabase
              .from('sacados')
              .select('razao_social, nome_fantasia')
              .eq('cnpj', vinc.sacado_cnpj)
              .single();
            return {
              ...vinc,
              sacado_nome: sacado?.razao_social || sacado?.nome_fantasia || vinc.sacado_cnpj
            };
          })
        );
        setSacadosVinculados(sacadosComNomes);
      } else {
        setSacadosVinculados([]);
      }
    } catch (error) {
      console.error('Erro ao carregar vinculações:', error);
    }
  }

  async function loadContatos(pessoaId: string) {
    try {
      // Carregar endereços
      const { data: enderecosData } = await supabase
        .from('pessoas_fisicas_enderecos')
        .select('*')
        .eq('pessoa_id', pessoaId)
        .eq('ativo', true)
        .order('principal', { ascending: false })
        .order('created_at', { ascending: false });
      setEnderecos(enderecosData || []);

      // Carregar telefones
      const { data: telefonesData } = await supabase
        .from('pessoas_fisicas_telefones')
        .select('*')
        .eq('pessoa_id', pessoaId)
        .eq('ativo', true)
        .order('principal', { ascending: false })
        .order('created_at', { ascending: false });
      setTelefones(telefonesData || []);

      // Carregar emails
      const { data: emailsData } = await supabase
        .from('pessoas_fisicas_emails')
        .select('*')
        .eq('pessoa_id', pessoaId)
        .eq('ativo', true)
        .order('principal', { ascending: false })
        .order('created_at', { ascending: false });
      setEmails(emailsData || []);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
    }
  }

  async function loadFamiliares(pessoaId: string) {
    try {
      const { data: familiaresData } = await supabase
        .from('pessoas_fisicas_familiares')
        .select('*')
        .eq('pessoa_id', pessoaId)
        .eq('ativo', true)
        .order('created_at', { ascending: false });
      setFamiliares(familiaresData || []);
    } catch (error) {
      console.error('Erro ao carregar familiares:', error);
    }
  }

  async function loadProcessos(pessoaId: string) {
    try {
      const { data: processosData } = await supabase
        .from('pessoas_fisicas_processos')
        .select('*')
        .eq('pessoa_id', pessoaId)
        .eq('ativo', true)
        .order('data_distribuicao', { ascending: false });
      setProcessos(processosData || []);
    } catch (error) {
      console.error('Erro ao carregar processos:', error);
    }
  }

  async function loadEmpresasLigadas(pessoaId: string) {
    try {
      const { data: empresasData } = await supabase
        .from('pessoas_fisicas_empresas')
        .select('*')
        .eq('pessoa_id', pessoaId)
        .eq('ativo', true)
        .order('data_inicio', { ascending: false });
      setEmpresasLigadas(empresasData || []);
    } catch (error) {
      console.error('Erro ao carregar empresas ligadas:', error);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0369a1]"></div>
            <p className="mt-2 text-gray-600">Carregando...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!pessoa) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="text-center py-8">
            <p className="text-gray-600">Pessoa física não encontrada</p>
            <Button variant="primary" onClick={() => router.push('/pessoas-fisicas')} className="mt-4">
              Voltar
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container max-w-6xl mx-auto px-4 py-4 space-y-3">
        <PageHeader
          title={pessoa.nome}
          subtitle={`CPF: ${formatCpfCnpj(pessoa.cpf)}`}
          backHref="/pessoas-fisicas"
          actions={
            <Button variant="primary" size="sm" onClick={() => router.push(`/pessoas-fisicas/${encodeURIComponent(cpf)}/editar`)}>
              Editar
            </Button>
          }
          className="mb-2"
        />

        {/* Informações - Estilo Excel */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-3 py-1.5">
            <h2 className="text-xs font-semibold text-gray-700 uppercase">Informações Cadastrais</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <tbody>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-3 py-1.5 bg-gray-50 border-r border-gray-200 font-medium text-gray-700 w-32">CPF</td>
                  <td className="px-3 py-1.5 text-gray-900">{formatCpfCnpj(pessoa.cpf)}</td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-3 py-1.5 bg-gray-50 border-r border-gray-200 font-medium text-gray-700">Situação</td>
                  <td className="px-3 py-1.5">
                    <Badge variant={pessoa.situacao === 'ativa' ? 'success' : pessoa.situacao === 'falecida' ? 'error' : 'warning'} size="sm">
                      {pessoa.situacao || 'ativa'}
                    </Badge>
                  </td>
                </tr>
                {pessoa.rg && (
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-3 py-1.5 bg-gray-50 border-r border-gray-200 font-medium text-gray-700">RG</td>
                    <td className="px-3 py-1.5 text-gray-900">{pessoa.rg}</td>
                  </tr>
                )}
                {pessoa.data_nascimento && (
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-3 py-1.5 bg-gray-50 border-r border-gray-200 font-medium text-gray-700">Data Nasc.</td>
                    <td className="px-3 py-1.5 text-gray-900">{new Date(pessoa.data_nascimento).toLocaleDateString('pt-BR')}</td>
                  </tr>
                )}
                {pessoa.nome_mae && (
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-3 py-1.5 bg-gray-50 border-r border-gray-200 font-medium text-gray-700">Nome da Mãe</td>
                    <td className="px-3 py-1.5 text-gray-900">{pessoa.nome_mae}</td>
                  </tr>
                )}
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-3 py-1.5 bg-gray-50 border-r border-gray-200 font-medium text-gray-700">Origem</td>
                  <td className="px-3 py-1.5 text-gray-900">{pessoa.origem || 'manual'}</td>
                </tr>
                {pessoa.observacoes_gerais && (
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-3 py-1.5 bg-gray-50 border-r border-gray-200 font-medium text-gray-700 align-top pt-2">Observações</td>
                    <td className="px-3 py-1.5 text-gray-900 whitespace-pre-wrap pt-2">{pessoa.observacoes_gerais}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Endereços - Estilo Excel */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-3 py-1.5 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-gray-700 uppercase">Endereços</h2>
            <Button variant="primary" size="sm" onClick={() => router.push(`/pessoas-fisicas/${encodeURIComponent(cpf)}/editar`)}>
              {enderecos.length > 0 ? 'Gerenciar' : 'Adicionar'}
            </Button>
          </div>
          <div className="overflow-x-auto">
            {enderecos.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-gray-500">Nenhum endereço cadastrado</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-300">
                    <th className="px-3 py-1.5 text-left font-semibold text-gray-700 border-r border-gray-200">Endereço</th>
                    <th className="px-3 py-1.5 text-left font-semibold text-gray-700 border-r border-gray-200 w-24">Tipo</th>
                    <th className="px-3 py-1.5 text-left font-semibold text-gray-700 border-r border-gray-200 w-28">CEP</th>
                    <th className="px-3 py-1.5 text-left font-semibold text-gray-700 border-r border-gray-200 w-32">Cidade</th>
                    <th className="px-3 py-1.5 text-left font-semibold text-gray-700 border-r border-gray-200 w-16">UF</th>
                    <th className="px-3 py-1.5 text-left font-semibold text-gray-700 w-32">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {enderecos.map((endereco) => (
                    <tr key={endereco.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-3 py-1.5 text-gray-900 border-r border-gray-200">
                        {endereco.endereco}
                        {endereco.principal && (
                          <Badge variant="success" size="sm" className="ml-2">Principal</Badge>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-gray-700 border-r border-gray-200">{endereco.tipo || '—'}</td>
                      <td className="px-3 py-1.5 text-gray-700 border-r border-gray-200">{endereco.cep || '—'}</td>
                      <td className="px-3 py-1.5 text-gray-700 border-r border-gray-200">{endereco.cidade || '—'}</td>
                      <td className="px-3 py-1.5 text-gray-700 border-r border-gray-200">{endereco.estado || '—'}</td>
                      <td className="px-3 py-1.5 text-gray-700">
                        {endereco.status ? (
                          <Badge variant="warning" size="sm">{endereco.status}</Badge>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Telefones - Estilo Excel */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-3 py-1.5 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-gray-700 uppercase">Telefones</h2>
            <Button variant="primary" size="sm" onClick={() => router.push(`/pessoas-fisicas/${encodeURIComponent(cpf)}/editar`)}>
              {telefones.length > 0 ? 'Gerenciar' : 'Adicionar'}
            </Button>
          </div>
          <div className="overflow-x-auto">
            {telefones.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-gray-500">Nenhum telefone cadastrado</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-300">
                    <th className="px-3 py-1.5 text-left font-semibold text-gray-700 border-r border-gray-200">Telefone</th>
                    <th className="px-3 py-1.5 text-left font-semibold text-gray-700 border-r border-gray-200 w-24">Tipo</th>
                    <th className="px-3 py-1.5 text-left font-semibold text-gray-700 border-r border-gray-200 w-40">Contato</th>
                    <th className="px-3 py-1.5 text-left font-semibold text-gray-700 w-32">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {telefones.map((telefone) => (
                    <tr key={telefone.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-3 py-1.5 text-gray-900 border-r border-gray-200">
                        {telefone.telefone}
                        {telefone.principal && (
                          <Badge variant="success" size="sm" className="ml-2">Principal</Badge>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-gray-700 border-r border-gray-200">{telefone.tipo || '—'}</td>
                      <td className="px-3 py-1.5 text-gray-700 border-r border-gray-200">{telefone.nome_contato || '—'}</td>
                      <td className="px-3 py-1.5 text-gray-700">
                        {telefone.status ? (
                          <Badge variant="warning" size="sm">{telefone.status}</Badge>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Emails - Estilo Excel */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-3 py-1.5 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-gray-700 uppercase">Emails</h2>
            <Button variant="primary" size="sm" onClick={() => router.push(`/pessoas-fisicas/${encodeURIComponent(cpf)}/editar`)}>
              {emails.length > 0 ? 'Gerenciar' : 'Adicionar'}
            </Button>
          </div>
          <div className="overflow-x-auto">
            {emails.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-gray-500">Nenhum email cadastrado</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-300">
                    <th className="px-3 py-1.5 text-left font-semibold text-gray-700 border-r border-gray-200">Email</th>
                    <th className="px-3 py-1.5 text-left font-semibold text-gray-700 border-r border-gray-200 w-24">Tipo</th>
                    <th className="px-3 py-1.5 text-left font-semibold text-gray-700 w-40">Contato</th>
                  </tr>
                </thead>
                <tbody>
                  {emails.map((email) => (
                    <tr key={email.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-3 py-1.5 text-gray-900 border-r border-gray-200">
                        {email.email}
                        {email.principal && (
                          <Badge variant="success" size="sm" className="ml-2">Principal</Badge>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-gray-700 border-r border-gray-200">{email.tipo || '—'}</td>
                      <td className="px-3 py-1.5 text-gray-700">{email.nome_contato || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Vinculações com Cedentes */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Cedentes Vinculados</h2>
            <Button variant="primary" size="sm" onClick={() => router.push(`/pessoas-fisicas/${encodeURIComponent(cpf)}/editar`)}>
              {cedentesVinculados.length > 0 ? 'Gerenciar' : 'Adicionar'}
            </Button>
          </div>
          <div className="p-4">
            {cedentesVinculados.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum cedente vinculado</p>
            ) : (
              <div className="space-y-2">
                {cedentesVinculados.map((vinc) => (
                  <div key={vinc.id} className="p-3 border border-gray-200 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <a
                        href={`/cedentes/${vinc.cedente_id}`}
                        className="text-sm font-medium text-[#0369a1] hover:underline"
                      >
                        {vinc.cedente_nome}
                      </a>
                      {vinc.tipo_relacionamento && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          {vinc.tipo_relacionamento}
                        </span>
                      )}
                    </div>
                    {vinc.cargo && (
                      <p className="text-xs text-gray-600">Cargo: {vinc.cargo}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Vinculações com Sacados */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Sacados Vinculados</h2>
            <Button variant="primary" size="sm" onClick={() => router.push(`/pessoas-fisicas/${encodeURIComponent(cpf)}/editar`)}>
              {sacadosVinculados.length > 0 ? 'Gerenciar' : 'Adicionar'}
            </Button>
          </div>
          <div className="p-4">
            {sacadosVinculados.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum sacado vinculado</p>
            ) : (
              <div className="space-y-2">
                {sacadosVinculados.map((vinc) => (
                  <div key={vinc.id} className="p-3 border border-gray-200 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <a
                        href={`/sacados/${encodeURIComponent(vinc.sacado_cnpj)}`}
                        className="text-sm font-medium text-[#0369a1] hover:underline"
                      >
                        {vinc.sacado_nome}
                      </a>
                      {vinc.tipo_relacionamento && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          {vinc.tipo_relacionamento}
                        </span>
                      )}
                    </div>
                    {vinc.cargo && (
                      <p className="text-xs text-gray-600">Cargo: {vinc.cargo}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Familiares */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Familiares / Relacionamentos</h2>
            <Button variant="primary" size="sm" onClick={() => router.push(`/pessoas-fisicas/${encodeURIComponent(cpf)}/editar`)}>
              {familiares.length > 0 ? 'Gerenciar' : 'Adicionar'}
            </Button>
          </div>
          <div className="p-4">
            {familiares.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum familiar cadastrado</p>
            ) : (
              <div className="space-y-2">
                {familiares.map((familiar) => (
                  <div key={familiar.id} className="p-3 border border-gray-200 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900">{familiar.familiar_nome}</p>
                      {familiar.familiar_cpf && (
                        <p className="text-xs text-gray-600">CPF: {formatCpfCnpj(familiar.familiar_cpf)}</p>
                      )}
                      {familiar.tipo_relacionamento && (
                        <Badge variant="info" size="sm">{familiar.tipo_relacionamento}</Badge>
                      )}
                    </div>
                    {familiar.observacoes && (
                      <p className="text-xs text-gray-600 mt-1">{familiar.observacoes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Processos */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Processos Judiciais</h2>
            <Button variant="primary" size="sm" onClick={() => router.push(`/pessoas-fisicas/${encodeURIComponent(cpf)}/editar`)}>
              {processos.length > 0 ? 'Gerenciar' : 'Adicionar'}
            </Button>
          </div>
          <div className="p-4">
            {processos.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum processo cadastrado</p>
            ) : (
              <div className="space-y-2">
                {processos.map((processo) => (
                  <div key={processo.id} className="p-3 border border-gray-200 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900">{processo.numero_processo}</p>
                      {processo.status && (
                        <Badge variant="warning" size="sm">{processo.status}</Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      {processo.tribunal && <p>Tribunal: {processo.tribunal}</p>}
                      {processo.vara && <p>Vara: {processo.vara}</p>}
                      {processo.tipo_acao && <p>Tipo de Ação: {processo.tipo_acao}</p>}
                      {processo.valor_causa && <p>Valor da Causa: {formatMoney(processo.valor_causa)}</p>}
                      {processo.data_distribuicao && <p>Data Distribuição: {new Date(processo.data_distribuicao).toLocaleDateString('pt-BR')}</p>}
                      {processo.parte_contraria && <p>Parte Contrária: {processo.parte_contraria}</p>}
                      {processo.observacoes && <p className="mt-1">{processo.observacoes}</p>}
                      {processo.link_processo && (
                        <a href={processo.link_processo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Ver processo
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Empresas Ligadas */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-4 py-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Empresas Ligadas</h2>
            <Button variant="primary" size="sm" onClick={() => router.push(`/pessoas-fisicas/${encodeURIComponent(cpf)}/editar`)}>
              {empresasLigadas.length > 0 ? 'Gerenciar' : 'Adicionar'}
            </Button>
          </div>
          <div className="p-4">
            {empresasLigadas.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nenhuma empresa cadastrada</p>
            ) : (
              <div className="space-y-2">
                {empresasLigadas.map((empresa) => (
                  <div key={empresa.id} className="p-3 border border-gray-200 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900">{empresa.empresa_razao_social}</p>
                      <p className="text-xs text-gray-600">CNPJ: {formatCpfCnpj(empresa.empresa_cnpj)}</p>
                      {empresa.tipo_relacionamento && (
                        <Badge variant="info" size="sm">{empresa.tipo_relacionamento}</Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      {empresa.cargo && <p>Cargo: {empresa.cargo}</p>}
                      {empresa.participacao && <p>Participação: {empresa.participacao}%</p>}
                      {empresa.data_inicio && <p>Data Início: {new Date(empresa.data_inicio).toLocaleDateString('pt-BR')}</p>}
                      {empresa.data_fim && <p>Data Fim: {new Date(empresa.data_fim).toLocaleDateString('pt-BR')}</p>}
                      {empresa.observacoes && <p className="mt-1">{empresa.observacoes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

