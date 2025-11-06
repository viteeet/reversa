import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API Route para atualizar o schema do Supabase
 * 
 * IMPORTANTE: Esta rota requer autenticação via token no header
 * Para usar: adicione no header: Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}
 * 
 * Ou configure uma senha simples no .env.local: ADMIN_SCHEMA_UPDATE_PASSWORD
 */

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticação
    const authHeader = request.headers.get('authorization');
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    const adminPassword = process.env.ADMIN_SCHEMA_UPDATE_PASSWORD;

    // Verifica se tem service role key ou senha admin
    if (!serviceRoleKey && !adminPassword) {
      return NextResponse.json(
        { error: 'Service role key não configurada. Configure SUPABASE_SERVICE_ROLE_KEY no .env.local' },
        { status: 500 }
      );
    }

    // Se tiver senha admin, verifica
    if (adminPassword) {
      const providedPassword = authHeader?.replace('Bearer ', '');
      if (providedPassword !== adminPassword) {
        return NextResponse.json(
          { error: 'Não autorizado. Forneça a senha no header: Authorization: Bearer {senha}' },
          { status: 401 }
        );
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_SUPABASE_URL não configurado' },
        { status: 500 }
      );
    }

    // Cria cliente com service role key
    const supabase = createClient(supabaseUrl, serviceRoleKey || '', {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // SQL script para atualizar
    const sqlCommands = [
      // Adiciona colunas
      `DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cedentes_pessoas_ligadas' AND column_name = 'telefone') THEN
          ALTER TABLE cedentes_pessoas_ligadas ADD COLUMN telefone VARCHAR(20);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cedentes_pessoas_ligadas' AND column_name = 'email') THEN
          ALTER TABLE cedentes_pessoas_ligadas ADD COLUMN email VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cedentes_pessoas_ligadas' AND column_name = 'endereco') THEN
          ALTER TABLE cedentes_pessoas_ligadas ADD COLUMN endereco TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cedentes_pessoas_ligadas' AND column_name = 'cidade') THEN
          ALTER TABLE cedentes_pessoas_ligadas ADD COLUMN cidade VARCHAR(100);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cedentes_pessoas_ligadas' AND column_name = 'estado') THEN
          ALTER TABLE cedentes_pessoas_ligadas ADD COLUMN estado VARCHAR(2);
        END IF;
      END $$;`,
      
      // Comentários
      `COMMENT ON COLUMN cedentes_pessoas_ligadas.telefone IS 'Telefone de contato da pessoa ligada';`,
      `COMMENT ON COLUMN cedentes_pessoas_ligadas.email IS 'E-mail de contato da pessoa ligada';`,
      `COMMENT ON COLUMN cedentes_pessoas_ligadas.endereco IS 'Endereço completo da pessoa ligada';`,
      `COMMENT ON COLUMN cedentes_pessoas_ligadas.cidade IS 'Cidade do endereço';`,
      `COMMENT ON COLUMN cedentes_pessoas_ligadas.estado IS 'Estado (UF) do endereço';`,
      
      // Índices
      `CREATE INDEX IF NOT EXISTS idx_cedentes_pessoas_ligadas_telefone ON cedentes_pessoas_ligadas(telefone);`,
      `CREATE INDEX IF NOT EXISTS idx_cedentes_pessoas_ligadas_email ON cedentes_pessoas_ligadas(email);`,
      `CREATE INDEX IF NOT EXISTS idx_cedentes_pessoas_ligadas_cidade ON cedentes_pessoas_ligadas(cidade);`,
      `CREATE INDEX IF NOT EXISTS idx_cedentes_pessoas_ligadas_estado ON cedentes_pessoas_ligadas(estado);`,
    ];

    const results = [];
    const errors = [];

    // Infelizmente, o Supabase não permite executar DDL via PostgREST
    // Precisamos retornar o SQL para o usuário executar manualmente
    // OU criar uma função RPC no banco primeiro

    return NextResponse.json({
      success: false,
      message: 'O Supabase não permite executar DDL via API REST diretamente.',
      instruction: 'Execute o script SQL manualmente no Supabase Dashboard',
      sql: sqlCommands.join('\n\n'),
      file: 'database_update_pessoas_ligadas_add_campos.sql'
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

