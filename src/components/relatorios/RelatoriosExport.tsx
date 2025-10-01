'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

type RelatorioData = {
  atividades: any[];
  sacados: any[];
  cedentes: any[];
  resumo: {
    totalAtividades: number;
    totalSacados: number;
    totalCedentes: number;
    atividadesPorTipo: Record<string, number>;
  };
};

type Filtros = {
  dataInicio: string;
  dataFim: string;
  tipoAtividade: string;
  usuario: string;
  status: string;
};

export default function RelatoriosExport() {
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>({
    dataInicio: '',
    dataFim: '',
    tipoAtividade: '',
    usuario: '',
    status: ''
  });

  const tiposAtividade = [
    { value: '', label: 'Todos os tipos' },
    { value: 'ligacao', label: 'Ligação' },
    { value: 'email', label: 'Email' },
    { value: 'reuniao', label: 'Reunião' },
    { value: 'observacao', label: 'Observação' },
    { value: 'lembrete', label: 'Lembrete' },
    { value: 'documento', label: 'Documento' },
    { value: 'negociacao', label: 'Negociação' }
  ];

  async function carregarDados(): Promise<RelatorioData> {
    setLoading(true);
    
    try {
      // Carregar atividades de sacados
      const { data: atividadesSacados } = await supabase
        .from('sacados_atividades')
        .select(`
          *,
          sacado:sacado_cnpj (
            razao_social,
            nome_fantasia
          ),
          usuario:user_id (
            email
          )
        `)
        .gte('data_hora', filtros.dataInicio || '1900-01-01')
        .lte('data_hora', filtros.dataFim || '2100-12-31')
        .order('data_hora', { ascending: false });

      // Carregar atividades de cedentes
      const { data: atividadesCedentes } = await supabase
        .from('cedentes_atividades')
        .select(`
          *,
          cedente:cedente_id (
            nome,
            razao_social
          ),
          usuario:user_id (
            email
          )
        `)
        .gte('data_hora', filtros.dataInicio || '1900-01-01')
        .lte('data_hora', filtros.dataFim || '2100-12-31')
        .order('data_hora', { ascending: false });

      // Carregar sacados
      const { data: sacados } = await supabase
        .from('sacados')
        .select('*')
        .order('razao_social');

      // Carregar cedentes
      const { data: cedentes } = await supabase
        .from('cedentes')
        .select('*')
        .order('nome');

      // Combinar todas as atividades
      const todasAtividades = [
        ...(atividadesSacados || []).map(a => ({ ...a, tipo_cliente: 'sacado' })),
        ...(atividadesCedentes || []).map(a => ({ ...a, tipo_cliente: 'cedente' }))
      ];

      // Aplicar filtros adicionais
      let atividadesFiltradas = todasAtividades;
      
      if (filtros.tipoAtividade) {
        atividadesFiltradas = atividadesFiltradas.filter(a => a.tipo === filtros.tipoAtividade);
      }

      if (filtros.status) {
        atividadesFiltradas = atividadesFiltradas.filter(a => a.status === filtros.status);
      }

      // Calcular resumo
      const atividadesPorTipo = atividadesFiltradas.reduce((acc, atividade) => {
        acc[atividade.tipo] = (acc[atividade.tipo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const resumo = {
        totalAtividades: atividadesFiltradas.length,
        totalSacados: sacados?.length || 0,
        totalCedentes: cedentes?.length || 0,
        atividadesPorTipo
      };

      return {
        atividades: atividadesFiltradas,
        sacados: sacados || [],
        cedentes: cedentes || [],
        resumo
      };
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  function formatarData(data: string) {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async function exportarPDF() {
    try {
      const dados = await carregarDados();
      
      const doc = new jsPDF();
      
      // Cabeçalho
      doc.setFontSize(20);
      doc.text('REVERSA - RELATÓRIO DE ATIVIDADES', 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Período: ${filtros.dataInicio || 'Início'} a ${filtros.dataFim || 'Fim'}`, 20, 30);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 35);
      
      // Resumo
      doc.setFontSize(14);
      doc.text('RESUMO EXECUTIVO', 20, 50);
      
      doc.setFontSize(10);
      doc.text(`Total de Atividades: ${dados.resumo.totalAtividades}`, 20, 60);
      doc.text(`Total de Sacados: ${dados.resumo.totalSacados}`, 20, 65);
      doc.text(`Total de Cedentes: ${dados.resumo.totalCedentes}`, 20, 70);
      
      // Atividades por tipo
      let y = 80;
      doc.setFontSize(12);
      doc.text('ATIVIDADES POR TIPO:', 20, y);
      y += 10;
      
      Object.entries(dados.resumo.atividadesPorTipo).forEach(([tipo, quantidade]) => {
        doc.setFontSize(10);
        doc.text(`${tipo.toUpperCase()}: ${quantidade}`, 30, y);
        y += 5;
      });
      
      // Lista de atividades
      y += 10;
      doc.setFontSize(12);
      doc.text('DETALHAMENTO DAS ATIVIDADES', 20, y);
      y += 10;
      
      doc.setFontSize(8);
      let pageHeight = doc.internal.pageSize.height;
      
      dados.atividades.forEach((atividade, index) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }
        
        const cliente = atividade.tipo_cliente === 'sacado' 
          ? atividade.sacado?.razao_social || atividade.sacado?.nome_fantasia
          : atividade.cedente?.nome || atividade.cedente?.razao_social;
          
        doc.text(`${index + 1}. ${atividade.tipo.toUpperCase()}`, 20, y);
        doc.text(`Cliente: ${cliente}`, 30, y + 5);
        doc.text(`Data: ${formatarData(atividade.data_hora)}`, 30, y + 10);
        doc.text(`Usuário: ${atividade.usuario?.email || 'N/A'}`, 30, y + 15);
        doc.text(`Descrição: ${atividade.descricao}`, 30, y + 20);
        
        if (atividade.proxima_acao) {
          doc.text(`Próxima Ação: ${atividade.proxima_acao}`, 30, y + 25);
          y += 30;
        } else {
          y += 25;
        }
        
        y += 5;
      });
      
      // Salvar PDF
      const nomeArquivo = `reversa-relatorio-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(nomeArquivo);
      
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao gerar relatório PDF');
    }
  }

  async function exportarExcel() {
    try {
      const dados = await carregarDados();
      
      // Criar workbook
      const wb = XLSX.utils.book_new();
      
      // Planilha de Atividades
      const atividadesFormatadas = dados.atividades.map((atividade, index) => ({
        'Nº': index + 1,
        'Tipo': atividade.tipo.toUpperCase(),
        'Cliente': atividade.tipo_cliente === 'sacado' 
          ? atividade.sacado?.razao_social || atividade.sacado?.nome_fantasia
          : atividade.cedente?.nome || atividade.cedente?.razao_social,
        'Data/Hora': formatarData(atividade.data_hora),
        'Usuário': atividade.usuario?.email || 'N/A',
        'Descrição': atividade.descricao,
        'Próxima Ação': atividade.proxima_acao || '',
        'Status': atividade.status.toUpperCase(),
        'Observações': atividade.observacoes || ''
      }));
      
      const wsAtividades = XLSX.utils.json_to_sheet(atividadesFormatadas);
      XLSX.utils.book_append_sheet(wb, wsAtividades, 'Atividades');
      
      // Planilha de Resumo
      const resumoData = [
        ['MÉTRICA', 'VALOR'],
        ['Total de Atividades', dados.resumo.totalAtividades],
        ['Total de Sacados', dados.resumo.totalSacados],
        ['Total de Cedentes', dados.resumo.totalCedentes],
        [''],
        ['ATIVIDADES POR TIPO', ''],
        ...Object.entries(dados.resumo.atividadesPorTipo).map(([tipo, quantidade]) => 
          [tipo.toUpperCase(), quantidade]
        )
      ];
      
      const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
      XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');
      
      // Planilha de Sacados
      const sacadosFormatados = dados.sacados.map(sacado => ({
        'CNPJ': sacado.cnpj,
        'Razão Social': sacado.razao_social,
        'Nome Fantasia': sacado.nome_fantasia,
        'Situação': sacado.situacao,
        'Porte': sacado.porte,
        'Natureza Jurídica': sacado.natureza_juridica,
        'Data Abertura': sacado.data_abertura,
        'Capital Social': sacado.capital_social,
        'Atividade Principal': sacado.atividade_principal_descricao
      }));
      
      const wsSacados = XLSX.utils.json_to_sheet(sacadosFormatados);
      XLSX.utils.book_append_sheet(wb, wsSacados, 'Sacados');
      
      // Salvar Excel
      const nomeArquivo = `reversa-relatorio-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, nomeArquivo);
      
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      alert('Erro ao gerar relatório Excel');
    }
  }

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-[#0369a1] mb-4">
          📊 Relatórios de Atividades
        </h2>
        
        {/* Filtros */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          <div>
            <label className="block text-sm font-medium text-[#64748b] mb-1">
              Data Início
            </label>
            <input
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
              className="w-full p-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#64748b] mb-1">
              Data Fim
            </label>
            <input
              type="date"
              value={filtros.dataFim}
              onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
              className="w-full p-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#64748b] mb-1">
              Tipo de Atividade
            </label>
            <select
              value={filtros.tipoAtividade}
              onChange={(e) => setFiltros({ ...filtros, tipoAtividade: e.target.value })}
              className="w-full p-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1]"
            >
              {tiposAtividade.map(tipo => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Botões de Exportação */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            onClick={exportarPDF}
            loading={loading}
            className="flex items-center gap-2"
          >
            📄 Exportar PDF
          </Button>
          
          <Button
            variant="secondary"
            onClick={exportarExcel}
            loading={loading}
            className="flex items-center gap-2"
          >
            📊 Exportar Excel
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setFiltros({
              dataInicio: '',
              dataFim: '',
              tipoAtividade: '',
              usuario: '',
              status: ''
            })}
          >
            🔄 Limpar Filtros
          </Button>
        </div>
        
        {/* Informações */}
        <div className="mt-6 p-4 bg-[#f0f7ff] rounded-lg">
          <h3 className="font-semibold text-[#0369a1] mb-2">📋 Relatórios Disponíveis:</h3>
          <ul className="text-sm text-[#64748b] space-y-1">
            <li>• <strong>PDF:</strong> Relatório executivo com resumo e detalhamento</li>
            <li>• <strong>Excel:</strong> Planilhas com dados completos (Atividades, Resumo, Sacados)</li>
            <li>• <strong>Filtros:</strong> Por período, tipo de atividade e status</li>
            <li>• <strong>Dados:</strong> Todas as atividades, sacados e cedentes cadastrados</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
