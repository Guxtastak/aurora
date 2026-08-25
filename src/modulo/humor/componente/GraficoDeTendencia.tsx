import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import type { MoodLog } from '@/compartilhado/tipo/banco'
import { Card } from '@/compartilhado/componente/Cartao'

interface MoodTrendChartProps {
  logs: MoodLog[]
}

export function MoodTrendChart({ logs }: MoodTrendChartProps) {
  // O serviço devolve do mais recente para o mais antigo; o gráfico lê ao contrário
  const data = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(log => ({
      dia: log.date.slice(8, 10) + '/' + log.date.slice(5, 7),
      humor: log.mood,
      energia: log.energy
    }))

  return (
    <Card title="Últimos 30 dias" subtitle="Humor e energia, de 1 a 5">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="dia" tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="humor" stroke="#3a6bff" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="energia" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
