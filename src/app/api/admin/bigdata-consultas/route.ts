import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase não configurado no servidor (faltando SUPABASE_SERVICE_ROLE_KEY).' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const searchParams = request.nextUrl.searchParams;

    const periodo = (searchParams.get('periodo') || 'mes') as 'hoje' | 'semana' | 'mes' | 'todos';
    const dataInicio = searchParams.get('dataInicio') || '';
    const dataFim = searchParams.get('dataFim') || '';
    const documento = (searchParams.get('documento') || '').replace(/\D/g, '');
    const tipo = searchParams.get('tipo') || '';
    const usuario = searchParams.get('usuario') || '';

    let query = supabase
      .from('bigdata_consultas')
      .select('*')
      .order('data_consulta', { ascending: false });

    if (periodo !== 'todos') {
      const agora = new Date();
      let inicioPeriodo: Date;

      switch (periodo) {
        case 'hoje':
          inicioPeriodo = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
          break;
        case 'semana':
          inicioPeriodo = new Date(agora);
          inicioPeriodo.setDate(agora.getDate() - 7);
          break;
        case 'mes':
        default:
          inicioPeriodo = new Date(agora);
          inicioPeriodo.setMonth(agora.getMonth() - 1);
          break;
      }

      query = query.gte('data_consulta', inicioPeriodo.toISOString());
    }

    if (dataInicio) {
      query = query.gte('data_consulta', new Date(dataInicio).toISOString());
    }

    if (dataFim) {
      const fim = new Date(dataFim);
      fim.setHours(23, 59, 59, 999);
      query = query.lte('data_consulta', fim.toISOString());
    }

    if (documento) {
      query = query.eq('documento', documento);
    }

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    if (usuario) {
      query = query.eq('user_id', usuario);
    }

    const { data, error } = await query.limit(10000);

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        return NextResponse.json({ data: [] });
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
