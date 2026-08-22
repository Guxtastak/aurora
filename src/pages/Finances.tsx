import { useEffect, useState } from 'react'
import { Plus, TrendingUp, TrendingDown, Wallet, DollarSign } from 'lucide-react'
import { FinanceService } from '../services/financeService'
import type { Finance } from '../types/database.types'
import { TransactionForm } from '../components/finances/TransactionForm'
import type { TransactionFormValues } from '../components/finances/TransactionForm'
import { TransactionList } from '../components/finances/TransactionList'
import { CategoryChart } from '../components/finances/CategoryChart'
import { Modal } from '../components/common/Modal'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { Loading } from '../components/common/Loading'
import { EmptyState } from '../components/common/EmptyState'
import { StatCard } from '../components/common/StatCard'
import { formatCurrency, MONTHS } from '../utils/format'

export function Finances() {
  const [transactions, setTransactions] = useState<Finance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [rate, setRate] = useState<number | null>(null)

  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year] = useState(now.getFullYear())

  const load = async () => {
    try {
      setError('')
      setTransactions(await FinanceService.getTransactions())
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar transações')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    FinanceService.getExchangeRate('USD', 'BRL')
      .then(r => setRate(r.rate))
      .catch(() => setRate(null))
  }, [])

  const handleAdd = async (values: TransactionFormValues) => {
    try {
      await FinanceService.addTransaction(values)
      setModalOpen(false)
      await load()
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar transação')
    }
  }

  const handleDelete = async (transaction: Finance) => {
    if (!window.confirm('Excluir esta transação?')) return
    try {
      await FinanceService.deleteTransaction(transaction.id)
      setTransactions(prev => prev.filter(t => t.id !== transaction.id))
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir transação')
    }
  }

  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`
  const monthTransactions = transactions.filter(t => t.date.startsWith(monthPrefix))

  const income = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const expenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const totalExpenses = transactions
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
            {rate !== null && ` · USD ${formatCurrency(rate)}`}
          </p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
          Nova transação
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2">{error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Saldo total"
          value={formatCurrency(totalIncome - totalExpenses)}
          icon={<Wallet size={18} />}
        />
        <StatCard
          label={`Receitas · ${MONTHS[month - 1]}`}
          value={formatCurrency(income)}
          accent="green"
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label={`Despesas · ${MONTHS[month - 1]}`}
          value={formatCurrency(expenses)}
          accent="red"
          icon={<TrendingDown size={18} />}
        />
        <StatCard
          label="Saldo do mês"
          value={formatCurrency(income - expenses)}
          accent={income - expenses >= 0 ? 'green' : 'red'}
          icon={<DollarSign size={18} />}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {MONTHS.map((label, index) => (
          <button
            key={label}
            onClick={() => setMonth(index + 1)}
            className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
              month === index + 1
                ? 'bg-aurora-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {label.slice(0, 3)}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading label="Carregando transações..." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Despesas por categoria" subtitle={`${MONTHS[month - 1]} de ${year}`}>
            <CategoryChart data={byCategory} />
          </Card>

          <Card title="Transações do mês" subtitle={`${monthTransactions.length} lançamento(s)`}>
            {monthTransactions.length === 0 ? (
              <EmptyState
                title="Nenhuma transação neste mês"
                description="Adicione receitas e despesas para acompanhar seu saldo."
                action={
                  <Button size="sm" icon={<Plus size={14} />} onClick={() => setModalOpen(true)}>
                    Adicionar
                  </Button>
                }
              />
            ) : (
              <TransactionList transactions={monthTransactions} onDelete={handleDelete} />
            )}
          </Card>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova transação">
        <TransactionForm onSubmit={handleAdd} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  )
}
