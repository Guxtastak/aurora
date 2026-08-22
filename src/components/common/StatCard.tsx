import { motion } from 'framer-motion'

interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  icon?: React.ReactNode
  accent?: 'aurora' | 'green' | 'red' | 'amber'
  delay?: number
}

const accents = {
  aurora: 'bg-aurora-50 text-aurora-600 dark:bg-aurora-900/40 dark:text-aurora-300',
  green: 'bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-300',
  red: 'bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-300',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300'
}

export function StatCard({ label, value, hint, icon, accent = 'aurora', delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {hint && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{hint}</p>}
        </div>
        {icon && (
          <div className={`p-2.5 rounded-xl ${accents[accent]}`}>{icon}</div>
        )}
      </div>
    </motion.div>
  )
}
