'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
      router.push('/dashboard'); // pós-login
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro inesperado';
      setError(msg);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm card p-6 space-y-4">
        <h1 className="text-xl font-semibold text-center">
          {mode === 'login' ? 'Entrar' : 'Criar conta'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="block text-sm muted">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input"
              placeholder="voce@empresa.com"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm muted">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input"
              placeholder="********"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary w-full"
          >
            {pending
              ? (mode === 'login' ? 'Entrando...' : 'Criando...')
              : (mode === 'login' ? 'Entrar' : 'Criar conta')}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="btn btn-ghost w-full h-9 text-sm"
        >
          {mode === 'login'
            ? 'Não tem conta? Criar conta'
            : 'Já tem conta? Entrar'}
        </button>
      </div>
    </main>
  );
}
