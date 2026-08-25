import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Plus, Repeat } from 'lucide-react'
import { HabitService } from '@/compartilhado/fonte/fonteDeDados'
import type { Habit } from '@/compartilhado/tipo/banco'
import { HabitCard } from '@/modulo/habito/componente/CartaoDeHabito'
import { HabitForm } from '@/modulo/habito/componente/FormularioDeHabito'
import type { HabitFormValues } from '@/modulo/habito/componente/FormularioDeHabito'
import { Modal } from '@/compartilhado/componente/Modal'
import { Button } from '@/compartilhado/componente/Botao'
import { Loading } from '@/compartilhado/componente/Carregando'
import { EmptyState } from '@/compartilhado/componente/EstadoVazio'
import { StatCard } from '@/compartilhado/componente/CartaoIndicador'
import { percent } from '@/compartilhado/utilitario/formato'

export function Habits() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Habit | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async () => {
    try {
      setError('')
      const data = await HabitService.getHabitsWithTodayStatus()
      setHabits(data)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar hábitos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleToggle = async (habit: Habit) => {
    setBusyId(habit.id)
    // Atualização otimista
    setHabits(prev =>
      prev.map(h => (h.id === habit.id ? { ...h, completed_today: !h.completed_today } : h))
    )
    try {
      await HabitService.toggleTodayHabit(habit.id)
      await load()
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar hábito')
      await load()
    } finally {
      setBusyId(null)
    }
  }

  const handleSubmit = async (values: HabitFormValues) => {
    try {
      if (editing) {
        await HabitService.updateHabit(editing.id, values)
      } else {
        await HabitService.createHabit(values)
      }
      setModalOpen(false)
      setEditing(null)
      await load()
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar hábito')
    }
  }

  const handleDelete = async (habit: Habit) => {
    if (!window.confirm(`Excluir o hábito "${habit.name}"?`)) return
    try {
      await HabitService.deleteHabit(habit.id)
      setHabits(prev => prev.filter(h => h.id !== habit.id))
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir hábito')
    }
  }

  const doneToday = habits.filter(h => h.completed_today).length
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.best_streak || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hábitos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Marque o que você concluiu hoje e mantenha a sequência
          </p>
        </div>
        <Button
          icon={<Plus size={16} />}
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
        >
          Novo hábito
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2">{error}</p>
      )}

      {loading ? (
        <Loading label="Carregando hábitos..." />
      ) : habits.length === 0 ? (
        <EmptyState
          icon={<Repeat size={40} />}
          title="Nenhum hábito ainda"
          description="Crie seu primeiro hábito e comece a construir consistência."
          action={
            <Button icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
              Criar hábito
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Concluídos hoje" value={`${doneToday}/${habits.length}`} />
            <StatCard
              label="Taxa do dia"
              value={`${percent(doneToday, habits.length)}%`}
              accent="green"
            />
            <StatCard label="Melhor sequência" value={`${bestStreak} dias`} accent="amber" />
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {habits.map(habit => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  busy={busyId === habit.id}
                  onToggle={handleToggle}
                  onEdit={h => {
                    setEditing(h)
                    setModalOpen(true)
                  }}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        title={editing ? 'Editar hábito' : 'Novo hábito'}
      >
        <HabitForm
          habit={editing}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalOpen(false)
            setEditing(null)
          }}
        />
      </Modal>
    </div>
  )
}
