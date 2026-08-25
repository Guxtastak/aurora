import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import type { HabitMoodCorrelation } from '@/modulo/humor/regraDeComparacao'
import { MIN_DAYS } from '@/modulo/humor/regraDeComparacao'
import { Card } from '@/compartilhado/componente/Cartao'

interface HabitMoodCorrelationsProps {
  correlations: HabitMoodCorrelation[]
}

/** Uma casa decimal, com vírgula — o arredondamento é só de exibição */
function media(value: number) {
  return value.toFixed(1).replace('.', ',')
}

function delta(value: number) {
  const sinal = value > 0 ? '+' : ''
  return `${sinal}${media(value)}`
}

function Indicador({ value }: { value: number }) {
  if (value > 0.2) return <ArrowUp size={16} className="text-green-500" aria-hidden="true" />
  if (value < -0.2) return <ArrowDown size={16} className="text-red-500" aria-hidden="true" />
  return <Minus size={16} className="text-gray-400" aria-hidden="true" />
}

export function HabitMoodCorrelations({ correlations }: HabitMoodCorrelationsProps) {
  return (
    <Card
      title="Hábitos e humor"
      subtitle="O que os dias registrados mostram — é comparação, não causa"
    >
      {correlations.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Nenhum hábito diário cadastrado ainda. Hábitos semanais e mensais ficam de fora
          porque, neles, a maioria dos dias é "não cumprido" por desenho.
        </p>
      ) : (
        <ul className="space-y-3">
          {correlations.map(item => (
            <li
              key={item.habitId}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700 last:border-0 pb-3 last:pb-0"
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {item.habitName}
                </p>
                {item.enough ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nos dias em que você fez: <strong>{media(item.comHabito.mood)}</strong> · nos
                    outros: <strong>{media(item.semHabito.mood)}</strong> · {item.days} dias
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    {item.days === 0
                      ? `Sem humor registrado ainda — ${MIN_DAYS} dias bastam para começar a comparar`
                      : `${item.days} dia(s) registrados: ainda é pouco para comparar`}
                  </p>
                )}
              </div>

              {item.enough && (
                <div className="flex items-center gap-3 shrink-0">
                  <span className="inline-flex items-center gap-1 text-sm">
                    <Indicador value={item.deltaMood} />
                    <span className="text-gray-700 dark:text-gray-200">
                      humor {delta(item.deltaMood)}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm">
                    <Indicador value={item.deltaEnergy} />
                    <span className="text-gray-700 dark:text-gray-200">
                      energia {delta(item.deltaEnergy)}
                    </span>
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
