import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Endpoint para executar SQL da tabela bigdata_consultas
// Nota: Supabase não permite executar DDL via API REST diretamente
// Este endpoint tenta criar a tabela usando métodos alternativos

export async function POST(request: NextRequest) {
  try {
    const { sql } = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        sucesso: false,
        mensagem: 'Variáveis de ambiente do Supabase não configuradas',
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Tenta verificar se a tabela já existe
    const { data: tabelaExiste, error: erroVerificacao } = await supabase
      .from('bigdata_consultas')
      .select('id')
      .limit(1);

    if (tabelaExiste !== null && !erroVerificacao) {
      return NextResponse.json({
        sucesso: true,
        mensagem: 'Tabela bigdata_consultas já existe! A trava de segurança está ativa.',
      });
    }

    // Se a tabela não existe, tenta criar usando uma abordagem alternativa
    // Infelizmente, o Supabase não permite executar DDL via PostgREST
    // Vamos tentar criar a tabela usando uma função RPC (se existir)
    
    // Primeiro, tenta criar via função RPC exec_sql (se o usuário tiver criado)
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', {
        sql_query: sql,
      });

      if (!rpcError && rpcData) {
        return NextResponse.json({
          sucesso: true,
          mensagem: 'Tabela criada com sucesso via RPC!',
        });
      }
    } catch (rpcErr) {
      // RPC não disponível, continua com método alternativo
    }

    // Método alternativo: tenta criar a tabela usando INSERT (não funciona para DDL)
    // Como não podemos executar DDL via API, retornamos instruções

    return NextResponse.json({
      sucesso: false,
      mensagem: 'Não é possível executar DDL (CREATE TABLE) via API REST do Supabase por questões de segurança.',
      instrucoes: [
        '1. Acesse o Supabase Dashboard',
        '2. Vá em SQL Editor',
        '3. Cole e execute o script SQL manualmente',
      ],
      sql: sql,
    });

  } catch (error: any) {
    return NextResponse.json({
      sucesso: false,
      mensagem: `Erro: ${error.message}`,
    }, { status: 500 });
  }
}
