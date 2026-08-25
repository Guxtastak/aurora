import { useState } from 'react'
import { MenuLateral } from '@/compartilhado/moldura/MenuLateral'
import { Cabecalho } from '@/compartilhado/moldura/Cabecalho'
import { AvisoDeDemonstracao } from '@/compartilhado/moldura/AvisoDeDemonstracao'
import { modoDemonstracao } from '@/compartilhado/fonte/supabase'

export function Moldura({ children }: { children: React.ReactNode }) {
  const [menuAberto, setMenuAberto] = useState(false)

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <MenuLateral open={menuAberto} onClose={() => setMenuAberto(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {modoDemonstracao && <AvisoDeDemonstracao />}
        <Cabecalho onMenuClick={() => setMenuAberto(true)} />
        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
