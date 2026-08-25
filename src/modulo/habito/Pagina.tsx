/**
 * Tela de Hábitos (/habitos): lista, marcação do dia, criação e edição.
 *
 * A marcação é otimista — a tela muda na hora e só depois confirma com o
 * servidor; se falhar, volta atrás.
 */
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Plus, Repeat } from 'lucide-react'
import { ServicoDeHabitos } from '@/compartilhado/fonte/fonteDeDados'
import { useDados } from '@/compartilhado/gancho/useDados'
import type { Habito } from '@/compartilhado/tipo/banco'
import { CartaoDeHabito } from '@/modulo/habito/componente/CartaoDeHabito'
import { FormularioDeHabito } from '@/modulo/habito/componente/FormularioDeHabito'
import type { ValoresDoHabito } from '@/modulo/habito/componente/FormularioDeHabito'
import { Modal } from '@/compartilhado/componente/Modal'
import { Botao } from '@/compartilhado/componente/Botao'
import { Carregando } from '@/compartilhado/componente/Carregando'
import { EstadoVazio } from '@/compartilhado/componente/EstadoVazio'
import { CartaoIndicador } from '@/compartilhado/componente/CartaoIndicador'
import { porcentagem } from '@/compartilhado/utilitario/formato'

export function PaginaDeHabitos() {
  const {
    dados: habitos,
    setDados: setHabitos,
    carregando,
    erro,
    setErro,
    recarregar
  } = useDados(() => ServicoDeHabitos.listarHabitosComStatusDeHoje(), [] as Habito[], {
    aoFalhar: 'Erro ao carregar hábitos'
  })

  const [modalAberto, setModalAberto] = useState(false)
  const [emEdicao, setEmEdicao] = useState<Habito | null>(null)
  const [idOcupado, setIdOcupado] = useState<string | null>(null)

  const aoAlternar = async (habit: Habito) => {
    setIdOcupado(habit.id)
    // Atualização otimista
    setHabitos(prev =>
      prev.map(h => (h.id === habit.id ? { ...h, completed_today: !h.completed_today } : h))
    )
    try {
      await ServicoDeHabitos.alternarHabitoDeHoje(habit.id)
      await recarregar()
    } catch (falha: any) {
      setErro(falha.message || 'Erro ao atualizar hábito')
      await recarregar()
    } finally {
      setIdOcupado(null)
    }
  }

  const aoEnviar = async (values: ValoresDoHabito) => {
    try {
      if (emEdicao) {
        await ServicoDeHabitos.atualizarHabito(emEdicao.id, values)
      } else {
        await ServicoDeHabitos.criarHabito(values)
      }
      setModalAberto(false)
      setEmEdicao(null)
      await recarregar()
    } catch (falha: any) {
      setErro(falha.message || 'Erro ao salvar hábito')
    }
  }

  const aoExcluir = async (habit: Habito) => {
    if (!window.confirm(`Excluir o hábito "${habit.name}"?`)) return
    try {
      await ServicoDeHabitos.excluirHabito(habit.id)
      setHabitos(prev => prev.filter(h => h.id !== habit.id))
    } catch (falha: any) {
      setErro(falha.message || 'Erro ao excluir hábito')
    }
  }

  const doneToday = habitos.filter(h => h.completed_today).length
  const bestStreak = habitos.reduce((max, h) => Math.max(max, h.best_streak || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hábitos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Marque o que você concluiu hoje e mantenha a sequência
          </p>
        </div>
        <Botao
          icon={<Plus size={16} />}
          onClick={() => {
            setEmEdicao(null)
            setModalAberto(true)
          }}
        >
          Novo hábito
        </Botao>
      </div>

      {erro && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2">{erro}</p>
      )}

      {carregando ? (
        <Carregando label="Carregando hábitos..." />
      ) : habitos.length === 0 ? (
        <EstadoVazio
          icon={<Repeat size={40} />}
          title="Nenhum hábito ainda"
          description="Crie seu primeiro hábito e comece a construir consistência."
          action={
            <Botao icon={<Plus size={16} />} onClick={() => setModalAberto(true)}>
              Criar hábito
            </Botao>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <CartaoIndicador label="Concluídos hoje" value={`${doneToday}/${habitos.length}`} />
            <CartaoIndicador
              label="Taxa do dia"
              value={`${porcentagem(doneToday, habitos.length)}%`}
              accent="green"
            />
            <CartaoIndicador label="Melhor sequência" value={`${bestStreak} dias`} accent="amber" />
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {habitos.map(habit => (
                <CartaoDeHabito
                  key={habit.id}
                  habit={habit}
                  busy={idOcupado === habit.id}
                  onToggle={aoAlternar}
                  onEdit={h => {
                    setEmEdicao(h)
                    setModalAberto(true)
                  }}
                  onDelete={aoExcluir}
                />
              ))}
            </AnimatePresence>
          </div>
        </>
      )}

      <Modal
        open={modalAberto}
        onClose={() => {
          setModalAberto(false)
          setEmEdicao(null)
        }}
        title={emEdicao ? 'Editar hábito' : 'Novo hábito'}
      >
        <FormularioDeHabito
          habit={emEdicao}
          onSubmit={aoEnviar}
          onCancel={() => {
            setModalAberto(false)
            setEmEdicao(null)
          }}
        />
      </Modal>
    </div>
  )
}
