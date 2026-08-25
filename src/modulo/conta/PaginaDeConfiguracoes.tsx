/**
 * Tela de configurações (/configuracoes): dados da conta, tema claro/escuro,
 * histórico de insights e o botão de sair.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Moon, Sun, LogOut, Sparkles } from 'lucide-react'
import { Cartao } from '@/compartilhado/componente/Cartao'
import { Botao } from '@/compartilhado/componente/Botao'
import { useAutenticacao } from '@/compartilhado/gancho/useAutenticacao'
import { useTema } from '@/compartilhado/gancho/useTema'
import { ServicoDeInsights } from '@/compartilhado/fonte/fonteDeDados'
import type { Insight } from '@/compartilhado/tipo/banco'

export function PaginaDeConfiguracoes() {
  const { usuario, sair } = useAutenticacao()
  const { theme, toggleTheme } = useTema()
  const navigate = useNavigate()
  const [insights, setInsights] = useState<Insight[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    ServicoDeInsights.listarInsights(5)
      .then(setInsights)
      .catch((err: any) => setError(err.message || 'Erro ao carregar insights'))
  }, [])

  const handleSignOut = async () => {
    await sair()
    navigate('/entrar')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Conta, aparência e histórico</p>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2">{error}</p>
      )}

      <Cartao title="Conta">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
            <p className="font-medium text-gray-900 dark:text-white truncate">{usuario?.email}</p>
          </div>
          <Botao variant="danger" icon={<LogOut size={16} />} onClick={handleSignOut}>
            Sair
          </Botao>
        </div>
      </Cartao>

      <Cartao title="Aparência">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Tema</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {theme === 'dark' ? 'Escuro' : 'Claro'}
            </p>
          </div>
          <Botao
            variant="secondary"
            icon={theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            onClick={toggleTheme}
          >
            Alternar
          </Botao>
        </div>
      </Cartao>

      <Cartao title="Últimos insights" subtitle="Resumos gerados no dashboard">
        {insights.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhum insight gerado ainda. Use o botão <Sparkles size={12} className="inline" /> Gerar no
            dashboard.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {insights.map(item => (
              <li key={item.id} className="py-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(item.generated_at).toLocaleString('pt-BR')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </div>
  )
}
