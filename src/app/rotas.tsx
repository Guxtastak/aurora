/**
 * O mapa de endereços do app: cada URL e a tela que ela abre.
 *
 * Tudo o que não é /entrar e /cadastro passa por RotaProtegida, que joga
 * visitante deslogado de volta para a tela de entrada.
 *
 * Cada tela é carregada só quando você abre a rota dela (ver `tela()` abaixo).
 * Quem entra no Painel não baixa o código do gráfico de finanças junto.
 */
import { lazy, Suspense } from 'react'
import type { ComponentType } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { RotaProtegida } from '@/compartilhado/componente/RotaProtegida'
import { Carregando } from '@/compartilhado/componente/Carregando'

/**
 * Prepara uma tela para ser baixada só quando a rota abrir.
 *
 * O `lazy` do React espera um módulo com `export default`, e as telas daqui
 * usam export nomeado como o resto do projeto — por isso o nome vai como
 * segundo parâmetro, e esta função faz a ponte. É o único lugar que precisa
 * saber disso.
 */
function tela(carregarModulo: () => Promise<Record<string, unknown>>, nome: string) {
  return lazy(async () => ({
    default: (await carregarModulo())[nome] as ComponentType
  }))
}

const PaginaDeEntrada = tela(() => import('@/modulo/conta/PaginaDeEntrada'), 'PaginaDeEntrada')
const PaginaDeCadastro = tela(() => import('@/modulo/conta/PaginaDeCadastro'), 'PaginaDeCadastro')
const PaginaInicial = tela(() => import('@/modulo/painel/Pagina'), 'PaginaInicial')
const PaginaDeHabitos = tela(() => import('@/modulo/habito/Pagina'), 'PaginaDeHabitos')
const PaginaDeLivros = tela(() => import('@/modulo/livro/Pagina'), 'PaginaDeLivros')
const PaginaDeFinancas = tela(() => import('@/modulo/financa/Pagina'), 'PaginaDeFinancas')
const PaginaDeMetas = tela(() => import('@/modulo/meta/Pagina'), 'PaginaDeMetas')
const PaginaDeHumor = tela(() => import('@/modulo/humor/Pagina'), 'PaginaDeHumor')
const PaginaDeConfiguracoes = tela(
  () => import('@/modulo/conta/PaginaDeConfiguracoes'),
  'PaginaDeConfiguracoes'
)

export function Rotas() {
  return (
    // O Suspense cobre a fração de segundo em que a tela ainda está baixando
    <Suspense fallback={<Carregando label="Abrindo..." />}>
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
        <Route
          path="/configuracoes"
          element={<RotaProtegida><PaginaDeConfiguracoes /></RotaProtegida>}
        />
        <Route path="*" element={<Navigate to="/painel" replace />} />
      </Routes>
    </Suspense>
  )
}
