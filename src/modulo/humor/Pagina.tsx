/**
 * Tela de Humor (/humor): marcação do dia, médias de 30 dias, gráfico de
 * tendência, a comparação com os hábitos e o histórico.
 */
import { useState } from 'react'
import { Smile, Zap, CalendarCheck } from 'lucide-react'
import { ServicoDeHumor, ServicoDeInsights } from '@/compartilhado/fonte/fonteDeDados'
import { useDados } from '@/compartilhado/gancho/useDados'
import type { RegistroDeHumor } from '@/compartilhado/tipo/banco'
import type { ComparacaoDeHabito } from '@/modulo/humor/regraDeComparacao'
import { RegistroDoDia } from '@/modulo/humor/componente/RegistroDoDia'
import { GraficoDeTendencia } from '@/modulo/humor/componente/GraficoDeTendencia'
import { ComparacaoComHabitos } from '@/modulo/humor/componente/ComparacaoComHabitos'
import { Historico } from '@/modulo/humor/componente/Historico'
import { FormularioDeEdicao } from '@/modulo/humor/componente/FormularioDeEdicao'
import { Modal } from '@/compartilhado/componente/Modal'
import { CartaoIndicador } from '@/compartilhado/componente/CartaoIndicador'
import { Carregando } from '@/compartilhado/componente/Carregando'
import { EstadoVazio } from '@/compartilhado/componente/EstadoVazio'
import { formatarData } from '@/compartilhado/utilitario/formato'

/** Media com uma casa decimal e virgula, ou travessao quando nao ha dado */
function media(valores: number[]) {
  if (!valores.length) return '—'
  const total = valores.reduce((soma, valor) => soma + valor, 0)
  return (total / valores.length).toFixed(1).replace('.', ',')
}

export function PaginaDeHumor() {
  // Os dois vem juntos porque a comparacao depende dos mesmos dias de humor
  const { dados, setDados, carregando, erro, setErro, recarregar } = useDados(
    async () => {
      const [registros, comparacoes] = await Promise.all([
        ServicoDeHumor.listarRegistrosDeHumor(30),
        ServicoDeInsights.obterComparacaoDosHabitos()
      ])
      return { registros, comparacoes }
    },
    { registros: [] as RegistroDeHumor[], comparacoes: [] as ComparacaoDeHabito[] },
    { aoFalhar: 'Erro ao carregar o humor' }
  )

  const { registros, comparacoes } = dados
  const [emEdicao, setEmEdicao] = useState<RegistroDeHumor | null>(null)

  const aoEditar = async (values: { mood: number; energy: number; notes?: string }) => {
    if (!emEdicao) return
    try {
      await ServicoDeHumor.gravarRegistroDoDia({ date: emEdicao.date, ...values })
      setEmEdicao(null)
      await recarregar()
    } catch (falha: any) {
      setErro(falha.message || 'Erro ao salvar o registro')
    }
  }

  const aoExcluir = async (log: RegistroDeHumor) => {
    if (!window.confirm(`Excluir o registro de ${formatarData(log.date)}?`)) return
    try {
      await ServicoDeHumor.excluirRegistro(log.id)
      setDados(anterior => ({
        ...anterior,
        registros: anterior.registros.filter(item => item.id !== log.id)
      }))
    } catch (falha: any) {
      setErro(falha.message || 'Erro ao excluir o registro')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Humor</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Como você tem se sentido, e o que isso tem a ver com seus hábitos
        </p>
      </div>

      {erro && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2">{erro}</p>
      )}

      <RegistroDoDia onSaved={recarregar} />

      {carregando ? (
        <Carregando label="Carregando seus registros..." />
      ) : registros.length === 0 ? (
        <EstadoVazio
          icon={<Smile size={40} />}
          title="Nenhum dia registrado ainda"
          description="Marque o humor de hoje no card acima. Com alguns dias registrados, dá para comparar com seus hábitos."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <CartaoIndicador
              label="Humor médio"
              value={media(registros.map(log => log.mood))}
              hint="últimos 30 dias"
              icon={<Smile size={18} />}
            />
            <CartaoIndicador
              label="Energia média"
              value={media(registros.map(log => log.energy))}
              hint="últimos 30 dias"
              accent="green"
              icon={<Zap size={18} />}
            />
            <CartaoIndicador
              label="Dias registrados"
              value={registros.length}
              hint="de 30 dias"
              accent="amber"
              icon={<CalendarCheck size={18} />}
            />
          </div>

          <GraficoDeTendencia logs={registros} />
          <ComparacaoComHabitos comparacoes={comparacoes} />
          <Historico logs={registros} onEdit={setEmEdicao} onDelete={aoExcluir} />
        </>
      )}

      <Modal open={!!emEdicao} onClose={() => setEmEdicao(null)} title="Editar registro">
        {emEdicao && (
          <FormularioDeEdicao log={emEdicao} onSubmit={aoEditar} onCancel={() => setEmEdicao(null)} />
        )}
      </Modal>
    </div>
  )
}
