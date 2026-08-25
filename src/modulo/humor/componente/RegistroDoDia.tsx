import { useEffect, useState } from 'react'
import { Check, MessageSquarePlus } from 'lucide-react'
import { ServicoDeHumor } from '@/compartilhado/fonte/fonteDeDados'
import { Cartao } from '@/compartilhado/componente/Cartao'
import { Botao } from '@/compartilhado/componente/Botao'
import { CampoDeTextoLongo } from '@/compartilhado/componente/Campo'
import { dataDeHoje } from '@/compartilhado/utilitario/formato'
import { Escala } from '@/modulo/humor/componente/Escala'
import { HUMORES, ENERGIAS } from '@/modulo/humor/componente/escalas'

interface RegistroDoDiaProps {
  /** Chamado depois de gravar, para a tela recarregar o que depende do humor */
  onSaved?: () => void
}

export function RegistroDoDia({ onSaved }: RegistroDoDiaProps) {
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [mostrarNota, setMostrarNota] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    ServicoDeHumor.buscarRegistroPorData(dataDeHoje())
      .then(today => {
        if (!today) return
        setMood(today.mood)
        setEnergy(today.energy)
        setNotes(today.notes || '')
        setMostrarNota(!!today.notes)
        setSalvo(true)
      })
      .catch(err => setError(err.message || 'Erro ao carregar o humor de hoje'))
  }, [])

  const aoSalvar = async () => {
    if (mood === null || energy === null) return
    setSalvando(true)
    setError('')
    try {
      await ServicoDeHumor.gravarRegistroDoDia({
        date: dataDeHoje(),
        mood,
        energy,
        notes: notes.trim() || undefined
      })
      setSalvo(true)
      onSaved?.()
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar o humor')
    } finally {
      setSalvando(false)
    }
  }

  const pick = (setter: (value: number) => void) => (value: number) => {
    setter(value)
    setSalvo(false)
  }

  return (
    <Cartao title="Como foi seu dia?" subtitle="Leva cinco segundos e alimenta as correlações">
      <div className="space-y-4">
        <Escala legend="Humor" options={HUMORES} value={mood} onChange={pick(setMood)} />
        <Escala legend="Energia" options={ENERGIAS} value={energy} onChange={pick(setEnergy)} />

        {mostrarNota ? (
          <CampoDeTextoLongo
            label="Nota do dia (opcional)"
            rows={2}
            value={notes}
            onChange={event => {
              setNotes(event.target.value)
              setSalvo(false)
            }}
            placeholder="O que aconteceu hoje?"
          />
        ) : (
          <button
            type="button"
            onClick={() => setMostrarNota(true)}
            className="inline-flex items-center gap-1.5 text-sm text-aurora-600 dark:text-aurora-300 hover:underline"
          >
            <MessageSquarePlus size={15} />
            Adicionar uma nota
          </button>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex items-center gap-3">
          <Botao
            onClick={aoSalvar}
            carregando={salvando}
            disabled={mood === null || energy === null || salvo}
          >
            {salvo ? 'Registrado' : 'Salvar'}
          </Botao>
          {salvo && (
            <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <Check size={15} />
              Hoje já está registrado
            </span>
          )}
        </div>
      </div>
    </Cartao>
  )
}
