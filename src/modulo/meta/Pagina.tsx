import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Plus, Target } from 'lucide-react'
import { ServicoDeMetas } from '@/compartilhado/fonte/fonteDeDados'
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
  const [goals, setGoals] = useState<Meta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Meta | null>(null)

  const load = async () => {
    try {
      setError('')
      setGoals(await ServicoDeMetas.listarMetas())
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar metas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async (values: ValoresDaMeta) => {
    try {
      if (editing) {
        await ServicoDeMetas.atualizarMeta(editing.id, values)
      } else {
        await ServicoDeMetas.criarMeta(values)
      }
      setModalOpen(false)
      setEditing(null)
      await load()
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar meta')
    }
  }

  const handleDelete = async (goal: Meta) => {
    if (!window.confirm(`Excluir a meta "${goal.title}"?`)) return
    try {
      await ServicoDeMetas.excluirMeta(goal.id)
      setGoals(prev => prev.filter(g => g.id !== goal.id))
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir meta')
    }
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const visible = filter === 'all' ? goals : goals.filter(g => g.status === filter)
  const active = goals.filter(g => g.status === 'active')
  const completed = goals.filter(g => g.status === 'completed')
  const measurableActive = active.filter(g => !!g.target_value && g.target_value > 0)
  const averageProgress = measurableActive.length
    ? Math.round(
        measurableActive.reduce((sum, g) => sum + (g.progress_percentage || 0), 0) /
          measurableActive.length
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
            setEditing(null)
            setModalOpen(true)
          }}
        >
          Nova meta
        </Botao>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2">{error}</p>
      )}

      {loading ? (
        <Carregando label="Carregando metas..." />
      ) : goals.length === 0 ? (
        <EstadoVazio
          icon={<Target size={40} />}
          title="Nenhuma meta ainda"
          description="Defina onde você quer chegar e acompanhe o progresso em um lugar só."
          action={
            <Botao icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
              Criar meta
            </Botao>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <CartaoIndicador label="Ativas" value={active.length} />
            <CartaoIndicador label="Concluídas" value={completed.length} accent="green" />
            <CartaoIndicador
              label="Progresso médio"
              value={`${averageProgress}%`}
              hint="das metas ativas com alvo definido"
              accent="amber"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  filter === f.key
                    ? 'bg-aurora-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <EstadoVazio title="Nada neste filtro" description="Escolha outro status para ver as metas." />
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {visible.map(goal => (
                  <CartaoDeMeta
                    key={goal.id}
                    goal={goal}
                    onEdit={g => {
                      setEditing(g)
                      setModalOpen(true)
                    }}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Editar meta' : 'Nova meta'}>
        <FormularioDeMeta goal={editing} onSubmit={handleSubmit} onCancel={closeModal} />
      </Modal>
    </div>
  )
}
