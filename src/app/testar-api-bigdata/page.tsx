'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function TestarAPIBigDataPage() {
  const [testando, setTestando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  async function testarAPI() {
    setTestando(true);
    setResultado(null);
    
    try {
      const res = await fetch('/api/bigdata/test');
      const data = await res.json();
      setResultado({
        status: res.status,
        ok: res.ok,
        ...data
      });
    } catch (error: any) {
      setResultado({
        status: 0,
        ok: false,
        erro: error.message,
        mensagem: 'Erro ao conectar com o servidor'
      });
    } finally {
      setTestando(false);
    }
  }

  return (
    <main className="min-h-screen p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#0369a1]">Teste de Configuração - API BigData</h1>
          <p className="text-[#64748b] mt-2">Verifica se a API BigData está configurada e funcionando</p>
        </div>

        <Card>
          <div className="space-y-4">
            <Button
              variant="primary"
              onClick={testarAPI}
              loading={testando}
              disabled={testando}
            >
              {testando ? 'Testando...' : 'Testar API BigData'}
            </Button>

            {resultado && (
              <div className="mt-6 space-y-4">
                <div className={`p-4 rounded-lg border-2 ${
                  resultado.ok && resultado.configurada && resultado.testeConexao?.sucesso
                    ? 'bg-green-50 border-green-500'
                    : resultado.configurada
                    ? 'bg-yellow-50 border-yellow-500'
                    : 'bg-red-50 border-red-500'
                }`}>
                  <h2 className="font-semibold text-lg mb-2">
                    {resultado.ok && resultado.configurada && resultado.testeConexao?.sucesso
                      ? '✅ API Configurada e Funcionando!'
                      : resultado.configurada
                      ? '⚠️ API Configurada, mas com Problemas'
                      : '❌ API Não Configurada'
                    }
                  </h2>
                  <p className="text-sm text-gray-700">{resultado.mensagem}</p>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded">
                    <h3 className="font-semibold mb-2">Status da Configuração</h3>
                    <ul className="space-y-1 text-sm">
                      <li>
                        <span className="font-medium">Configurada:</span>{' '}
                        <span className={resultado.configurada ? 'text-green-600' : 'text-red-600'}>
                          {resultado.configurada ? 'Sim' : 'Não'}
                        </span>
                      </li>
                      <li>
                        <span className="font-medium">Access Token:</span>{' '}
                        {resultado.accessToken?.definido ? (
                          <span className="text-green-600">
                            Definido ({resultado.accessToken.tamanho} caracteres)
                          </span>
                        ) : (
                          <span className="text-red-600">Não definido</span>
                        )}
                      </li>
                      <li>
                        <span className="font-medium">Token ID:</span>{' '}
                        {resultado.tokenId?.definido ? (
                          <span className="text-green-600">
                            Definido ({resultado.tokenId.valor})
                          </span>
                        ) : (
                          <span className="text-red-600">Não definido</span>
                        )}
                      </li>
                    </ul>
                  </div>

                  {resultado.testeConexao && (
                    <div className={`p-3 rounded ${
                      resultado.testeConexao.sucesso ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <h3 className="font-semibold mb-2">Teste de Conexão</h3>
                      <p className={`text-sm ${resultado.testeConexao.sucesso ? 'text-green-700' : 'text-red-700'}`}>
                        {resultado.testeConexao.mensagem}
                      </p>
                      {resultado.testeConexao.dados && (
                        <div className="mt-2 p-2 bg-white rounded text-xs font-mono">
                          <pre>{JSON.stringify(resultado.testeConexao.dados, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  )}

                  {resultado.erro && (
                    <div className="p-3 bg-red-50 rounded">
                      <h3 className="font-semibold text-red-700 mb-1">Erro</h3>
                      <p className="text-sm text-red-600">{resultado.erro}</p>
                    </div>
                  )}

                  {!resultado.configurada && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                      <h3 className="font-semibold text-blue-900 mb-2">Como Configurar</h3>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                        <li>Crie ou edite o arquivo <code className="bg-white px-1 rounded">.env.local</code> na raiz do projeto</li>
                        <li>Adicione as seguintes variáveis:
                          <pre className="mt-2 p-2 bg-white rounded text-xs">
{`BIGDATA_ACCESS_TOKEN=seu_token_aqui
BIGDATA_TOKEN_ID=seu_token_id_aqui`}
                          </pre>
                        </li>
                        <li>Reinicie o servidor Next.js</li>
                        <li>Teste novamente clicando no botão acima</li>
                      </ol>
                    </div>
                  )}
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900">
                    Ver detalhes técnicos (JSON)
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-96">
                    {JSON.stringify(resultado, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}

