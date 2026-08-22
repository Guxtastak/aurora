import { ArrowDownRight, ArrowUpRight, Trash2 } from 'lucide-react'
import type { Finance } from '../../types/database.types'
import { formatCurrency, formatDate } from '../../utils/format'

interface TransactionListProps {
  transactions: Finance[]
  onDelete: (transaction: Finance) => void
}

export function TransactionList({ transactions, onDelete }: TransactionListProps) {
  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
      {transactions.map(t => {
        const income = t.type === 'income'
        return (
          <li key={t.id} className="flex items-center gap-3 py-3">
            <div
              className={`p-2 rounded-xl ${
                income
                  ? 'bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-300'
                  : 'bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-300'
              }`}
            >
              {income ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {t.description || t.category}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t.category} · {formatDate(t.date)}
              </p>
            </div>

            <span
              className={`text-sm font-semibold whitespace-nowrap ${
                income ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {income ? '+' : '-'} {formatCurrency(Number(t.amount))}
            </span>

            <button
              onClick={() => onDelete(t)}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
              aria-label="Excluir transação"
            >
              <Trash2 size={15} />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
