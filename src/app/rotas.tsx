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
      <Route path="/entrar" element={<PaginaDeEntrada />} />
      <Route path="/cadastro" element={<PaginaDeCadastro />} />
      <Route path="/" element={<RotaProtegida><PaginaInicial /></RotaProtegida>} />
      <Route path="/painel" element={<RotaProtegida><PaginaInicial /></RotaProtegida>} />
      <Route path="/habitos" element={<RotaProtegida><PaginaDeHabitos /></RotaProtegida>} />
      <Route path="/livros" element={<RotaProtegida><PaginaDeLivros /></RotaProtegida>} />
      <Route path="/financas" element={<RotaProtegida><PaginaDeFinancas /></RotaProtegida>} />
      <Route path="/metas" element={<RotaProtegida><PaginaDeMetas /></RotaProtegida>} />
      <Route path="/humor" element={<RotaProtegida><PaginaDeHumor /></RotaProtegida>} />
      <Route path="/configuracoes" element={<RotaProtegida><PaginaDeConfiguracoes /></RotaProtegida>} />
      <Route path="*" element={<Navigate to="/painel" replace />} />
    </Routes>
  )
}
