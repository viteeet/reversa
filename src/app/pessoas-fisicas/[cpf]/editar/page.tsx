'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj } from '@/lib/format';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/ui/PageHeader';
import VinculacoesManager from '@/components/pessoas-fisicas/VinculacoesManager';
import ContatosManager from '@/components/pessoas-fisicas/ContatosManager';
import FamiliaresManager from '@/components/pessoas-fisicas/FamiliaresManager';
import ProcessosManager from '@/components/pessoas-fisicas/ProcessosManager';
import EmpresasLigadasManager from '@/components/pessoas-fisicas/EmpresasLigadasManager';

type PessoaFisica = {
  id: string;
  cpf: string;
  nome: string;
  nome_mae: string | null;
  data_nascimento: string | null;
  rg: string | null;
  situacao: string | null;
  observacoes_gerais: string | null;
};

export default function EditarPessoaFisicaPage() {
  const params = useParams();
  const router = useRouter();
  const cpf = decodeURIComponent(params.cpf as string).replace(/\D+/g, '');
  
  const [form, setForm] = useState<PessoaFisica>({
    id: '',
    cpf: '',
    nome: '',
    nome_mae: '',
    data_nascimento: '',
    rg: '',
    situacao: 'ativa',
    observacoes_gerais: '',
  });
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cedentesVinculados, setCedentesVinculados] = useState<any[]>([]);
  const [sacadosVinculados, setSacadosVinculados] = useState<any[]>([]);
  const [cedentesList, setCedentesList] = useState<any[]>([]);
  const [sacadosList, setSacadosList] = useState<any[]>([]);
  const [enderecos, setEnderecos] = useState<any[]>([]);
  const [telefones, setTelefones] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [familiares, setFamiliares] = useState<any[]>([]);
  const [processos, setProcessos] = useState<any[]>([]);
  const [empresasLigadas, setEmpresasLigadas] = useState<any[]>([]);
  const [buscandoAPI, setBuscandoAPI] = useState(false);

  useEffect(() => {
    loadData();
  }, [cpf]);

  // Validação de CPF
  function validarCPF(cpf: string): boolean {
    const cpfLimpo = cpf.replace(/\D+/g, '');
    if (cpfLimpo.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
    }
    let digito = 11 - (soma % 11);
    if (digito >= 10) digito = 0;
    if (digito !== parseInt(cpfLimpo.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
    }
    digito = 11 - (soma % 11);
    if (digito >= 10) digito = 0;
    if (digito !== parseInt(cpfLimpo.charAt(10))) return false;
    
    return true;
  }

  async function loadData() {
    setLoading(true);
    setErr(null);
    try {
      const cpfLimpo = cpf.replace(/\D+/g, '');
      
      // Primeiro, tentar buscar na tabela pessoas_fisicas
      let { data, error } = await supabase
        .from('pessoas_fisicas')
        .select('*')
        .eq('cpf', cpfLimpo)
        .eq('ativo', true)
        .single();
      
      // Se não encontrou, buscar no QSA e criar automaticamente
      if (!data && (!error || error.code === 'PGRST116')) {
        const qsaData = await buscarNoQSA(cpfLimpo);
        
        if (qsaData) {
          // Normalizar CPF do QSA
          const cpfQSA = (qsaData.cpf || cpfLimpo).replace(/\D+/g, '');
          
          if (cpfQSA.length === 11) {
            // Verificar novamente se existe
            const { data: existeData } = await supabase
              .from('pessoas_fisicas')
              .select('*')
              .eq('cpf', cpfQSA)
              .maybeSingle();
            
            if (existeData) {
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
                    setErr('Não foi possível criar nem encontrar a pessoa física');
                    setLoading(false);
                    return;
                  }
                } else {
                  setErr(`Erro ao criar: ${createError.message || 'Erro desconhecido'}`);
                  setLoading(false);
                  return;
                }
              } else {
                data = novaPessoa;
              }
            }
          }
        } else {
          // Não encontrou no QSA, permite criar nova pessoa
          setForm({
            id: '',
            cpf: cpf,
            nome: '',
            nome_mae: '',
            data_nascimento: '',
            rg: '',
            situacao: 'ativa',
            observacoes_gerais: '',
          });
          await loadCedentesESacados();
          setLoading(false);
          return;
        }
      } else if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar pessoa física:', error);
        setErr(`Erro ao carregar: ${error.message || 'Pessoa física não encontrada'}`);
        setLoading(false);
        return;
      }
      
      if (data) {
        setForm({
          id: data.id,
          cpf: data.cpf,
          nome: data.nome || '',
          nome_mae: data.nome_mae || '',
          data_nascimento: data.data_nascimento ? data.data_nascimento.split('T')[0] : '',
          rg: data.rg || '',
          situacao: data.situacao || 'ativa',
          observacoes_gerais: data.observacoes_gerais || '',
        });
        
        // Carregar vinculações
        await loadVinculacoes(data.id);
        // Carregar listas para seleção
        await loadCedentesESacados();
        // Carregar contatos
        await loadContatos(data.id);
        // Carregar familiares, processos e empresas ligadas
        await loadFamiliares(data.id);
        await loadProcessos(data.id);
        await loadEmpresasLigadas(data.id);
      }
    } catch (err: any) {
      console.error('Erro:', err);
      setErr(`Erro ao carregar dados: ${err.message || 'Erro desconhecido'}`);
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
      setCedentesVinculados([]);
      setSacadosVinculados([]);
    }
  }

  async function loadCedentesESacados() {
    // Carregar lista de cedentes
    const { data: cedentes } = await supabase
      .from('cedentes')
      .select('id, nome, razao_social')
      .order('nome');
    setCedentesList(cedentes || []);

    // Carregar lista de sacados
    const { data: sacados } = await supabase
      .from('sacados')
      .select('cnpj, razao_social, nome_fantasia')
      .order('razao_social');
    setSacadosList(sacados || []);
  }

  async function refreshVinculacoes() {
    if (form.id) {
      await loadVinculacoes(form.id);
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

  async function refreshContatos() {
    if (form.id) {
      await loadContatos(form.id);
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

  async function buscarDaAPI() {
    if (!cpf || cpf.replace(/\D+/g, '').length !== 11) {
      setErr('CPF inválido para buscar da API');
      return;
    }

    setBuscandoAPI(true);
    setErr(null);

    try {
      const cpfLimpo = cpf.replace(/\D+/g, '');
      const response = await fetch(`/api/bigdata?cpf=${encodeURIComponent(cpfLimpo)}&tipo=pessoa_fisica`);
      const data = await response.json();

      if (response.ok && data.dados_basicos) {
        // Preencher dados básicos
        if (data.dados_basicos.nome && !form.nome) {
          setForm(prev => ({ ...prev, nome: data.dados_basicos.nome }));
        }
        if (data.dados_basicos.nome_mae && !form.nome_mae) {
          setForm(prev => ({ ...prev, nome_mae: data.dados_basicos.nome_mae }));
        }
        if (data.dados_basicos.data_nascimento && !form.data_nascimento) {
          setForm(prev => ({ ...prev, data_nascimento: data.dados_basicos.data_nascimento }));
        }

        // Se a pessoa já está cadastrada, adicionar endereços, telefones e emails
        if (form.id) {
          // Adicionar endereços
          if (data.enderecos && data.enderecos.length > 0) {
            for (const endereco of data.enderecos) {
              const { error } = await supabase
                .from('pessoas_fisicas_enderecos')
                .insert({
                  pessoa_id: form.id,
                  endereco: endereco.endereco,
                  tipo: endereco.tipo || 'residencial',
                  cep: endereco.cep || null,
                  cidade: endereco.cidade || null,
                  estado: endereco.estado || null,
                  principal: endereco.principal || false,
                  ativo: true
                });
              if (error) console.error('Erro ao adicionar endereço:', error);
            }
            await loadContatos(form.id);
          }

          // Adicionar telefones
          if (data.telefones && data.telefones.length > 0) {
            for (const telefone of data.telefones) {
              const { error } = await supabase
                .from('pessoas_fisicas_telefones')
                .insert({
                  pessoa_id: form.id,
                  telefone: telefone.telefone,
                  tipo: telefone.tipo || 'fixo',
                  principal: telefone.principal || false,
                  ativo: true
                });
              if (error) console.error('Erro ao adicionar telefone:', error);
            }
            await loadContatos(form.id);
          }

          // Adicionar emails
          if (data.emails && data.emails.length > 0) {
            for (const email of data.emails) {
              const { error } = await supabase
                .from('pessoas_fisicas_emails')
                .insert({
                  pessoa_id: form.id,
                  email: email.email,
                  tipo: email.tipo || 'pessoal',
                  principal: email.principal || false,
                  ativo: true
                });
              if (error) console.error('Erro ao adicionar email:', error);
            }
            await loadContatos(form.id);
          }
        }

        setErr(null);
        alert('Dados buscados da API BigData com sucesso!');
      } else {
        setErr(data.error || 'Erro ao buscar dados da API');
      }
    } catch (error: any) {
      console.error('Erro ao buscar da API:', error);
      setErr(`Erro ao buscar da API: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setBuscandoAPI(false);
    }
  }

  async function salvar() {
    if (!form.nome.trim()) {
      setErr('Nome é obrigatório');
      return;
    }
    
    const cpfLimpo = form.cpf.replace(/\D+/g, '');
    if (!validarCPF(cpfLimpo)) {
      setErr('CPF inválido');
      return;
    }
    
    setPending(true);
    setErr(null);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setErr('Não autenticado');
      setPending(false);
      return;
    }
    
    try {
      if (form.id) {
        // Atualizar pessoa existente
        const { error } = await supabase
          .from('pessoas_fisicas')
          .update({
            nome: form.nome.trim(),
            nome_mae: form.nome_mae || null,
            data_nascimento: form.data_nascimento || null,
            rg: form.rg || null,
            situacao: form.situacao || 'ativa',
            observacoes_gerais: form.observacoes_gerais || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', form.id);
        
        if (error) {
          setErr(error.message);
        } else {
          router.push(`/pessoas-fisicas/${encodeURIComponent(cpfLimpo)}`);
        }
      } else {
        // Criar nova pessoa física
        const { data: novaPessoa, error } = await supabase
          .from('pessoas_fisicas')
          .insert({
            user_id: user.id,
            cpf: cpfLimpo,
            nome: form.nome.trim(),
            nome_mae: form.nome_mae || null,
            data_nascimento: form.data_nascimento || null,
            rg: form.rg || null,
            situacao: form.situacao || 'ativa',
            observacoes_gerais: form.observacoes_gerais || null,
            origem: 'manual',
          })
          .select()
          .single();
        
        if (error) {
          if (error.code === '23505') {
            setErr('CPF já cadastrado');
          } else {
            setErr(error.message);
          }
        } else if (novaPessoa) {
          // Atualizar form com o ID da nova pessoa
          setForm({ ...form, id: novaPessoa.id });
          // Recarregar dados para mostrar seções de contatos
          await loadContatos(novaPessoa.id);
          await loadVinculacoes(novaPessoa.id);
          // Não redireciona, permite continuar editando
          setErr(null);
        }
      }
    } catch (err: any) {
      setErr(`Erro ao salvar: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0369a1]"></div>
            <p className="mt-2 text-gray-600">Carregando...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container max-w-6xl mx-auto px-4 py-4 space-y-3">
        <PageHeader
          title={form.nome || 'Nova Pessoa Fisica'}
          subtitle={`CPF: ${formatCpfCnpj(form.cpf || cpf)}`}
          backHref={`/pessoas-fisicas/${encodeURIComponent(cpf)}`}
          className="mb-2"
        />
        {!form.id && (
          <div className="inline-block text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
            Nao cadastrada
          </div>
        )}

        {/* Formulário - Estilo Excel */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-100 px-3 py-1.5 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-gray-700 uppercase">Dados Cadastrais</h2>
            <div className="flex gap-1.5">
              <button
                onClick={buscarDaAPI}
                disabled={buscandoAPI}
                className="px-2 py-1 text-xs font-medium bg-[#0369a1] text-white hover:bg-[#075985] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {buscandoAPI ? 'Buscando...' : 'Buscar API'}
              </button>
              <button 
                className="px-2 py-1 text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                onClick={salvar}
                disabled={pending}
              >
                {pending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <tbody>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-3 py-1.5 bg-gray-50 border-r border-gray-200 font-medium text-gray-700 w-32">CPF</td>
                  <td className="px-3 py-1.5">
                    <input
                      type="text"
                      value={formatCpfCnpj(form.cpf)}
                      disabled
                      className="w-full px-2 py-1 border border-gray-300 bg-gray-100 text-xs"
                    />
                  </td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-3 py-1.5 bg-gray-50 border-r border-gray-200 font-medium text-gray-700">Nome *</td>
                  <td className="px-3 py-1.5">
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#0369a1]"
                    />
                  </td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-3 py-1.5 bg-gray-50 border-r border-gray-200 font-medium text-gray-700">Nome da Mãe</td>
                  <td className="px-3 py-1.5">
                    <input
                      type="text"
                      placeholder="Nome completo da mãe"
                      value={form.nome_mae}
                      onChange={(e) => setForm({ ...form, nome_mae: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#0369a1]"
                    />
                  </td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-3 py-1.5 bg-gray-50 border-r border-gray-200 font-medium text-gray-700">RG</td>
                  <td className="px-3 py-1.5">
                    <input
                      type="text"
                      placeholder="RG"
                      value={form.rg}
                      onChange={(e) => setForm({ ...form, rg: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#0369a1]"
                    />
                  </td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-3 py-1.5 bg-gray-50 border-r border-gray-200 font-medium text-gray-700">Data Nasc.</td>
                  <td className="px-3 py-1.5">
                    <input
                      type="date"
                      value={form.data_nascimento}
                      onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#0369a1]"
                    />
                  </td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-3 py-1.5 bg-gray-50 border-r border-gray-200 font-medium text-gray-700">Situação</td>
                  <td className="px-3 py-1.5">
                    <select 
                      className="w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#0369a1]"
                      value={form.situacao}
                      onChange={(e) => setForm({ ...form, situacao: e.target.value })}
                    >
                      <option value="ativa">Ativa</option>
                      <option value="inativa">Inativa</option>
                      <option value="falecida">Falecida</option>
                    </select>
                  </td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-3 py-1.5 bg-gray-50 border-r border-gray-200 font-medium text-gray-700 align-top pt-2">Observações</td>
                  <td className="px-3 py-1.5">
                    <textarea 
                      className="w-full px-2 py-1 border border-gray-300 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-[#0369a1]"
                      rows={3}
                      value={form.observacoes_gerais}
                      onChange={(e) => setForm({ ...form, observacoes_gerais: e.target.value })}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {err && (
            <div className="px-3 py-2 bg-red-50 border-t border-red-200">
              <p className="text-xs text-red-600">{err}</p>
            </div>
          )}
        </div>

        {/* Endereços */}
        {form.id && (
          <ContatosManager
            pessoaId={form.id}
            tipo="enderecos"
            items={enderecos}
            onRefresh={refreshContatos}
          />
        )}

        {/* Telefones */}
        {form.id && (
          <ContatosManager
            pessoaId={form.id}
            tipo="telefones"
            items={telefones}
            onRefresh={refreshContatos}
          />
        )}

        {/* Emails */}
        {form.id && (
          <ContatosManager
            pessoaId={form.id}
            tipo="emails"
            items={emails}
            onRefresh={refreshContatos}
          />
        )}

        {/* Vinculações com Cedentes */}
        {form.id && (
          <VinculacoesManager
            pessoaId={form.id}
            tipo="cedentes"
            items={cedentesVinculados}
            onRefresh={refreshVinculacoes}
            cedentesList={cedentesList}
          />
        )}

        {/* Vinculações com Sacados */}
        {form.id && (
          <VinculacoesManager
            pessoaId={form.id}
            tipo="sacados"
            items={sacadosVinculados}
            onRefresh={refreshVinculacoes}
            sacadosList={sacadosList}
          />
        )}

        {/* Familiares */}
        {form.id && (
          <FamiliaresManager
            pessoaId={form.id}
            items={familiares}
            onRefresh={() => loadFamiliares(form.id)}
          />
        )}

        {/* Processos */}
        {form.id && (
          <ProcessosManager
            pessoaId={form.id}
            items={processos}
            onRefresh={() => loadProcessos(form.id)}
          />
        )}

        {/* Empresas Ligadas */}
        {form.id && (
          <EmpresasLigadasManager
            pessoaId={form.id}
            items={empresasLigadas}
            onRefresh={() => loadEmpresasLigadas(form.id)}
          />
        )}
      </div>
    </main>
  );
}

