import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Plus, Target } from 'lucide-react'
import { GoalService } from '../services/data'
import type { Goal } from '../types/database.types'
import { GoalCard } from '../components/goals/GoalCard'
import { GoalForm } from '../components/goals/GoalForm'
import type { GoalFormValues } from '../components/goals/GoalForm'
import { Modal } from '../components/common/Modal'
import { Button } from '../components/common/Button'
import { Loading } from '../components/common/Loading'
import { EmptyState } from '../components/common/EmptyState'
import { StatCard } from '../components/common/StatCard'

type Filter = 'all' | Goal['status']

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'active', label: 'Ativas' },
  { key: 'completed', label: 'Concluídas' },
  { key: 'failed', label: 'Não atingidas' }
]

export function Goals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)

  const load = async () => {
    try {
      setError('')
      setGoals(await GoalService.getGoals())
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar metas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async (values: GoalFormValues) => {
    try {
      if (editing) {
        await GoalService.updateGoal(editing.id, values)
      } else {
        await GoalService.createGoal(values)
      }
      setModalOpen(false)
      setEditing(null)
      await load()
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar meta')
    }
  }

  const handleDelete = async (goal: Goal) => {
    if (!window.confirm(`Excluir a meta "${goal.title}"?`)) return
    try {
      await GoalService.deleteGoal(goal.id)
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
        <Button
          icon={<Plus size={16} />}
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
        >
          Nova meta
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2">{error}</p>
      )}

      {loading ? (
        <Loading label="Carregando metas..." />
      ) : goals.length === 0 ? (
        <EmptyState
          icon={<Target size={40} />}
          title="Nenhuma meta ainda"
          description="Defina onde você quer chegar e acompanhe o progresso em um lugar só."
          action={
            <Button icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
              Criar meta
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Ativas" value={active.length} />
            <StatCard label="Concluídas" value={completed.length} accent="green" />
            <StatCard
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
            <EmptyState title="Nada neste filtro" description="Escolha outro status para ver as metas." />
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {visible.map(goal => (
                  <GoalCard
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
        <GoalForm goal={editing} onSubmit={handleSubmit} onCancel={closeModal} />
      </Modal>
    </div>
  )
}
