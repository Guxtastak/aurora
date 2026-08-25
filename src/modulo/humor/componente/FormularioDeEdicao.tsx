import { useState } from 'react'
import type { RegistroDeHumor } from '@/compartilhado/tipo/banco'
import { Botao } from '@/compartilhado/componente/Botao'
import { CampoDeTextoLongo } from '@/compartilhado/componente/Campo'
import { formatarData } from '@/compartilhado/utilitario/formato'
import { Escala } from '@/modulo/humor/componente/Escala'
import { HUMORES, ENERGIAS } from '@/modulo/humor/componente/escalas'

interface FormularioDeEdicaoProps {
  log: RegistroDeHumor
  onSubmit: (values: { mood: number; energy: number; notes?: string }) => Promise<void>
  onCancel: () => void
}

/** Edição de um dia já registrado. O dia em si não muda — a data é a chave. */
export function FormularioDeEdicao({ log, onSubmit, onCancel }: FormularioDeEdicaoProps) {
  const [mood, setMood] = useState(log.mood)
  const [energy, setEnergy] = useState(log.energy)
  const [notes, setNotes] = useState(log.notes || '')
  const [salvando, setSalvando] = useState(false)

  const handleSubmit = async () => {
    setSalvando(true)
    try {
      await onSubmit({ mood, energy, notes: notes.trim() || undefined })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{formatarData(log.date)}</p>

      <Escala legend="Humor" options={HUMORES} value={mood} onChange={setMood} />
      <Escala legend="Energia" options={ENERGIAS} value={energy} onChange={setEnergy} />

      <CampoDeTextoLongo
        label="Nota do dia (opcional)"
        rows={2}
        value={notes}
        onChange={event => setNotes(event.target.value)}
        placeholder="O que aconteceu nesse dia?"
      />

      <div className="flex justify-end gap-2">
        <Botao variant="secondary" onClick={onCancel}>
          Cancelar
        </Botao>
        <Botao onClick={handleSubmit} carregando={salvando}>
          Salvar
        </Botao>
      </div>
    </div>
  )
}
