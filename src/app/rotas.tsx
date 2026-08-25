import { Routes, Route, Navigate } from 'react-router-dom'
import { RotaProtegida } from '@/compartilhado/componente/RotaProtegida'
import { PaginaDeEntrada } from '@/modulo/conta/PaginaDeEntrada'
import { PaginaDeCadastro } from '@/modulo/conta/PaginaDeCadastro'
import { PaginaInicial } from '@/modulo/painel/Pagina'
import { PaginaDeHabitos } from '@/modulo/habito/Pagina'
import { PaginaDeLivros } from '@/modulo/livro/Pagina'
import { PaginaDeFinancas } from '@/modulo/financa/Pagina'
import { PaginaDeMetas } from '@/modulo/meta/Pagina'
import { PaginaDeHumor } from '@/modulo/humor/Pagina'
import { PaginaDeConfiguracoes } from '@/modulo/conta/PaginaDeConfiguracoes'

export function Rotas() {
  return (
    <Routes>
      <Route path="/login" element={<PaginaDeEntrada />} />
      <Route path="/register" element={<PaginaDeCadastro />} />
      <Route path="/" element={<RotaProtegida><PaginaInicial /></RotaProtegida>} />
      <Route path="/dashboard" element={<RotaProtegida><PaginaInicial /></RotaProtegida>} />
      <Route path="/habits" element={<RotaProtegida><PaginaDeHabitos /></RotaProtegida>} />
      <Route path="/books" element={<RotaProtegida><PaginaDeLivros /></RotaProtegida>} />
      <Route path="/finances" element={<RotaProtegida><PaginaDeFinancas /></RotaProtegida>} />
      <Route path="/goals" element={<RotaProtegida><PaginaDeMetas /></RotaProtegida>} />
      <Route path="/mood" element={<RotaProtegida><PaginaDeHumor /></RotaProtegida>} />
      <Route path="/settings" element={<RotaProtegida><PaginaDeConfiguracoes /></RotaProtegida>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
