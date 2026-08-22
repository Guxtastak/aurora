import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function Layout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setMenuOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
