/**
 * O cartão de uma meta: título, categoria, barra de progresso, prazo e o
 * aviso de atrasada.
 */
import { motion } from 'framer-motion'
import { BookOpen, Repeat, Wallet, HeartPulse, Pencil, Trash2, CalendarClock } from 'lucide-react'
import type { Meta } from '@/compartilhado/tipo/banco'
import { formatarMoeda, formatarData } from '@/compartilhado/utilitario/formato'
import { metaEstaAtrasada } from '@/modulo/meta/regraDeProgresso'

interface CartaoDeMetaProps {
  goal: Meta
  onEdit: (goal: Meta) => void
  onDelete: (goal: Meta) => void
}

const CATEGORIAS = {
  reading: { label: 'Leitura', icon: BookOpen },
  habits: { label: 'Hábitos', icon: Repeat },
  finance: { label: 'Finanças', icon: Wallet },
  health: { label: 'Saúde', icon: HeartPulse }
} as const

const STATUS = {
  active: { label: 'Ativa', className: 'bg-aurora-50 text-aurora-700 dark:bg-aurora-900/40 dark:text-aurora-300' },
  completed: { label: 'Concluída', className: 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  failed: { label: 'Não atingida', className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' }
} as const

/** Metas de dinheiro usam a unidade R$ e são exibidas como moeda */
function formatValue(value: number | undefined | null, unit?: string) {
  const amount = value || 0
  if (unit === 'R$') return formatarMoeda(amount)
  const formatted = amount.toLocaleString('pt-BR')
  return unit ? `${formatted} ${unit}` : formatted
}

export function CartaoDeMeta({ goal, onEdit, onDelete }: CartaoDeMetaProps) {
  const category = CATEGORIAS[goal.category]
  const CategoryIcon = category.icon
  const status = STATUS[goal.status]
  const overdue = metaEstaAtrasada(goal)
  const measurable = !!goal.target_value && goal.target_value > 0
  const progress = goal.progress_percentage || 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5"
    >
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 shrink-0 rounded-xl bg-aurora-50 text-aurora-600 dark:bg-aurora-900/40 dark:text-aurora-300 flex items-center justify-center">
          <CategoryIcon size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-gray-900 dark:text-white truncate">{goal.title}</p>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
              {status.label}
            </span>
            {overdue && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300">
                Atrasada
              </span>
            )}
          </div>

          {goal.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{goal.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span>{category.label}</span>
            {goal.deadline && (
              <span
                className={`inline-flex items-center gap-1 ${
                  overdue ? 'text-red-600 dark:text-red-400' : ''
                }`}
              >
                <CalendarClock size={13} /> prazo {formatarData(goal.deadline)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(goal)}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Editar meta"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => onDelete(goal)}
            className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
            aria-label="Excluir meta"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {measurable && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-gray-600 dark:text-gray-300">
              {formatValue(goal.current_value, goal.unit)}
              <span className="text-gray-400 dark:text-gray-500">
                {' '}
                de {formatValue(goal.target_value, goal.unit)}
              </span>
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className={`h-full rounded-full ${
                goal.status === 'completed'
                  ? 'bg-green-500'
                  : overdue
                    ? 'bg-red-500'
                    : 'bg-aurora-500'
              }`}
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}
