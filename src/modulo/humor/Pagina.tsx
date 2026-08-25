import { useEffect, useState } from 'react'
import { Smile, Zap, CalendarCheck } from 'lucide-react'
import { MoodService, InsightService } from '@/compartilhado/fonte/fonteDeDados'
import type { MoodLog } from '@/compartilhado/tipo/banco'
import type { HabitMoodCorrelation } from '@/modulo/humor/regraDeComparacao'
import { MoodCheckin } from '@/modulo/humor/componente/RegistroDoDia'
import { MoodTrendChart } from '@/modulo/humor/componente/GraficoDeTendencia'
import { HabitMoodCorrelations } from '@/modulo/humor/componente/ComparacaoComHabitos'
import { MoodHistory } from '@/modulo/humor/componente/Historico'
import { MoodEditForm } from '@/modulo/humor/componente/FormularioDeEdicao'
import { Modal } from '@/compartilhado/componente/Modal'
import { StatCard } from '@/compartilhado/componente/CartaoIndicador'
import { Loading } from '@/compartilhado/componente/Carregando'
import { EmptyState } from '@/compartilhado/componente/EstadoVazio'
import { formatDate } from '@/compartilhado/utilitario/formato'

function media(values: number[]) {
  if (!values.length) return '—'
  const total = values.reduce((sum, value) => sum + value, 0)
  return (total / values.length).toFixed(1).replace('.', ',')
}

export function Mood() {
  const [logs, setLogs] = useState<MoodLog[]>([])
  const [correlations, setCorrelations] = useState<HabitMoodCorrelation[]>([])
  const [editing, setEditing] = useState<MoodLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setError('')
      const [moodLogs, habitCorrelations] = await Promise.all([
        MoodService.getMoodLogs(30),
        InsightService.getHabitCorrelations()
      ])
      setLogs(moodLogs)
      setCorrelations(habitCorrelations)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar o humor')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleEdit = async (values: { mood: number; energy: number; notes?: string }) => {
    if (!editing) return
    try {
      await MoodService.saveMood({ date: editing.date, ...values })
      setEditing(null)
      await load()
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar o registro')
    }
  }

  const handleDelete = async (log: MoodLog) => {
    if (!window.confirm(`Excluir o registro de ${formatDate(log.date)}?`)) return
    try {
      await MoodService.deleteMood(log.id)
      setLogs(prev => prev.filter(item => item.id !== log.id))
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir o registro')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Humor</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Como você tem se sentido, e o que isso tem a ver com seus hábitos
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2">{error}</p>
      )}

      <MoodCheckin onSaved={load} />

      {loading ? (
        <Loading label="Carregando seus registros..." />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<Smile size={40} />}
          title="Nenhum dia registrado ainda"
          description="Marque o humor de hoje no card acima. Com alguns dias registrados, dá para comparar com seus hábitos."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Humor médio"
              value={media(logs.map(log => log.mood))}
              hint="últimos 30 dias"
              icon={<Smile size={18} />}
            />
            <StatCard
              label="Energia média"
              value={media(logs.map(log => log.energy))}
              hint="últimos 30 dias"
              accent="green"
              icon={<Zap size={18} />}
            />
            <StatCard
              label="Dias registrados"
              value={logs.length}
              hint="de 30 dias"
              accent="amber"
              icon={<CalendarCheck size={18} />}
            />
          </div>

          <MoodTrendChart logs={logs} />
          <HabitMoodCorrelations correlations={correlations} />
          <MoodHistory logs={logs} onEdit={setEditing} onDelete={handleDelete} />
        </>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar registro">
        {editing && (
          <MoodEditForm log={editing} onSubmit={handleEdit} onCancel={() => setEditing(null)} />
        )}
      </Modal>
    </div>
  )
}
