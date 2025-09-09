'use client';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function SettingsPage() {
  return (
    <main className="min-h-screen p-6">
      <div className="container max-w-4xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-slate-800 bg-clip-text text-transparent">Configurações</h1>
          <p className="text-slate-600">Configurações do sistema</p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-800">Financeiro</h2>
              <p className="text-slate-600">Configurações relacionadas ao fluxo de caixa</p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  Contas
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Categorias
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Meios de Pagamento
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-800">Sistema</h2>
              <p className="text-slate-600">Configurações gerais do sistema</p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  Perfil do Usuário
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Backup de Dados
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Sobre o Sistema
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}