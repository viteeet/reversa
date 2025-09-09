'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

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
      <Card className="w-full max-w-md p-8">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Reversa
            </h1>
            <h2 className="text-xl font-semibold text-slate-800">
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </h2>
            <p className="text-slate-600 text-sm">
              {mode === 'login' ? 'Acesse sua conta' : 'Crie uma nova conta'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
            />

            <Input
              label="Senha"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="********"
            />

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={pending}
              disabled={pending}
              className="w-full"
            >
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>

          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="w-full"
            >
              {mode === 'login'
                ? 'Não tem conta? Criar conta'
                : 'Já tem conta? Entrar'}
            </Button>
          </div>
        </div>
      </Card>
    </main>
  );
}
