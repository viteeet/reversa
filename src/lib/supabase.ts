// lib/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const isBrowser = typeof window !== 'undefined';

// Evita erro no build/prerender: só cria o client no browser
export const supabase: SupabaseClient = isBrowser
  ? (() => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !anon) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY não configurados');
      }
      return createClient(url, anon);
    })()
  : ({} as unknown as SupabaseClient);
