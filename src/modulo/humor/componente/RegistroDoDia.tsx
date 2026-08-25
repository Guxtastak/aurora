import { useEffect, useState } from 'react'
import { Check, MessageSquarePlus } from 'lucide-react'
import { MoodService } from '@/compartilhado/fonte/fonteDeDados'
import { Card } from '@/compartilhado/componente/Cartao'
import { Button } from '@/compartilhado/componente/Botao'
import { Textarea } from '@/compartilhado/componente/Campo'
import { todayISO } from '@/compartilhado/utilitario/formato'
import { Scale } from '@/modulo/humor/componente/Escala'
import { MOODS, ENERGIES } from '@/modulo/humor/componente/escalas'

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
