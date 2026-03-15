'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/ui/PageHeader';

export default function ConfigurarBigDataPage() {
  const [accessToken, setAccessToken] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [testando, setTestando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [configurado, setConfigurado] = useState(false);

  useEffect(() => {
    verificarConfiguracao();
  }, []);

  async function verificarConfiguracao() {
    try {
      const res = await fetch('/api/bigdata/test');
      const data = await res.json();
      setConfigurado(data.configurada || false);
      if (data.configurada) {
        setResultado({
          status: 200,
          ok: true,
          configurada: true,
          mensagem: 'API BigData está configurada e funcionando!'
        });
      }
    } catch (error) {
      // Ignora erro
    }
  }

  async function testarConfiguracao() {
    setTestando(true);
    setResultado(null);
    
    try {
      const res = await fetch('/api/bigdata/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: accessToken || undefined,
          tokenId: tokenId || undefined,
        }),
      });
      const data = await res.json();
      setResultado({
        status: res.status,
        ok: res.ok,
        ...data
      });
      if (res.ok && data.configurada) {
        setConfigurado(true);
      }
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

  async function salvarConfiguracao() {
    setSalvando(true);
    
    try {
      // Nota: Em produção, isso deveria ser feito via API que salva no banco
      // Por enquanto, vamos apenas mostrar as instruções
      alert(`Para configurar o token do BigData, você precisa:

1. Abrir o arquivo .env.local na raiz do projeto
2. Adicionar ou atualizar as seguintes linhas:

BIGDATA_ACCESS_TOKEN=${accessToken || 'seu_token_aqui'}
BIGDATA_TOKEN_ID=${tokenId || 'seu_token_id_aqui'}

3. Reiniciar o servidor Next.js (Ctrl+C e depois npm run dev)

⚠️ IMPORTANTE: O arquivo .env.local não deve ser commitado no Git por questões de segurança!`);
    } catch (error: any) {
      alert('Erro: ' + error.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        <PageHeader
          title="Configurar API BigData"
          subtitle="Configure suas credenciais da API BigData Corp"
          backHref="/settings"
        />

        {/* Status Atual */}
        <Card>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Status da Configuração</h2>
            
            {configurado ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="font-semibold text-green-900">API BigData Configurada!</p>
                    <p className="text-sm text-green-800">A API está funcionando corretamente.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="font-semibold text-yellow-900">API BigData Não Configurada</p>
                    <p className="text-sm text-yellow-800">Configure as credenciais abaixo para usar a API.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Formulário de Configuração */}
        <Card>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Configurar Credenciais</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Token
                </label>
                <Input
                  type="text"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Cole aqui o Access Token da BigData"
                  className="font-mono text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Token de acesso fornecido pela BigData Corp
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Token ID
                </label>
                <Input
                  type="text"
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  placeholder="Cole aqui o Token ID da BigData"
                  className="font-mono text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  ID do token fornecido pela BigData Corp
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={testarConfiguracao}
                  loading={testando}
                  disabled={testando || (!accessToken && !tokenId)}
                >
                  {testando ? 'Testando...' : 'Testar Configuração'}
                </Button>
                
                <Button
                  variant="secondary"
                  onClick={salvarConfiguracao}
                  disabled={salvando}
                >
                  Ver Instruções para Salvar
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Resultado do Teste */}
        {resultado && (
          <Card>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Resultado do Teste</h2>
              
              {resultado.ok && resultado.configurada ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="font-semibold text-green-900">Sucesso</p>
                  <p className="text-sm text-green-800 mt-1">{resultado.mensagem || 'API configurada corretamente'}</p>
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-semibold text-red-900">Erro</p>
                  <p className="text-sm text-red-800 mt-1">
                    {resultado.mensagem || resultado.erro || 'Não foi possível conectar com a API'}
                  </p>
                  {resultado.erro && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-red-700">Detalhes técnicos</summary>
                      <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto">
                        {JSON.stringify(resultado, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {!resultado.configurada && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">📝 Como Configurar</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                    <li>Crie ou edite o arquivo <code className="bg-white px-1 rounded">.env.local</code> na raiz do projeto</li>
                    <li>Adicione as seguintes variáveis:
                      <pre className="mt-2 p-2 bg-white rounded text-xs">
{`BIGDATA_ACCESS_TOKEN=${accessToken || 'seu_token_aqui'}
BIGDATA_TOKEN_ID=${tokenId || 'seu_token_id_aqui'}`}
                      </pre>
                    </li>
                    <li>Reinicie o servidor Next.js (Ctrl+C e depois <code className="bg-white px-1 rounded">npm run dev</code>)</li>
                    <li>Teste novamente clicando no botão "Testar Configuração"</li>
                  </ol>
                  
                  <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded">
                    <p className="text-xs font-semibold text-yellow-900">IMPORTANTE:</p>
                    <p className="text-xs text-yellow-800 mt-1">
                      O arquivo <code className="bg-white px-1 rounded">.env.local</code> não deve ser commitado no Git por questões de segurança!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Informações Adicionais */}
        <Card>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Informações</h2>
            
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <p className="font-semibold mb-1">Como obter as credenciais:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Acesse a plataforma BigData Corp</li>
                  <li>Vá em "API Tokens" ou "Gerar Token"</li>
                  <li>Copie o <strong>Access Token</strong> e o <strong>Token ID</strong></li>
                  <li>Cole nos campos acima</li>
                </ol>
              </div>

              <div>
                <p className="font-semibold mb-1">Links úteis:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    <a 
                      href="https://docs.bigdatacorp.com.br/plataforma/reference/api-tokens-gerar" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Gerar Token BigData
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://docs.bigdatacorp.com.br/plataforma/reference/api-de-views" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Documentação da API
                    </a>
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-gray-100 rounded">
                <p className="font-semibold text-gray-900 mb-1">Dica:</p>
                <p className="text-xs text-gray-700">
                  Após configurar, você pode testar a API na página de teste ou usar diretamente nas páginas de edição de sacados/cedentes.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
