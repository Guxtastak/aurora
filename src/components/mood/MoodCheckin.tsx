import { useEffect, useState } from 'react'
import { Check, MessageSquarePlus } from 'lucide-react'
import { MoodService } from '../../services/data'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { Textarea } from '../common/Input'
import { todayISO } from '../../utils/format'

/** Escalas de 1 a 5, com o rótulo servindo de nome acessível do botão */
const MOODS = [
  { value: 1, emoji: '😞', label: 'Muito ruim' },
  { value: 2, emoji: '🙁', label: 'Ruim' },
  { value: 3, emoji: '😐', label: 'Neutro' },
  { value: 4, emoji: '🙂', label: 'Bom' },
  { value: 5, emoji: '😄', label: 'Ótimo' }
]

const ENERGIES = [
  { value: 1, emoji: '😴', label: 'Esgotado' },
  { value: 2, emoji: '🥱', label: 'Baixa' },
  { value: 3, emoji: '🙂', label: 'Normal' },
  { value: 4, emoji: '⚡', label: 'Alta' },
  { value: 5, emoji: '🔥', label: 'Muito alta' }
]

interface ScaleProps {
  legend: string
  options: typeof MOODS
  value: number | null
  onChange: (value: number) => void
}

function Scale({ legend, options, value, onChange }: ScaleProps) {
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

interface MoodCheckinProps {
  /** Chamado depois de gravar, para a tela recarregar o que depende do humor */
  onSaved?: () => void
}

export function MoodCheckin({ onSaved }: MoodCheckinProps) {
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    MoodService.getMoodByDate(todayISO())
      .then(today => {
        if (!today) return
        setMood(today.mood)
        setEnergy(today.energy)
        setNotes(today.notes || '')
        setShowNotes(!!today.notes)
        setSaved(true)
      })
      .catch(err => setError(err.message || 'Erro ao carregar o humor de hoje'))
  }, [])

  const handleSave = async () => {
    if (mood === null || energy === null) return
    setSaving(true)
    setError('')
    try {
      await MoodService.saveMood({
        date: todayISO(),
        mood,
        energy,
        notes: notes.trim() || undefined
      })
      setSaved(true)
      onSaved?.()
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar o humor')
    } finally {
      setSaving(false)
    }
  }

  const pick = (setter: (value: number) => void) => (value: number) => {
    setter(value)
    setSaved(false)
  }

  return (
    <Card title="Como foi seu dia?" subtitle="Leva cinco segundos e alimenta as correlações">
      <div className="space-y-4">
        <Scale legend="Humor" options={MOODS} value={mood} onChange={pick(setMood)} />
        <Scale legend="Energia" options={ENERGIES} value={energy} onChange={pick(setEnergy)} />

        {showNotes ? (
          <Textarea
            label="Nota do dia (opcional)"
            rows={2}
            value={notes}
            onChange={event => {
              setNotes(event.target.value)
              setSaved(false)
            }}
            placeholder="O que aconteceu hoje?"
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowNotes(true)}
            className="inline-flex items-center gap-1.5 text-sm text-aurora-600 dark:text-aurora-300 hover:underline"
          >
            <MessageSquarePlus size={15} />
            Adicionar uma nota
          </button>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={mood === null || energy === null || saved}
          >
            {saved ? 'Registrado' : 'Salvar'}
          </Button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <Check size={15} />
              Hoje já está registrado
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}
