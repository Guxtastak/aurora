/**
 * A fileira de cinco botões com emoji. Serve tanto para humor quanto para
 * energia — quem diz qual é a lista é o parâmetro `options`.
 */
import type { OpcaoDeEscala } from '@/modulo/humor/componente/escalas'

interface EscalaProps {
  legend: string
  options: OpcaoDeEscala[]
  value: number | null
  onChange: (value: number) => void
}

export function Escala({ legend, options, value, onChange }: EscalaProps) {
  return (
    <fieldset>
      <legend className="text-sm text-gray-500 dark:text-gray-400 mb-2">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-label={option.label}
            aria-pressed={value === option.value}
            title={option.label}
            className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-2xl transition-colors focus:outline-none focus:ring-2 focus:ring-aurora-500 ${
              value === option.value
                ? 'bg-aurora-50 dark:bg-aurora-900/40 ring-2 ring-aurora-500'
                : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span aria-hidden="true">{option.emoji}</span>
            <span className="text-[11px] leading-none text-gray-500 dark:text-gray-400">
              {option.label}
            </span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}
