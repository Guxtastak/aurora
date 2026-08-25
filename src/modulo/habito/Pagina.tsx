import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Plus, Repeat } from 'lucide-react'
import { ServicoDeHabitos } from '@/compartilhado/fonte/fonteDeDados'
import type { Habito } from '@/compartilhado/tipo/banco'
import { CartaoDeHabito } from '@/modulo/habito/componente/CartaoDeHabito'
import { FormularioDeHabito } from '@/modulo/habito/componente/FormularioDeHabito'
import type { ValoresDoHabito } from '@/modulo/habito/componente/FormularioDeHabito'
import { Modal } from '@/compartilhado/componente/Modal'
import { Botao } from '@/compartilhado/componente/Botao'
import { Carregando } from '@/compartilhado/componente/Carregando'
import { EstadoVazio } from '@/compartilhado/componente/EstadoVazio'
import { CartaoIndicador } from '@/compartilhado/componente/CartaoIndicador'
import { porcentagem } from '@/compartilhado/utilitario/formato'

export function PaginaDeHabitos() {
  const [habits, setHabits] = useState<Habito[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Habito | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async () => {
    try {
      setError('')
      const data = await ServicoDeHabitos.listarHabitosComStatusDeHoje()
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

  const handleToggle = async (habit: Habito) => {
    setBusyId(habit.id)
    // Atualização otimista
    setHabits(prev =>
      prev.map(h => (h.id === habit.id ? { ...h, completed_today: !h.completed_today } : h))
    )
    try {
      await ServicoDeHabitos.alternarHabitoDeHoje(habit.id)
      await load()
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar hábito')
      await load()
    } finally {
      setBusyId(null)
    }
  }

  const handleSubmit = async (values: ValoresDoHabito) => {
    try {
      if (editing) {
        await ServicoDeHabitos.atualizarHabito(editing.id, values)
      } else {
        await ServicoDeHabitos.criarHabito(values)
      }
      setModalOpen(false)
      setEditing(null)
      await load()
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar hábito')
    }
  }

  const handleDelete = async (habit: Habito) => {
    if (!window.confirm(`Excluir o hábito "${habit.name}"?`)) return
    try {
      await ServicoDeHabitos.excluirHabito(habit.id)
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
        <Botao
          icon={<Plus size={16} />}
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
        >
          Novo hábito
        </Botao>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2">{error}</p>
      )}

      {loading ? (
        <Carregando label="Carregando hábitos..." />
      ) : habits.length === 0 ? (
        <EstadoVazio
          icon={<Repeat size={40} />}
          title="Nenhum hábito ainda"
          description="Crie seu primeiro hábito e comece a construir consistência."
          action={
            <Botao icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
              Criar hábito
            </Botao>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <CartaoIndicador label="Concluídos hoje" value={`${doneToday}/${habits.length}`} />
            <CartaoIndicador
              label="Taxa do dia"
              value={`${porcentagem(doneToday, habits.length)}%`}
              accent="green"
            />
            <CartaoIndicador label="Melhor sequência" value={`${bestStreak} dias`} accent="amber" />
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {habits.map(habit => (
                <CartaoDeHabito
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
        <FormularioDeHabito
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
