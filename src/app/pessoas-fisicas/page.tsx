'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCpfCnpj } from '@/lib/format';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/ToastContainer';

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
  origem_tipo?: string; // 'Cadastro Direto', 'QSA Cedente', 'QSA Sacado'
  origem_nome?: string; // Nome do cedente ou sacado
  created_at: string;
  // Contadores
  quantidade_familiares?: number;
  quantidade_cedentes_vinculados?: number;
  quantidade_sacados_vinculados?: number;
  quantidade_qsa_cedentes?: number;
  quantidade_qsa_sacados?: number;
};

type ViewMode = 'table' | 'grid';

export default function PessoasFisicasPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [items, setItems] = useState<PessoaFisica[]>([]);
  const [form, setForm] = useState({ 
    cpf: '', nome: '', nome_mae: '', data_nascimento: '', rg: '', situacao: 'ativa', observacoes_gerais: ''
  });
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [sortBy, setSortBy] = useState<'nome' | 'cpf' | 'situacao'>('nome');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [filterSituacao, setFilterSituacao] = useState<string>('all');
  const [filterOrigem, setFilterOrigem] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) { router.replace('/login'); return; }
      load();
    });
  }, [router]);

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

  async function load() {
    try {
      // Buscar pessoas físicas cadastradas
      const { data: pessoasFisicas, error: errorPF } = await supabase
        .from('pessoas_fisicas')
        .select('id, cpf, nome, nome_mae, data_nascimento, rg, situacao, observacoes_gerais, origem, created_at')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (errorPF && errorPF.code !== 'PGRST116' && errorPF.code !== '42P01') {
        console.error('Erro ao carregar pessoas físicas:', errorPF);
        if (errorPF.code === 'PGRST116' || errorPF.code === '42P01' || errorPF.message?.includes('does not exist')) {
          setErr('Tabela de pessoas físicas não encontrada. Execute o script SQL de criação da tabela no Supabase.');
        } else {
          setErr(`Erro ao carregar: ${errorPF.message}`);
        }
        setItems([]);
        return;
      }

      // Buscar pessoas do QSA de cedentes com nome do cedente
      const { data: qsaCedentes } = await supabase
        .from('cedentes_qsa')
        .select(`
          cpf, 
          nome,
          cedente_id,
          cedentes (
            id,
            nome,
            razao_social
          )
        `)
        .not('cpf', 'is', null)
        .neq('cpf', '')
        .eq('ativo', true);

      // Buscar pessoas do QSA de sacados com nome do sacado
      const { data: qsaSacados } = await supabase
        .from('sacados_qsa')
        .select(`
          cpf, 
          nome,
          sacado_cnpj,
          sacados (
            cnpj,
            razao_social,
            nome_fantasia
          )
        `)
        .not('cpf', 'is', null)
        .neq('cpf', '')
        .eq('ativo', true);

      // Criar mapas de CPF -> lista de cedentes/sacados
      const qsaCedentesMap = new Map<string, string[]>();
      const qsaSacadosMap = new Map<string, string[]>();

      (qsaCedentes || []).forEach((qsa: any) => {
        const cpfLimpo = qsa.cpf?.replace(/\D+/g, '');
        if (cpfLimpo && cpfLimpo.length === 11) {
          const cedente = Array.isArray(qsa.cedentes) ? qsa.cedentes[0] : qsa.cedentes;
          const nomeCedente = cedente?.nome || cedente?.razao_social || 'Cedente';
          if (!qsaCedentesMap.has(cpfLimpo)) {
            qsaCedentesMap.set(cpfLimpo, []);
          }
          qsaCedentesMap.get(cpfLimpo)!.push(nomeCedente);
        }
      });

      (qsaSacados || []).forEach((qsa: any) => {
        const cpfLimpo = qsa.cpf?.replace(/\D+/g, '');
        if (cpfLimpo && cpfLimpo.length === 11) {
          const sacado = Array.isArray(qsa.sacados) ? qsa.sacados[0] : qsa.sacados;
          const nomeSacado = sacado?.nome_fantasia || sacado?.razao_social || 'Sacado';
          if (!qsaSacadosMap.has(cpfLimpo)) {
            qsaSacadosMap.set(cpfLimpo, []);
          }
          qsaSacadosMap.get(cpfLimpo)!.push(nomeSacado);
        }
      });

      // Combinar todas as pessoas (físicas + QSA)
      const pessoasMap = new Map<string, PessoaFisica>();

      // Buscar contadores para pessoas físicas cadastradas
      const pessoasIds = (pessoasFisicas || []).map((pf: any) => pf.id);
      
      const familiaresMap = new Map<string, number>();
      const cedentesVinculadosMap = new Map<string, number>();
      const sacadosVinculadosMap = new Map<string, number>();

      if (pessoasIds.length > 0) {
        // Buscar familiares
        const { data: familiaresData } = await supabase
          .from('pessoas_fisicas_familiares')
          .select('pessoa_id')
          .in('pessoa_id', pessoasIds)
          .eq('ativo', true);
        
        (familiaresData || []).forEach((f: any) => {
          familiaresMap.set(f.pessoa_id, (familiaresMap.get(f.pessoa_id) || 0) + 1);
        });

        // Buscar vinculações com cedentes
        const { data: cedentesVinculadosData } = await supabase
          .from('pessoas_fisicas_cedentes')
          .select('pessoa_id')
          .in('pessoa_id', pessoasIds)
          .eq('ativo', true);
        
        (cedentesVinculadosData || []).forEach((v: any) => {
          cedentesVinculadosMap.set(v.pessoa_id, (cedentesVinculadosMap.get(v.pessoa_id) || 0) + 1);
        });

        // Buscar vinculações com sacados
        const { data: sacadosVinculadosData } = await supabase
          .from('pessoas_fisicas_sacados')
          .select('pessoa_id')
          .in('pessoa_id', pessoasIds)
          .eq('ativo', true);
        
        (sacadosVinculadosData || []).forEach((v: any) => {
          sacadosVinculadosMap.set(v.pessoa_id, (sacadosVinculadosMap.get(v.pessoa_id) || 0) + 1);
        });
      }

      // Contar QSA por CPF
      const qsaCedentesPorCpf = new Map<string, number>();
      const qsaSacadosPorCpf = new Map<string, number>();
      
      (qsaCedentes || []).forEach((qsa: any) => {
        const cpfLimpo = qsa.cpf?.replace(/\D+/g, '');
        if (cpfLimpo && cpfLimpo.length === 11) {
          qsaCedentesPorCpf.set(cpfLimpo, (qsaCedentesPorCpf.get(cpfLimpo) || 0) + 1);
        }
      });

      (qsaSacados || []).forEach((qsa: any) => {
        const cpfLimpo = qsa.cpf?.replace(/\D+/g, '');
        if (cpfLimpo && cpfLimpo.length === 11) {
          qsaSacadosPorCpf.set(cpfLimpo, (qsaSacadosPorCpf.get(cpfLimpo) || 0) + 1);
        }
      });

      // Adicionar pessoas físicas cadastradas
      (pessoasFisicas || []).forEach((pf: PessoaFisica) => {
        const cpfLimpo = pf.cpf.replace(/\D+/g, '');
        if (cpfLimpo.length === 11) {
          pessoasMap.set(cpfLimpo, {
            ...pf,
            origem_tipo: 'Cadastro Direto',
            origem_nome: null,
            quantidade_familiares: familiaresMap.get(pf.id) || 0,
            quantidade_cedentes_vinculados: cedentesVinculadosMap.get(pf.id) || 0,
            quantidade_sacados_vinculados: sacadosVinculadosMap.get(pf.id) || 0,
            quantidade_qsa_cedentes: qsaCedentesPorCpf.get(cpfLimpo) || 0,
            quantidade_qsa_sacados: qsaSacadosPorCpf.get(cpfLimpo) || 0
          });
        }
      });

      // Adicionar pessoas do QSA (apenas se não existirem já cadastradas)
      // Processar todas as pessoas do QSA e agrupar por CPF
      const qsaPessoasMap = new Map<string, { nome: string; cedentes: string[]; sacados: string[] }>();

      (qsaCedentes || []).forEach((qsa: any) => {
        const cpfLimpo = qsa.cpf?.replace(/\D+/g, '');
        if (cpfLimpo && cpfLimpo.length === 11) {
          if (!qsaPessoasMap.has(cpfLimpo)) {
            qsaPessoasMap.set(cpfLimpo, {
              nome: qsa.nome || '',
              cedentes: [],
              sacados: []
            });
          }
          const cedentes = qsaCedentesMap.get(cpfLimpo) || [];
          qsaPessoasMap.get(cpfLimpo)!.cedentes = [...new Set([...qsaPessoasMap.get(cpfLimpo)!.cedentes, ...cedentes])];
        }
      });

      (qsaSacados || []).forEach((qsa: any) => {
        const cpfLimpo = qsa.cpf?.replace(/\D+/g, '');
        if (cpfLimpo && cpfLimpo.length === 11) {
          if (!qsaPessoasMap.has(cpfLimpo)) {
            qsaPessoasMap.set(cpfLimpo, {
              nome: qsa.nome || '',
              cedentes: [],
              sacados: []
            });
          }
          const sacados = qsaSacadosMap.get(cpfLimpo) || [];
          qsaPessoasMap.get(cpfLimpo)!.sacados = [...new Set([...qsaPessoasMap.get(cpfLimpo)!.sacados, ...sacados])];
          // Atualizar nome se for mais completo
          if (qsa.nome && qsa.nome.length > qsaPessoasMap.get(cpfLimpo)!.nome.length) {
            qsaPessoasMap.get(cpfLimpo)!.nome = qsa.nome;
          }
        }
      });

      // Adicionar pessoas do QSA ao mapa final
      qsaPessoasMap.forEach((dados, cpfLimpo) => {
        if (!pessoasMap.has(cpfLimpo)) {
          // Determinar tipo de origem e nome
          let origemTipo = '';
          let origemNome = '';
          
          if (dados.cedentes.length > 0 && dados.sacados.length > 0) {
            origemTipo = 'QSA Misto';
            origemNome = `Cedentes: ${dados.cedentes.join(', ')} | Sacados: ${dados.sacados.join(', ')}`;
          } else if (dados.cedentes.length > 0) {
            origemTipo = 'QSA Cedente';
            origemNome = dados.cedentes.join(', ');
          } else if (dados.sacados.length > 0) {
            origemTipo = 'QSA Sacado';
            origemNome = dados.sacados.join(', ');
          } else {
            origemTipo = 'QSA';
            origemNome = '';
          }
          
          pessoasMap.set(cpfLimpo, {
            id: `qsa_${cpfLimpo}`,
            cpf: cpfLimpo,
            nome: dados.nome,
            nome_mae: null,
            data_nascimento: null,
            rg: null,
            situacao: 'ativa',
            observacoes_gerais: null,
            origem: 'qsa',
            origem_tipo: origemTipo,
            origem_nome: origemNome || null,
            created_at: new Date().toISOString(),
            quantidade_familiares: 0,
            quantidade_cedentes_vinculados: 0,
            quantidade_sacados_vinculados: 0,
            quantidade_qsa_cedentes: qsaCedentesPorCpf.get(cpfLimpo) || 0,
            quantidade_qsa_sacados: qsaSacadosPorCpf.get(cpfLimpo) || 0
          });
        }
      });

      const todasPessoas = Array.from(pessoasMap.values()).sort((a, b) => 
        a.nome.localeCompare(b.nome)
      );

      setErr(null);
      setItems(todasPessoas);
      console.log(`Carregadas ${todasPessoas.length} pessoas (${pessoasFisicas?.length || 0} cadastradas + ${todasPessoas.length - (pessoasFisicas?.length || 0)} do QSA)`);
    } catch (err: any) {
      console.error('Erro ao carregar pessoas físicas:', err);
      setErr(`Erro inesperado: ${err.message || 'Erro desconhecido'}`);
      setItems([]);
    }
  }

  async function add() {
    if (!form.nome.trim()) {
      setErr('Nome é obrigatório');
      return;
    }
    if (!form.cpf.trim()) {
      setErr('CPF é obrigatório');
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
    if (!user) { setErr('Não autenticado'); setPending(false); return; }
    
    const { error } = await supabase.from('pessoas_fisicas').insert({
      user_id: user.id,
      cpf: cpfLimpo,
      nome: form.nome.trim(),
      nome_mae: form.nome_mae || null,
      data_nascimento: form.data_nascimento || null,
      rg: form.rg || null,
      situacao: form.situacao || 'ativa',
      observacoes_gerais: form.observacoes_gerais || null,
      origem: 'manual',
    });
    
    if (error) {
      if (error.code === '23505') {
        setErr('CPF já cadastrado');
      } else {
        setErr(error.message);
      }
    } else {
      setShowCreate(false);
      setForm({ cpf: '', nome: '', nome_mae: '', data_nascimento: '', rg: '', situacao: 'ativa', observacoes_gerais: '' });
      await load();
    }
    setPending(false);
  }

  async function remove(id: string) {
    // Se for pessoa do QSA (não cadastrada), não pode excluir
    if (id.startsWith('qsa_')) {
      showToast('Esta pessoa está apenas no QSA. Para excluir, remova do QSA do cedente/sacado.', 'warning');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir esta pessoa física?\n\nIsso também excluirá esta pessoa de todos os QSAs (cedentes e sacados) onde ela aparece.')) return;
    
    setPending(true);
    try {
      // Buscar CPF da pessoa antes de excluir
      const { data: pessoa } = await supabase
        .from('pessoas_fisicas')
        .select('cpf')
        .eq('id', id)
        .single();

      if (!pessoa) {
        showToast('Pessoa física não encontrada', 'error');
        setPending(false);
        return;
      }

      const cpfLimpo = pessoa.cpf.replace(/\D+/g, '');

      // Buscar e excluir do QSA de cedentes (CPF pode estar formatado ou não)
      const { data: qsaCedentes } = await supabase
        .from('cedentes_qsa')
        .select('id, cpf')
        .eq('ativo', true);
      
      if (qsaCedentes) {
        const idsParaExcluir = qsaCedentes
          .filter((qsa: any) => qsa.cpf && qsa.cpf.replace(/\D+/g, '') === cpfLimpo)
          .map((qsa: any) => qsa.id);
        
        if (idsParaExcluir.length > 0) {
          await supabase
            .from('cedentes_qsa')
            .update({ ativo: false })
            .in('id', idsParaExcluir);
        }
      }

      // Buscar e excluir do QSA de sacados (CPF pode estar formatado ou não)
      const { data: qsaSacados } = await supabase
        .from('sacados_qsa')
        .select('id, cpf')
        .eq('ativo', true);
      
      if (qsaSacados) {
        const idsParaExcluir = qsaSacados
          .filter((qsa: any) => qsa.cpf && qsa.cpf.replace(/\D+/g, '') === cpfLimpo)
          .map((qsa: any) => qsa.id);
        
        if (idsParaExcluir.length > 0) {
          await supabase
            .from('sacados_qsa')
            .update({ ativo: false })
            .in('id', idsParaExcluir);
        }
      }

      // Excluir vinculações diretas
      await supabase
        .from('pessoas_fisicas_cedentes')
        .update({ ativo: false })
        .eq('pessoa_id', id)
        .eq('ativo', true);

      await supabase
        .from('pessoas_fisicas_sacados')
        .update({ ativo: false })
        .eq('pessoa_id', id)
        .eq('ativo', true);

      // Excluir a pessoa física
      const { error } = await supabase
        .from('pessoas_fisicas')
        .update({ ativo: false })
        .eq('id', id);

      if (error) {
        showToast(error.message, 'error');
      } else {
        showToast('Pessoa física e todas as suas vinculações foram excluídas com sucesso!', 'success');
      }
    } catch (error: any) {
      console.error('Erro ao excluir pessoa física:', error);
      showToast(`Erro ao excluir: ${error.message || 'Erro desconhecido'}`, 'error');
    } finally {
      setPending(false);
      await load();
      setSelectedIds(new Set());
    }
  }

  async function removeSelected() {
    if (selectedIds.size === 0) {
      showToast('Selecione pelo menos uma pessoa física para excluir', 'warning');
      return;
    }

    // Filtrar apenas IDs de pessoas cadastradas (não do QSA)
    const idsArray = Array.from(selectedIds).filter(id => !id.startsWith('qsa_'));
    const qsaIds = Array.from(selectedIds).filter(id => id.startsWith('qsa_'));

    if (qsaIds.length > 0) {
      showToast(`${qsaIds.length} pessoa(s) selecionada(s) estão apenas no QSA e não podem ser excluídas aqui. Remova-as do QSA do cedente/sacado.`, 'warning');
    }

    if (idsArray.length === 0) {
      return;
    }

    const count = idsArray.length;
    if (!confirm(`Tem certeza que deseja excluir ${count} pessoa(s) física(s) selecionada(s)?\n\nIsso também excluirá essas pessoas de todos os QSAs (cedentes e sacados) onde elas aparecem.`)) return;

    setPending(true);
    try {
      // Buscar CPFs das pessoas antes de excluir
      const { data: pessoas } = await supabase
        .from('pessoas_fisicas')
        .select('id, cpf')
        .in('id', idsArray);

      if (!pessoas || pessoas.length === 0) {
        showToast('Nenhuma pessoa física encontrada', 'error');
        setPending(false);
        return;
      }

      const cpfsLimpos = pessoas.map(p => p.cpf.replace(/\D+/g, ''));

      // Buscar e excluir do QSA de cedentes (CPF pode estar formatado ou não)
      const { data: qsaCedentes } = await supabase
        .from('cedentes_qsa')
        .select('id, cpf')
        .eq('ativo', true);
      
      if (qsaCedentes) {
        const idsParaExcluir = qsaCedentes
          .filter((qsa: any) => {
            const cpfQsaLimpo = qsa.cpf?.replace(/\D+/g, '');
            return cpfQsaLimpo && cpfsLimpos.includes(cpfQsaLimpo);
          })
          .map((qsa: any) => qsa.id);
        
        if (idsParaExcluir.length > 0) {
          await supabase
            .from('cedentes_qsa')
            .update({ ativo: false })
            .in('id', idsParaExcluir);
        }
      }

      // Buscar e excluir do QSA de sacados (CPF pode estar formatado ou não)
      const { data: qsaSacados } = await supabase
        .from('sacados_qsa')
        .select('id, cpf')
        .eq('ativo', true);
      
      if (qsaSacados) {
        const idsParaExcluir = qsaSacados
          .filter((qsa: any) => {
            const cpfQsaLimpo = qsa.cpf?.replace(/\D+/g, '');
            return cpfQsaLimpo && cpfsLimpos.includes(cpfQsaLimpo);
          })
          .map((qsa: any) => qsa.id);
        
        if (idsParaExcluir.length > 0) {
          await supabase
            .from('sacados_qsa')
            .update({ ativo: false })
            .in('id', idsParaExcluir);
        }
      }

      // Excluir vinculações diretas
      await supabase
        .from('pessoas_fisicas_cedentes')
        .update({ ativo: false })
        .in('pessoa_id', idsArray)
        .eq('ativo', true);

      await supabase
        .from('pessoas_fisicas_sacados')
        .update({ ativo: false })
        .in('pessoa_id', idsArray)
        .eq('ativo', true);

      // Excluir as pessoas físicas
      const { error } = await supabase
        .from('pessoas_fisicas')
        .update({ ativo: false })
        .in('id', idsArray);

      if (error) {
        showToast(`Erro ao excluir: ${error.message}`, 'error');
      } else {
        showToast(`${count} pessoa(s) física(s) e todas as suas vinculações foram excluídas com sucesso!`, 'success');
        await load();
        setSelectedIds(new Set());
      }
    } catch (error: any) {
      console.error('Erro ao excluir pessoas físicas:', error);
      showToast(`Erro ao excluir: ${error.message || 'Erro desconhecido'}`, 'error');
    } finally {
      setPending(false);
    }
  }

  function toggleSelect(id: string) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(item => item.id)));
    }
  }

  const filtered = useMemo(() => {
    let result = items;
    
    if (filterSituacao !== 'all') {
      result = result.filter(item => item.situacao === filterSituacao);
    }
    
    if (filterOrigem !== 'all') {
      result = result.filter(item => {
        if (filterOrigem === 'cadastro_direto') {
          return item.origem_tipo === 'Cadastro Direto';
        } else if (filterOrigem === 'qsa_cedente') {
          return item.origem_tipo === 'QSA Cedente' || item.origem_tipo === 'QSA Misto';
        } else if (filterOrigem === 'qsa_sacado') {
          return item.origem_tipo === 'QSA Sacado' || item.origem_tipo === 'QSA Misto';
        }
        return true;
      });
    }
    
    if (q.trim()) {
      const query = q.trim().toLowerCase();
      result = result.filter(item => 
        item.nome.toLowerCase().includes(query) ||
        item.cpf.replace(/\D+/g, '').includes(query.replace(/\D+/g, '')) ||
        (item.nome_mae && item.nome_mae.toLowerCase().includes(query)) ||
        (item.origem_nome && item.origem_nome.toLowerCase().includes(query))
      );
    }
    
    return result.sort((a, b) => {
      const aVal = a[sortBy] || '';
      const bVal = b[sortBy] || '';
      if (sortDir === 'asc') {
        return String(aVal).localeCompare(String(bVal));
      } else {
        return String(bVal).localeCompare(String(aVal));
      }
    });
  }, [items, q, sortBy, sortDir, filterSituacao, filterOrigem]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container max-w-7xl mx-auto px-4 py-6 space-y-4">
        <PageHeader
          title="Pessoas Físicas"
          subtitle="Cadastro de pessoas físicas"
          backHref="/menu/operacional"
          className="mb-4"
        />

        {/* Toolbar */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-50 px-4 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-700 uppercase mb-1">Filtros e Ações</h2>
                <p className="text-xs text-gray-500">
                  {filtered.length} de {items.length} pessoa(s) física(s)
                  {filterOrigem !== 'all' || filterSituacao !== 'all' || q.trim() ? ' (filtradas)' : ''}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {selectedIds.size > 0 && (
                  <Button 
                    variant="error" 
                    onClick={removeSelected}
                    disabled={pending}
                    className="text-xs"
                  >
                    Excluir Selecionadas ({selectedIds.size})
                  </Button>
                )}
                <Button variant="primary" onClick={() => setShowCreate(true)} className="text-xs">
                  + Nova Pessoa Física
                </Button>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <Input
                  label="Buscar"
                  placeholder="Nome, CPF ou Nome da Mãe..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Origem</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filterOrigem}
                  onChange={(e) => setFilterOrigem(e.target.value)}
                >
                  <option value="all">Todas as origens</option>
                  <option value="cadastro_direto">Cadastro Direto</option>
                  <option value="qsa_cedente">QSA Cedente</option>
                  <option value="qsa_sacado">QSA Sacado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Situação</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filterSituacao}
                  onChange={(e) => setFilterSituacao(e.target.value)}
                >
                  <option value="all">Todas</option>
                  <option value="ativa">Ativa</option>
                  <option value="inativa">Inativa</option>
                  <option value="falecida">Falecida</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button
                className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-md transition-colors"
                onClick={() => {
                  setQ('');
                  setFilterSituacao('all');
                  setFilterOrigem('all');
                }}
              >
                Limpar Filtros
              </button>
              <div className="flex gap-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md transition-colors ${
                    viewMode === 'table' 
                      ? 'bg-blue-50 text-blue-700 border-blue-300' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  title="Visualização em tabela"
                >
                  Tabela
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-50 text-blue-700 border-blue-300' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  title="Visualização em grade"
                >
                  Grade
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 bg-gray-50 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-gray-700 uppercase">
                Lista de Pessoas Físicas
              </h2>
              {filtered.length > 0 && (
                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-[#0369a1] border-gray-300 rounded focus:ring-[#0369a1]"
                  />
                  <span>Selecionar todas</span>
                </label>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            {err && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                <p className="font-medium">Erro:</p>
                <p className="text-sm">{err}</p>
                {err.includes('não encontrada') && (
                  <p className="text-xs mt-2">
                    Execute o script <code className="bg-red-100 px-1 rounded">database_schema_pessoas_fisicas.sql</code> no Supabase SQL Editor.
                  </p>
                )}
              </div>
            )}
            {filtered.length === 0 && !err ? (
              <EmptyState
                title="Nenhuma pessoa física encontrada"
                description="Clique em '+ Nova Pessoa Física' para cadastrar"
                className="p-8"
              />
            ) : filtered.length === 0 && err ? null : viewMode === 'table' ? (
              <table className="w-full border-collapse">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase border-r border-gray-300 w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filtered.length && filtered.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-[#0369a1] border-gray-300 rounded focus:ring-[#0369a1]"
                      />
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">
                      <button onClick={() => { setSortBy('nome'); setSortDir(sortBy === 'nome' && sortDir === 'asc' ? 'desc' : 'asc'); }}>
                        Nome {sortBy === 'nome' && (sortDir === 'asc' ? '↑' : '↓')}
                      </button>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">
                      <button onClick={() => { setSortBy('cpf'); setSortDir(sortBy === 'cpf' && sortDir === 'asc' ? 'desc' : 'asc'); }}>
                        CPF {sortBy === 'cpf' && (sortDir === 'asc' ? '↑' : '↓')}
                      </button>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Origem</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Cedente/Sacado</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Familiares</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Vinculações</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">QSA</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">
                      <button onClick={() => { setSortBy('situacao'); setSortDir(sortBy === 'situacao' && sortDir === 'asc' ? 'desc' : 'asc'); }}>
                        Situação {sortBy === 'situacao' && (sortDir === 'asc' ? '↑' : '↓')}
                      </button>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className={`hover:bg-gray-50 border-b border-gray-300 ${selectedIds.has(item.id) ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 py-2 text-center border-r border-gray-300">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className="w-4 h-4 text-[#0369a1] border-gray-300 rounded focus:ring-[#0369a1] cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 border-r border-gray-300">
                        <Link href={`/pessoas-fisicas/${encodeURIComponent(item.cpf)}`} className="text-[#0369a1] hover:underline font-medium">
                          {item.nome}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 border-r border-gray-300">
                        {formatCpfCnpj(item.cpf)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600 border-r border-gray-300">
                        {item.origem_tipo || (item.origem === 'manual' ? 'Cadastro Direto' : item.origem || '—')}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-300">
                        {item.origem_nome || '—'}
                      </td>
                      <td className="px-4 py-2 text-center border-r border-gray-300">
                        {item.quantidade_familiares && item.quantidade_familiares > 0 ? (
                          <Badge variant="info" size="sm">{item.quantidade_familiares}</Badge>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center border-r border-gray-300">
                        {(item.quantidade_cedentes_vinculados || 0) + (item.quantidade_sacados_vinculados || 0) > 0 ? (
                          <div className="flex flex-col gap-1 items-center">
                            {item.quantidade_cedentes_vinculados > 0 && (
                              <Badge variant="info" size="sm">C: {item.quantidade_cedentes_vinculados}</Badge>
                            )}
                            {item.quantidade_sacados_vinculados > 0 && (
                              <Badge variant="warning" size="sm">S: {item.quantidade_sacados_vinculados}</Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center border-r border-gray-300">
                        {(item.quantidade_qsa_cedentes || 0) + (item.quantidade_qsa_sacados || 0) > 0 ? (
                          <div className="flex flex-col gap-1 items-center">
                            {item.quantidade_qsa_cedentes > 0 && (
                              <Badge variant="success" size="sm">C: {item.quantidade_qsa_cedentes}</Badge>
                            )}
                            {item.quantidade_qsa_sacados > 0 && (
                              <Badge variant="success" size="sm">S: {item.quantidade_qsa_sacados}</Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 border-r border-gray-300">
                        <Badge variant={item.situacao === 'ativa' ? 'success' : item.situacao === 'falecida' ? 'error' : 'warning'}>
                          {item.situacao || 'ativa'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <Link href={`/pessoas-fisicas/${encodeURIComponent(item.cpf)}/editar`}>
                            <button className="px-2 py-1 border border-gray-300 bg-white hover:bg-gray-50 text-[#0369a1] text-xs font-medium">
                              Editar
                            </button>
                          </Link>
                          <button 
                            className="px-2 py-1 border border-gray-300 bg-white hover:bg-gray-50 text-red-600 text-xs font-medium"
                            onClick={() => remove(item.id)}
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((item) => (
                  <div key={item.id} className={`border border-gray-300 p-4 hover:bg-gray-50 ${selectedIds.has(item.id) ? 'bg-blue-50 border-blue-300' : ''}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className="w-4 h-4 text-[#0369a1] border-gray-300 rounded focus:ring-[#0369a1] cursor-pointer"
                        />
                        <Link href={`/pessoas-fisicas/${encodeURIComponent(item.cpf)}`} className="text-[#0369a1] hover:underline font-semibold">
                          {item.nome}
                        </Link>
                      </div>
                      <Badge variant={item.situacao === 'ativa' ? 'success' : item.situacao === 'falecida' ? 'error' : 'warning'}>
                        {item.situacao || 'ativa'}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p><strong>CPF:</strong> {formatCpfCnpj(item.cpf)}</p>
                      <p><strong>Origem:</strong> {item.origem_tipo || (item.origem === 'manual' ? 'Cadastro Direto' : item.origem || '—')}</p>
                      {item.origem_nome && <p><strong>Cedente/Sacado:</strong> {item.origem_nome}</p>}
                      <div className="flex gap-2 mt-2">
                        {item.quantidade_familiares > 0 && (
                          <Badge variant="info" size="sm">Familiares: {item.quantidade_familiares}</Badge>
                        )}
                        {(item.quantidade_cedentes_vinculados || 0) + (item.quantidade_sacados_vinculados || 0) > 0 && (
                          <Badge variant="warning" size="sm">
                            Vinculações: {(item.quantidade_cedentes_vinculados || 0) + (item.quantidade_sacados_vinculados || 0)}
                          </Badge>
                        )}
                        {(item.quantidade_qsa_cedentes || 0) + (item.quantidade_qsa_sacados || 0) > 0 && (
                          <Badge variant="success" size="sm">
                            QSA: {(item.quantidade_qsa_cedentes || 0) + (item.quantidade_qsa_sacados || 0)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {item.id.startsWith('qsa_') ? (
                        <>
                          <Badge variant="info" size="sm" className="flex-1">Apenas QSA</Badge>
                          <button 
                            className="px-2 py-1 border border-gray-300 bg-gray-100 text-gray-400 text-xs font-medium cursor-not-allowed"
                            disabled
                            title="Esta pessoa está apenas no QSA"
                          >
                            Editar
                          </button>
                          <button 
                            className="px-2 py-1 border border-gray-300 bg-gray-100 text-gray-400 text-xs font-medium cursor-not-allowed"
                            disabled
                            title="Esta pessoa está apenas no QSA"
                          >
                            Excluir
                          </button>
                        </>
                      ) : (
                        <>
                          <Link href={`/pessoas-fisicas/${encodeURIComponent(item.cpf)}/editar`} className="flex-1">
                            <button className="w-full px-2 py-1 border border-gray-300 bg-white hover:bg-gray-50 text-[#0369a1] text-xs font-medium">
                              Editar
                            </button>
                          </Link>
                          <button 
                            className="px-2 py-1 border border-gray-300 bg-white hover:bg-gray-50 text-red-600 text-xs font-medium"
                            onClick={() => remove(item.id)}
                          >
                            Excluir
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Criar */}
        {showCreate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white border border-gray-300 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="border-b border-gray-300 bg-gray-100 px-4 py-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 uppercase">Nova Pessoa Física</h2>
                <button onClick={() => { setShowCreate(false); setErr(null); }} className="text-gray-600 hover:text-gray-900">
                  ✕
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Input
                      label="CPF *"
                      placeholder="000.000.000-00"
                      value={form.cpf}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D+/g, '');
                        const formatted = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                        setForm({ ...form, cpf: formatted });
                      }}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      label="Nome *"
                      placeholder="Nome completo"
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    />
                  </div>
                  <Input
                    label="Nome da Mãe"
                    placeholder="Nome completo da mãe"
                    value={form.nome_mae}
                    onChange={(e) => setForm({ ...form, nome_mae: e.target.value })}
                  />
                  <Input
                    label="RG"
                    placeholder="RG"
                    value={form.rg}
                    onChange={(e) => setForm({ ...form, rg: e.target.value })}
                  />
                  <Input
                    label="Data de Nascimento"
                    type="date"
                    value={form.data_nascimento}
                    onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
                  />
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Situação</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                      value={form.situacao}
                      onChange={(e) => setForm({ ...form, situacao: e.target.value })}
                    >
                      <option value="ativa">Ativa</option>
                      <option value="inativa">Inativa</option>
                      <option value="falecida">Falecida</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Observações Gerais</label>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                      rows={3}
                      value={form.observacoes_gerais}
                      onChange={(e) => setForm({ ...form, observacoes_gerais: e.target.value })}
                    />
                  </div>
                </div>
                {err && <p className="text-xs text-red-600">{err}</p>}
                <div className="flex gap-2 justify-end">
                  <button 
                    className="px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium"
                    onClick={() => { setShowCreate(false); setErr(null); setForm({ cpf: '', nome: '', nome_mae: '', data_nascimento: '', rg: '', situacao: 'ativa', observacoes_gerais: '' }); }}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="px-3 py-1.5 bg-[#0369a1] hover:bg-[#075985] text-white text-sm font-medium disabled:opacity-50"
                    onClick={add}
                    disabled={pending}
                  >
                    {pending ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

