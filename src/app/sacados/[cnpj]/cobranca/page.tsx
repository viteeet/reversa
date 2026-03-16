'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

type Sacado = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  situacao: string | null;
  porte: string | null;
  natureza_juridica: string | null;
  data_abertura: string | null;
  capital_social: number | null;
  atividade_principal_descricao: string | null;
  endereco_receita: string | null;
  telefone_receita: string | null;
  email_receita: string | null;
};

export default function CobrancaReportPage() {
  const router = useRouter();
  const params = useParams();
  const cnpj = decodeURIComponent(params.cnpj as string);
  
  const [sacado, setSacado] = useState<Sacado | null>(null);
  const [loading, setLoading] = useState(true);
  const [qsa, setQsa] = useState<any[]>([]);
  const [enderecos, setEnderecos] = useState<any[]>([]);
  const [telefones, setTelefones] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [pessoasLigadas, setPessoasLigadas] = useState<any[]>([]);
  const [empresasLigadas, setEmpresasLigadas] = useState<any[]>([]);
  const [processos, setProcessos] = useState<any[]>([]);
  const [foundData, setFoundData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [cnpj]);

  async function loadData() {
    setLoading(true);
    
    const { data: sacadoData } = await supabase
      .from('sacados')
      .select('*')
      .eq('cnpj', cnpj)
      .single();
    
    setSacado(sacadoData);

    // Carrega dados complementares
    const [qsaData, enderecosData, telefonesData, emailsData, pessoasData, empresasData, processosData, foundDataData] = await Promise.all([
      supabase.from('sacados_qsa').select('*').eq('sacado_cnpj', cnpj).eq('ativo', true),
      supabase.from('sacados_enderecos').select('*').eq('sacado_cnpj', cnpj).eq('ativo', true),
      supabase.from('sacados_telefones').select('*').eq('sacado_cnpj', cnpj).eq('ativo', true),
      supabase.from('sacados_emails').select('*').eq('sacado_cnpj', cnpj).eq('ativo', true),
      supabase.from('sacados_pessoas_ligadas').select('*').eq('sacado_cnpj', cnpj).eq('ativo', true),
      supabase.from('sacados_empresas_ligadas').select('*').eq('sacado_cnpj', cnpj).eq('ativo', true),
      supabase.from('sacados_processos').select('*').eq('sacado_cnpj', cnpj).eq('ativo', true),
      supabase.from('sacados_dados_encontrados').select('*').eq('sacado_cnpj', cnpj).eq('ativo', true).order('tipo', { ascending: true })
    ]);

    setQsa(qsaData.data || []);
    setEnderecos(enderecosData.data || []);
    setTelefones(telefonesData.data || []);
    setEmails(emailsData.data || []);
    setPessoasLigadas(pessoasData.data || []);
    setEmpresasLigadas(empresasData.data || []);
    setProcessos(processosData.data || []);
    setFoundData(foundDataData.data || []);
    
    setLoading(false);
  }

  function printReport() {
    window.print();
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
            <Button variant="primary" onClick={() => {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back();
  } else {
    router.push(`/sacados/${encodeURIComponent(cnpj)}`);
  }
}} className="mt-4">
              Voltar
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="container max-w-4xl space-y-6">
        <header className="flex items-center justify-between print:hidden">
          <h1 className="text-2xl font-bold text-slate-800">Ficha de Cobrança</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/sacados/${encodeURIComponent(cnpj)}/editar?mode=edit`)}>
              Editar Dados
            </Button>
            <Button variant="secondary" onClick={() => {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back();
  } else {
    router.push(`/sacados/${encodeURIComponent(cnpj)}`);
  }
}}>
              Voltar
            </Button>
            <Button variant="primary" onClick={printReport}>
              Imprimir
            </Button>
          </div>
        </header>

        <Card className="print:shadow-none print:border-none">
          <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="text-center border-b pb-4">
              <h1 className="text-2xl font-bold text-slate-800">FICHA DE COBRANÇA</h1>
              <p className="text-sm text-slate-600">Relatório gerado em {new Date().toLocaleDateString('pt-BR')}</p>
            </div>

            {/* DEVEDOR */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 border-b">DEVEDOR</h2>
              
              <div className="grid gap-3">
                <div>
                  <span className="font-semibold">DEVEDOR:</span> {sacado.razao_social}
                </div>
                <div>
                  <span className="font-semibold">CNPJ:</span> {sacado.cnpj}
                </div>
                {sacado.nome_fantasia && (
                  <div>
                    <span className="font-semibold">NOME FANTASIA:</span> {sacado.nome_fantasia}
                  </div>
                )}
                <div>
                  <span className="font-semibold">ABERTURA:</span> {sacado.data_abertura || '—'}
                </div>
                <div>
                  <span className="font-semibold">ENDEREÇO RECEITA:</span> {sacado.endereco_receita || '—'}
                </div>
                <div>
                  <span className="font-semibold">TELEFONE RECEITA:</span> {sacado.telefone_receita || '—'}
                </div>
                <div>
                  <span className="font-semibold">E-MAIL RECEITA:</span> {sacado.email_receita || '—'}
                </div>
                <div>
                  <span className="font-semibold">SITUAÇÃO:</span> {sacado.situacao || '—'}
                </div>
                <div>
                  <span className="font-semibold">PORTE:</span> {sacado.porte || '—'}
                </div>
                <div>
                  <span className="font-semibold">NATUREZA JURÍDICA:</span> {sacado.natureza_juridica || '—'}
                </div>
                <div>
                  <span className="font-semibold">CAPITAL SOCIAL:</span> {
                    sacado.capital_social ? sacado.capital_social.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'
                  }
                </div>
                <div>
                  <span className="font-semibold">ATIVIDADE PRINCIPAL:</span> {sacado.atividade_principal_descricao || '—'}
                </div>
              </div>
            </div>

            {/* QSA */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 border-b">QSA (Quadro de Sócios e Administradores)</h2>
              {qsa.length === 0 ? (
                <div className="text-center py-4 text-slate-600">
                  <p>Nenhum sócio cadastrado</p>
                  <p className="text-sm">Clique em "Editar Dados" para adicionar ou buscar da API</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {qsa.map((socio, idx) => (
                    <div key={idx} className="border-b pb-2">
                      <div className="font-semibold text-slate-800">{socio.nome}</div>
                      <div className="grid gap-1 text-sm mt-1">
                        {socio.cpf && <div><span className="font-medium">CPF:</span> {socio.cpf}</div>}
                        {socio.qualificacao && <div><span className="font-medium">Qualificação:</span> {socio.qualificacao}</div>}
                        {socio.participacao && <div><span className="font-medium">Part.:</span> {socio.participacao}%</div>}
                        {socio.data_entrada && <div><span className="font-medium">Entrada:</span> {new Date(socio.data_entrada).toLocaleDateString('pt-BR')}</div>}
                        {socio.observacoes && (
                          <div className="mt-1 p-2 bg-slate-50 rounded text-xs">
                            <span className="font-medium">OBS:</span> {socio.observacoes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ENDEREÇOS ENCONTRADOS */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 border-b">ENDEREÇOS ENCONTRADOS</h2>
              {enderecos.length === 0 ? (
                <div className="text-center py-4 text-slate-600">
                  <p>Nenhum endereço adicional cadastrado</p>
                  <p className="text-sm">Clique em "Editar Dados" para adicionar ou buscar da API</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {enderecos.map((end, idx) => (
                    <div key={idx} className="border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{end.endereco}</span>
                        {end.principal && <Badge variant="success" size="sm">Principal</Badge>}
                        {end.tipo && <Badge variant="neutral" size="sm">{end.tipo}</Badge>}
                      </div>
                      {end.cep && <div className="text-sm text-slate-600">CEP: {end.cep}</div>}
                      {(end.cidade || end.estado) && (
                        <div className="text-sm text-slate-600">{[end.cidade, end.estado].filter(Boolean).join(' - ')}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TELEFONES ENCONTRADOS */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 border-b">TELEFONES ENCONTRADOS</h2>
              {telefones.length === 0 ? (
                <div className="text-center py-4 text-slate-600">
                  <p>Nenhum telefone adicional cadastrado</p>
                  <p className="text-sm">Clique em "Editar Dados" para adicionar ou buscar da API</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {telefones.map((tel, idx) => (
                    <div key={idx} className="flex items-center gap-2 border-b pb-1">
                      <span className="font-semibold">{tel.telefone}</span>
                      {tel.principal && <Badge variant="success" size="sm">Principal</Badge>}
                      {tel.tipo && <Badge variant="neutral" size="sm">{tel.tipo}</Badge>}
                      {tel.nome_contato && <span className="text-sm text-slate-600">- {tel.nome_contato}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* E-MAILS ENCONTRADOS */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 border-b">E-MAILS ENCONTRADOS</h2>
              {emails.length === 0 ? (
                <div className="text-center py-4 text-slate-600">
                  <p>Nenhum e-mail adicional cadastrado</p>
                  <p className="text-sm">Clique em "Editar Dados" para adicionar ou buscar da API</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {emails.map((em, idx) => (
                    <div key={idx} className="flex items-center gap-2 border-b pb-1">
                      <span className="font-semibold">{em.email}</span>
                      {em.principal && <Badge variant="success" size="sm">Principal</Badge>}
                      {em.tipo && <Badge variant="neutral" size="sm">{em.tipo}</Badge>}
                      {em.nome_contato && <span className="text-sm text-slate-600">- {em.nome_contato}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PESSOAS LIGADAS */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 border-b">PESSOAS LIGADAS</h2>
              {pessoasLigadas.length === 0 ? (
                <div className="text-center py-4 text-slate-600">
                  <p>Nenhuma pessoa ligada cadastrada</p>
                  <p className="text-sm">Clique em "Editar Dados" para adicionar ou buscar da API</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pessoasLigadas.map((pessoa, idx) => (
                    <div key={idx} className="grid gap-1 border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{pessoa.nome}</span>
                        {pessoa.tipo_relacionamento && <Badge variant="info" size="sm">{pessoa.tipo_relacionamento}</Badge>}
                      </div>
                      {pessoa.cpf && <div className="text-sm text-slate-600">CPF: {pessoa.cpf}</div>}
                      {pessoa.observacoes && <div className="text-sm text-slate-600">{pessoa.observacoes}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* EMPRESAS LIGADAS */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 border-b">EMPRESAS LIGADAS</h2>
              {empresasLigadas.length === 0 ? (
                <div className="text-center py-4 text-slate-600">
                  <p>Nenhuma empresa ligada cadastrada</p>
                  <p className="text-sm">Clique em "Editar Dados" para adicionar ou buscar da API</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {empresasLigadas.map((empresa, idx) => (
                    <div key={idx} className="grid gap-1 border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{empresa.razao_social}</span>
                        {empresa.tipo_relacionamento && <Badge variant="info" size="sm">{empresa.tipo_relacionamento}</Badge>}
                      </div>
                      <div className="text-sm text-slate-600">CNPJ: {empresa.cnpj_relacionado}</div>
                      {empresa.participacao && <div className="text-sm text-slate-600">Participação: {empresa.participacao}%</div>}
                      {empresa.observacoes && <div className="text-sm text-slate-600">{empresa.observacoes}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PROCESSOS */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 border-b">PROCESSOS JUDICIAIS</h2>
              {processos.length === 0 ? (
                <div className="text-center py-4 text-slate-600">
                  <p>Nenhum processo cadastrado</p>
                  <p className="text-sm">Clique em "Editar Dados" para adicionar ou buscar da API</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {processos.map((proc, idx) => (
                    <div key={idx} className="grid gap-1 border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{proc.numero_processo}</span>
                        {proc.tipo && <Badge variant="neutral" size="sm">{proc.tipo}</Badge>}
                        {proc.status && (
                          <Badge 
                            variant={proc.status === 'em_andamento' ? 'warning' : proc.status === 'julgado' ? 'success' : 'neutral'} 
                            size="sm"
                          >
                            {proc.status.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      {proc.tribunal && <div className="text-sm text-slate-600">Tribunal: {proc.tribunal}</div>}
                      {proc.vara && <div className="text-sm text-slate-600">Vara: {proc.vara}</div>}
                      {proc.data_distribuicao && (
                        <div className="text-sm text-slate-600">
                          Distribuição: {new Date(proc.data_distribuicao).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                      {proc.valor && (
                        <div className="text-sm text-slate-600">
                          Valor: {proc.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                      )}
                      {proc.observacoes && <div className="text-sm text-slate-600">{proc.observacoes}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dados Encontrados Manualmente */}
            {foundData.length > 0 && (
              <div className="border-t border-[#e2e8f0] pt-6 mt-6">
                <h3 className="text-xl font-semibold text-[#0369a1] mb-4">Dados Encontrados (Pesquisa Manual)</h3>
                <div className="space-y-4">
                  {['telefone', 'email', 'endereco', 'pessoa', 'empresa', 'processo', 'outros'].map(tipo => {
                    const itemsDoTipo = foundData.filter(item => item.tipo === tipo);
                    if (itemsDoTipo.length === 0) return null;

                    const tipoLabels: Record<string, string> = {
                      telefone: '📞 Telefones Encontrados',
                      email: '📧 Emails Encontrados',
                      endereco: '📍 Endereços Encontrados',
                      pessoa: '👤 Pessoas Relacionadas',
                      empresa: '🏢 Empresas Relacionadas',
                      processo: '⚖️ Processos Encontrados',
                      outros: '📝 Outras Informações'
                    };

                    return (
                      <div key={tipo} className="bg-[#f8fafc] rounded-lg p-4 border border-[#e2e8f0]">
                        <h4 className="font-semibold text-[#0369a1] mb-3">{tipoLabels[tipo]}</h4>
                        <div className="space-y-3">
                          {itemsDoTipo.map((item, idx) => (
                            <div key={idx} className="bg-white rounded p-3 border border-[#e2e8f0]">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-[#1e293b] text-sm">{item.titulo}</span>
                                    {item.fonte && <Badge variant="info" size="sm">{item.fonte}</Badge>}
                                  </div>
                                  <p className="text-sm text-[#64748b] break-words">{item.conteudo}</p>
                                  {item.observacoes && (
                                    <p className="text-xs text-[#94a3b8] mt-1 italic">Obs: {item.observacoes}</p>
                                  )}
                                  {item.data_encontrado && (
                                    <p className="text-xs text-[#94a3b8] mt-1">
                                      Encontrado em: {new Date(item.data_encontrado).toLocaleDateString('pt-BR')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
