import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '@/compartilhado/utilitario/formato'

const COLORS = ['#3a6bff', '#5a84ff', '#8aa8ff', '#2a4fd8', '#1f3baf', '#f59e0b', '#10b981', '#ef4444']

interface CategoryChartProps {
  data: { name: string; value: number }[]
}

export function CategoryChart({ data }: CategoryChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 py-10 text-center">
        Sem despesas registradas ainda.
      </p>
    )
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={value => formatCurrency(Number(value))} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
