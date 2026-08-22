import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Repeat, BookOpen, Wallet, Settings as SettingsIcon, X } from 'lucide-react'
import { motion } from 'framer-motion'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/habits', label: 'Hábitos', icon: Repeat },
  { to: '/books', label: 'Livros', icon: BookOpen },
  { to: '/finances', label: 'Finanças', icon: Wallet },
  { to: '/settings', label: 'Configurações', icon: SettingsIcon }
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed z-40 inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 transform transition-transform lg:translate-x-0 lg:static lg:z-auto ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="h-3 w-3 rounded-full bg-aurora-500"
            />
            <span className="text-xl font-bold text-aurora-600 dark:text-aurora-400">Aurora</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-aurora-50 text-aurora-700 dark:bg-aurora-900/40 dark:text-aurora-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
