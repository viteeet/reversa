// lib/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const isBrowser = typeof window !== 'undefined';

// Evita erro no build/prerender: só cria o client no browser
export const supabase: SupabaseClient = isBrowser
  ? (() => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      // Verifica se as credenciais estão configuradas corretamente
      if (!url || !anon || url.includes('your-') || anon.includes('your-')) {
        console.error('⚠️ Supabase não configurado! Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local');
        console.error('📖 Veja as instruções em CONFIGURAR_SUPABASE.md');
        
        // Retorna um mock client que não faz nada para evitar crash durante desenvolvimento
        return {
          auth: {
            getUser: async () => ({ data: { user: null }, error: null }),
            signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase não configurado' } }),
            signOut: async () => ({ error: null })
          },
          from: () => ({
            select: () => ({ data: [], error: null }),
            insert: () => ({ data: null, error: { message: 'Supabase não configurado' } }),
            update: () => ({ data: null, error: { message: 'Supabase não configurado' } }),
            delete: () => ({ data: null, error: { message: 'Supabase não configurado' } }),
            eq: function() { return this; },
            single: () => ({ data: null, error: null }),
            order: function() { return this; }
          })
        } as unknown as SupabaseClient;
      }
      
      return createClient(url, anon);
    })()
  : ({} as unknown as SupabaseClient);
