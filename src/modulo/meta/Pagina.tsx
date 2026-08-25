/**
 * Tela de Metas (/metas): lista com filtro por status, progresso médio e o
 * formulário de criar e editar.
 */
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Plus, Target } from 'lucide-react'
import { ServicoDeMetas } from '@/compartilhado/fonte/fonteDeDados'
import { useDados } from '@/compartilhado/gancho/useDados'
import type { Meta } from '@/compartilhado/tipo/banco'
import { CartaoDeMeta } from '@/modulo/meta/componente/CartaoDeMeta'
import { FormularioDeMeta } from '@/modulo/meta/componente/FormularioDeMeta'
import type { ValoresDaMeta } from '@/modulo/meta/componente/FormularioDeMeta'
import { Modal } from '@/compartilhado/componente/Modal'
import { Botao } from '@/compartilhado/componente/Botao'
import { Carregando } from '@/compartilhado/componente/Carregando'
import { EstadoVazio } from '@/compartilhado/componente/EstadoVazio'
import { CartaoIndicador } from '@/compartilhado/componente/CartaoIndicador'

type Filter = 'all' | Meta['status']

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'active', label: 'Ativas' },
  { key: 'completed', label: 'Concluídas' },
  { key: 'failed', label: 'Não atingidas' }
]

export function PaginaDeMetas() {
  const {
    dados: metas,
    setDados: setMetas,
    carregando,
    erro,
    setErro,
    recarregar
  } = useDados(() => ServicoDeMetas.listarMetas(), [] as Meta[], {
    aoFalhar: 'Erro ao carregar metas'
  })

  const [filtro, setFiltro] = useState<Filter>('all')
  const [modalAberto, setModalAberto] = useState(false)
  const [emEdicao, setEmEdicao] = useState<Meta | null>(null)

  const aoEnviar = async (values: ValoresDaMeta) => {
    try {
      if (emEdicao) {
        await ServicoDeMetas.atualizarMeta(emEdicao.id, values)
      } else {
        await ServicoDeMetas.criarMeta(values)
      }
      setModalAberto(false)
      setEmEdicao(null)
      await recarregar()
    } catch (falha: any) {
      setErro(falha.message || 'Erro ao salvar meta')
    }
  }

  const aoExcluir = async (meta: Meta) => {
    if (!window.confirm(`Excluir a meta "${meta.title}"?`)) return
    try {
      await ServicoDeMetas.excluirMeta(meta.id)
      setMetas(anteriores => anteriores.filter(m => m.id !== meta.id))
    } catch (falha: any) {
      setErro(falha.message || 'Erro ao excluir meta')
    }
  }

  const fecharModal = () => {
    setModalAberto(false)
    setEmEdicao(null)
  }

  const visiveis = filtro === 'all' ? metas : metas.filter(m => m.status === filtro)
  const ativas = metas.filter(m => m.status === 'active')
  const concluidas = metas.filter(m => m.status === 'completed')

  // Meta sem alvo numerico e qualitativa: nao entra na media de progresso
  const ativasComAlvo = ativas.filter(m => !!m.target_value && m.target_value > 0)
  const progressoMedio = ativasComAlvo.length
    ? Math.round(
        ativasComAlvo.reduce((soma, m) => soma + (m.progress_percentage || 0), 0) /
          ativasComAlvo.length
      )
    : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Metas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            O que você quer alcançar, e o quanto já andou
          </p>
        </div>
        <Botao
          icon={<Plus size={16} />}
          onClick={() => {
            setEmEdicao(null)
            setModalAberto(true)
          }}
        >
          Nova meta
        </Botao>
      </div>

      {erro && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2">{erro}</p>
      )}

      {carregando ? (
        <Carregando label="Carregando metas..." />
      ) : metas.length === 0 ? (
        <EstadoVazio
          icon={<Target size={40} />}
          title="Nenhuma meta ainda"
          description="Defina onde você quer chegar e acompanhe o progresso em um lugar só."
          action={
            <Botao icon={<Plus size={16} />} onClick={() => setModalAberto(true)}>
              Criar meta
            </Botao>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <CartaoIndicador label="Ativas" value={ativas.length} />
            <CartaoIndicador label="Concluídas" value={concluidas.length} accent="green" />
            <CartaoIndicador
              label="Progresso médio"
              value={`${progressoMedio}%`}
              hint="das metas ativas com alvo definido"
              accent="amber"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFiltro(f.key)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  filtro === f.key
                    ? 'bg-aurora-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {visiveis.length === 0 ? (
            <EstadoVazio title="Nada neste filtro" description="Escolha outro status para ver as metas." />
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {visiveis.map(goal => (
                  <CartaoDeMeta
                    key={goal.id}
                    goal={goal}
                    onEdit={g => {
                      setEmEdicao(g)
                      setModalAberto(true)
                    }}
                    onDelete={aoExcluir}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      <Modal open={modalAberto} onClose={fecharModal} title={emEdicao ? 'Editar meta' : 'Nova meta'}>
        <FormularioDeMeta goal={emEdicao} onSubmit={aoEnviar} onCancel={fecharModal} />
      </Modal>
    </div>
  )
}
