import { useState } from 'react'
import type { MoodLog } from '@/compartilhado/tipo/banco'
import { Button } from '@/compartilhado/componente/Botao'
import { Textarea } from '@/compartilhado/componente/Campo'
import { formatDate } from '@/compartilhado/utilitario/formato'
import { Scale } from '@/modulo/humor/componente/Escala'
import { MOODS, ENERGIES } from '@/modulo/humor/componente/escalas'

interface MoodEditFormProps {
  log: MoodLog
  onSubmit: (values: { mood: number; energy: number; notes?: string }) => Promise<void>
  onCancel: () => void
}

/** Edição de um dia já registrado. O dia em si não muda — a data é a chave. */
export function MoodEditForm({ log, onSubmit, onCancel }: MoodEditFormProps) {
  const [mood, setMood] = useState(log.mood)
  const [energy, setEnergy] = useState(log.energy)
  const [notes, setNotes] = useState(log.notes || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await onSubmit({ mood, energy, notes: notes.trim() || undefined })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(log.date)}</p>

      <Scale legend="Humor" options={MOODS} value={mood} onChange={setMood} />
      <Scale legend="Energia" options={ENERGIES} value={energy} onChange={setEnergy} />

      <Textarea
        label="Nota do dia (opcional)"
        rows={2}
        value={notes}
        onChange={event => setNotes(event.target.value)}
        placeholder="O que aconteceu nesse dia?"
      />

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} loading={saving}>
          Salvar
        </Button>
      </div>
    </div>
  )
}
