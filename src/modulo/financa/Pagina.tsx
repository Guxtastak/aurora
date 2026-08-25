/**
 * Tela de Finanças (/financas): saldo, entradas e saídas do mês escolhido,
 * gráfico por categoria e a cotação do dólar.
 */
import { useEffect, useState } from 'react'
import { useDados } from '@/compartilhado/gancho/useDados'
import { Plus, TrendingUp, TrendingDown, Wallet, DollarSign } from 'lucide-react'
import { ServicoDeFinancas } from '@/compartilhado/fonte/fonteDeDados'
import type { Transacao } from '@/compartilhado/tipo/banco'
import { FormularioDeTransacao } from '@/modulo/financa/componente/FormularioDeTransacao'
import type { ValoresDaTransacao } from '@/modulo/financa/componente/FormularioDeTransacao'
import { ListaDeTransacoes } from '@/modulo/financa/componente/ListaDeTransacoes'
import { GraficoPorCategoria } from '@/modulo/financa/componente/GraficoPorCategoria'
import { Modal } from '@/compartilhado/componente/Modal'
import { Botao } from '@/compartilhado/componente/Botao'
import { Cartao } from '@/compartilhado/componente/Cartao'
import { Carregando } from '@/compartilhado/componente/Carregando'
import { EstadoVazio } from '@/compartilhado/componente/EstadoVazio'
import { CartaoIndicador } from '@/compartilhado/componente/CartaoIndicador'
import { formatarMoeda, MESES } from '@/compartilhado/utilitario/formato'

export function PaginaDeFinancas() {
  const {
    dados: transacoes,
    setDados: setTransacoes,
    carregando,
    erro,
    setErro,
    recarregar
  } = useDados(() => ServicoDeFinancas.listarTransacoes(), [] as Transacao[], {
    aoFalhar: 'Erro ao carregar transações'
  })

  const [modalAberto, setModalAberto] = useState(false)
  const [cotacao, setCotacao] = useState<number | null>(null)

  const now = new Date()
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [year] = useState(now.getFullYear())

  // A cotacao e enfeite: se a API de fora falhar, a tela some com o valor e
  // segue funcionando, entao ela nao passa pelo useDados.
  useEffect(() => {
    ServicoDeFinancas.obterCotacaoDoDolar('USD', 'BRL')
      .then(resposta => setCotacao(resposta.rate))
      .catch(() => setCotacao(null))
  }, [])

  const aoAdicionar = async (values: ValoresDaTransacao) => {
    try {
      await ServicoDeFinancas.adicionarTransacao(values)
      setModalAberto(false)
      await recarregar()
    } catch (falha: any) {
      setErro(falha.message || 'Erro ao salvar transação')
    }
  }

  const aoExcluir = async (transaction: Transacao) => {
    if (!window.confirm('Excluir esta transação?')) return
    try {
      await ServicoDeFinancas.excluirTransacao(transaction.id)
      setTransacoes(prev => prev.filter(t => t.id !== transaction.id))
    } catch (falha: any) {
      setErro(falha.message || 'Erro ao excluir transação')
    }
  }

  const prefixoDoMes = `${year}-${String(mes).padStart(2, '0')}`
  const monthTransactions = transacoes.filter(t => t.date.startsWith(prefixoDoMes))

  const income = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const expenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalIncome = transacoes
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const totalExpenses = transacoes
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const byCategory = Object.entries(
    monthTransactions
      .filter(t => t.type === 'expense')
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount)
        return acc
      }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finanças</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Receitas, despesas e saldo do mês
            {cotacao !== null && ` · USD ${formatarMoeda(cotacao)}`}
          </p>
        </div>
        <Botao icon={<Plus size={16} />} onClick={() => setModalAberto(true)}>
          Nova transação
        </Botao>
      </div>

      {erro && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2">{erro}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CartaoIndicador
          label="Saldo total"
          value={formatarMoeda(totalIncome - totalExpenses)}
          icon={<Wallet size={18} />}
        />
        <CartaoIndicador
          label={`Receitas · ${MESES[mes - 1]}`}
          value={formatarMoeda(income)}
          accent="green"
          icon={<TrendingUp size={18} />}
        />
        <CartaoIndicador
          label={`Despesas · ${MESES[mes - 1]}`}
          value={formatarMoeda(expenses)}
          accent="red"
          icon={<TrendingDown size={18} />}
        />
        <CartaoIndicador
          label="Saldo do mês"
          value={formatarMoeda(income - expenses)}
          accent={income - expenses >= 0 ? 'green' : 'red'}
          icon={<DollarSign size={18} />}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {MESES.map((label, index) => (
          <button
            key={label}
            onClick={() => setMes(index + 1)}
            className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
              mes === index + 1
                ? 'bg-aurora-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {label.slice(0, 3)}
          </button>
        ))}
      </div>

      {carregando ? (
        <Carregando label="Carregando transações..." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Cartao title="Despesas por categoria" subtitle={`${MESES[mes - 1]} de ${year}`}>
            <GraficoPorCategoria data={byCategory} />
          </Cartao>

          <Cartao title="Transações do mês" subtitle={`${monthTransactions.length} lançamento(s)`}>
            {monthTransactions.length === 0 ? (
              <EstadoVazio
                title="Nenhuma transação neste mês"
                description="Adicione receitas e despesas para acompanhar seu saldo."
                action={
                  <Botao size="sm" icon={<Plus size={14} />} onClick={() => setModalAberto(true)}>
                    Adicionar
                  </Botao>
                }
              />
            ) : (
              <ListaDeTransacoes transacoes={monthTransactions} onDelete={aoExcluir} />
            )}
          </Cartao>
        </div>
      )}

      <Modal open={modalAberto} onClose={() => setModalAberto(false)} title="Nova transação">
        <FormularioDeTransacao onSubmit={aoAdicionar} onCancel={() => setModalAberto(false)} />
      </Modal>
    </div>
  )
}
