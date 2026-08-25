import { Pencil, Trash2 } from 'lucide-react'
import type { MoodLog } from '@/compartilhado/tipo/banco'
import { Card } from '@/compartilhado/componente/Cartao'
import { formatDate } from '@/compartilhado/utilitario/formato'
import { MOODS, ENERGIES, scaleEmoji, scaleLabel } from '@/modulo/humor/componente/escalas'

interface MoodHistoryProps {
  logs: MoodLog[]
  onEdit: (log: MoodLog) => void
  onDelete: (log: MoodLog) => void
}

export function MoodHistory({ logs, onEdit, onDelete }: MoodHistoryProps) {
  return (
    <Card title="Histórico" subtitle={`${logs.length} dia(s) registrados`}>
      {logs.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Nenhum dia registrado ainda. O card acima grava o humor de hoje.
        </p>
      ) : (
        <ul className="space-y-2">
          {logs.map(log => (
            <li
              key={log.id}
              className="flex items-start gap-3 border-b border-gray-100 dark:border-gray-700 last:border-0 pb-2 last:pb-0"
            >
              <div className="flex gap-1 text-xl shrink-0" aria-hidden="true">
                <span>{scaleEmoji(MOODS, log.mood)}</span>
                <span>{scaleEmoji(ENERGIES, log.energy)}</span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDate(log.date)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Humor {scaleLabel(MOODS, log.mood)} · Energia {scaleLabel(ENERGIES, log.energy)}
                </p>
                {log.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{log.notes}</p>
                )}
              </div>

              <div className="flex shrink-0">
                <button
                  type="button"
                  onClick={() => onEdit(log)}
                  aria-label={`Editar o registro de ${formatDate(log.date)}`}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-aurora-600 hover:bg-aurora-50 dark:hover:bg-aurora-900/20 transition-colors"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(log)}
                  aria-label={`Excluir o registro de ${formatDate(log.date)}`}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
