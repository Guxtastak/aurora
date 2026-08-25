import { motion } from 'framer-motion'
import { Check, Flame, Trash2, Pencil } from 'lucide-react'
import type { Habito } from '@/compartilhado/tipo/banco'

interface CartaoDeHabitoProps {
  habit: Habito
  onToggle: (habit: Habito) => void
  onEdit: (habit: Habito) => void
  onDelete: (habit: Habito) => void
  busy?: boolean
}

export function CartaoDeHabito({ habit, onToggle, onEdit, onDelete, busy }: CartaoDeHabitoProps) {
  const done = !!habit.completed_today

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex items-center gap-4"
    >
      <button
        onClick={() => onToggle(habit)}
        disabled={busy}
        aria-label={done ? 'Desmarcar hábito' : 'Marcar hábito'}
        className={`h-11 w-11 shrink-0 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 ${
          done
            ? 'bg-aurora-500 text-white'
            : 'bg-gray-100 text-gray-400 hover:bg-aurora-100 hover:text-aurora-600 dark:bg-gray-700 dark:hover:bg-gray-600'
        }`}
        style={done && habit.color ? { backgroundColor: habit.color } : undefined}
      >
        <Check size={20} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {habit.icon && <span>{habit.icon}</span>}
          <p
            className={`font-semibold truncate ${
              done
                ? 'text-gray-400 line-through dark:text-gray-500'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            {habit.name}
          </p>
        </div>
        {habit.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{habit.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <Flame size={13} /> {habit.current_streak || 0} dias
          </span>
          <span>recorde: {habit.best_streak || 0}</span>
          <span className="capitalize">
            {habit.frequency === 'daily' ? 'diário' : habit.frequency === 'weekly' ? 'semanal' : 'mensal'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onEdit(habit)}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Editar hábito"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={() => onDelete(habit)}
          className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
          aria-label="Excluir hábito"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  )
}
