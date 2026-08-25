/**
 * Faixa do topo: data de hoje, botão de tema claro/escuro, email do usuário
 * e o botão de sair. No celular, também o botão que abre o menu.
 */
import { Menu, Moon, Sun, LogOut } from 'lucide-react'
import { useAutenticacao } from '@/compartilhado/gancho/useAutenticacao'
import { useTema } from '@/compartilhado/gancho/useTema'
import { useNavigate } from 'react-router-dom'

export function Cabecalho({ onMenuClick }: { onMenuClick: () => void }) {
  const { usuario, sair } = useAutenticacao()
  const { theme, toggleTheme } = useTema()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await sair()
    navigate('/entrar')
  }

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-6 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      <div className="hidden lg:block text-sm text-gray-500 dark:text-gray-400">
        {new Date().toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long'
        })}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Alternar tema"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-300 max-w-[180px] truncate">
          {usuario?.email}
        </span>

        <button
          onClick={handleSignOut}
          className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-300 dark:hover:bg-red-900/30"
          aria-label="Sair"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
