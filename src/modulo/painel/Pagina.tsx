import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Repeat, BookOpen, Wallet, Flame, Sparkles, Check } from 'lucide-react'
import { ServicoDeHabitos } from '@/compartilhado/fonte/fonteDeDados'
import { ServicoDeLivros } from '@/compartilhado/fonte/fonteDeDados'
import { ServicoDeFinancas } from '@/compartilhado/fonte/fonteDeDados'
import { ServicoDeInsights } from '@/compartilhado/fonte/fonteDeDados'
import type { Habito, Livro } from '@/compartilhado/tipo/banco'
import { CartaoIndicador } from '@/compartilhado/componente/CartaoIndicador'
import { Cartao } from '@/compartilhado/componente/Cartao'
import { RegistroDoDia } from '@/modulo/humor/componente/RegistroDoDia'
import { Botao } from '@/compartilhado/componente/Botao'
import { Carregando } from '@/compartilhado/componente/Carregando'
import { EstadoVazio } from '@/compartilhado/componente/EstadoVazio'
import { formatarMoeda, porcentagem, dataDeHoje, paraDataISO } from '@/compartilhado/utilitario/formato'
import { useAutenticacao } from '@/compartilhado/gancho/useAutenticacao'

interface DayPoint {
  day: string
  concluidos: number
}

export function PaginaInicial() {
  const { user } = useAutenticacao()
  const [habits, setHabits] = useState<Habito[]>([])
  const [books, setBooks] = useState<Livro[]>([])
  const [balance, setBalance] = useState({ balance: 0, totalIncome: 0, totalExpenses: 0 })
  const [dadosDaSemana, setDadosDaSemana] = useState<DayPoint[]>([])
  const [carregando, setCarregando] = useState(true)
  const [error, setError] = useState('')
  const [insight, setInsight] = useState<string>('')
  const [gerando, setGerando] = useState(false)

  const load = async () => {
    try {
      setError('')
      const start = new Date()
      start.setDate(start.getDate() - 6)
      const startISO = paraDataISO(start)

      const [habitsData, booksData, balanceData, logs] = await Promise.all([
        ServicoDeHabitos.listarHabitosComStatusDeHoje(),
        ServicoDeLivros.listarLivros(),
        ServicoDeFinancas.obterSaldo(),
        ServicoDeHabitos.listarMarcacoesDesde(startISO)
      ])

      setHabits(habitsData)
      setBooks(booksData)
      setBalance(balanceData)

      // Monta os ultimos 7 dias
      const days: DayPoint[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const iso = paraDataISO(date)
        days.push({
          day: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
          concluidos: logs.filter(l => l.date === iso).length
        })
      }
      setDadosDaSemana(days)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar o dashboard')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleToggle = async (habit: Habito) => {
    setHabits(prev =>
      prev.map(h => (h.id === habit.id ? { ...h, completed_today: !h.completed_today } : h))
    )
    try {
      await ServicoDeHabitos.alternarHabitoDeHoje(habit.id)
      await load()
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar hábito')
      await load()
    }
  }

  const aoGerarInsight = async () => {
    setGerando(true)
    try {
      const result = await ServicoDeInsights.gerarInsightDoDia()
      const data = result.metadata
      setInsight(
        `Você concluiu ${data.habits.completedToday} de ${data.habits.total} hábitos hoje ` +
          `(${Math.round(data.habits.completionRate)}%), está lendo ${data.books.reading} livro(s) ` +
          `e seu saldo é de ${formatarMoeda(data.finances.balance)}.`
      )
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar insight')
    } finally {
      setGerando(false)
    }
  }

  if (carregando) return <Carregando label="Montando seu dashboard..." />

  const doneToday = habits.filter(h => h.completed_today).length
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.current_streak || 0), 0)
  const reading = books.filter(b => b.status === 'reading')
  const finished = books.filter(b => b.status === 'finished')
  const firstName = user?.email?.split('@')[0] || 'você'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Olá, {firstName} 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Resumo de {new Date(`${dataDeHoje()}T00:00:00`).toLocaleDateString('pt-BR')}
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2">{error}</p>
      )}

      <RegistroDoDia />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CartaoIndicador
          label="Hábitos hoje"
          value={`${doneToday}/${habits.length}`}
          hint={`${porcentagem(doneToday, habits.length)}% concluído`}
          icon={<Repeat size={18} />}
          delay={0}
        />
        <CartaoIndicador
          label="Sequência atual"
          value={`${bestStreak} dias`}
          accent="amber"
          icon={<Flame size={18} />}
          delay={0.05}
        />
        <CartaoIndicador
          label="Lendo agora"
          value={reading.length}
          hint={`${finished.length} finalizado(s)`}
          accent="green"
          icon={<BookOpen size={18} />}
          delay={0.1}
        />
        <CartaoIndicador
          label="Saldo"
          value={formatarMoeda(balance.balance)}
          hint={`${formatarMoeda(balance.totalIncome)} entradas`}
          accent={balance.balance >= 0 ? 'green' : 'red'}
          icon={<Wallet size={18} />}
          delay={0.15}
        />
      </div>

      <Cartao
        title="Insight do dia"
        subtitle="Um resumo cruzando hábitos, leitura e finanças"
        action={
          <Botao size="sm" variant="secondary" icon={<Sparkles size={14} />} carregando={gerando} onClick={aoGerarInsight}>
            Gerar
          </Botao>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {insight || 'Clique em "Gerar" para calcular e salvar o resumo de hoje.'}
        </p>
      </Cartao>

      <div className="grid gap-4 lg:grid-cols-2">
        <Cartao title="Hábitos dos últimos 7 dias" subtitle="Total de conclusões por dia">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosDaSemana}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip />
                <Bar dataKey="concluidos" fill="#3a6bff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Cartao>

        <Cartao
          title="Hábitos de hoje"
          subtitle="Marque direto por aqui"
          action={
            <Link to="/habitos" className="text-sm text-aurora-600 dark:text-aurora-400 hover:underline">
              ver todos
            </Link>
          }
        >
          {habits.length === 0 ? (
            <EstadoVazio
              title="Sem hábitos cadastrados"
              description="Crie hábitos para acompanhar sua rotina."
              action={
                <Link to="/habitos">
                  <Botao size="sm">Criar hábito</Botao>
                </Link>
              }
            />
          ) : (
            <ul className="space-y-2">
              {habits.slice(0, 6).map(habit => (
                <li key={habit.id} className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(habit)}
                    aria-label={habit.completed_today ? 'Desmarcar' : 'Marcar'}
                    className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                      habit.completed_today
                        ? 'bg-aurora-500 text-white'
                        : 'bg-gray-100 text-gray-400 hover:bg-aurora-100 dark:bg-gray-700'
                    }`}
                  >
                    <Check size={15} />
                  </button>
                  <span
                    className={`text-sm truncate ${
                      habit.completed_today
                        ? 'text-gray-400 line-through dark:text-gray-500'
                        : 'text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {habit.icon} {habit.name}
                  </span>
                  <span className="ml-auto text-xs text-amber-600 dark:text-amber-400 whitespace-nowrap">
                    {habit.current_streak || 0}d
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </div>

      <Cartao
        title="Leitura em andamento"
        action={
          <Link to="/livros" className="text-sm text-aurora-600 dark:text-aurora-400 hover:underline">
            ver biblioteca
          </Link>
        }
      >
        {reading.length === 0 ? (
          <EstadoVazio
            title="Nenhum livro em andamento"
            description="Adicione um livro para acompanhar seu progresso de leitura."
            action={
              <Link to="/livros">
                <Botao size="sm">Adicionar livro</Botao>
              </Link>
            }
          />
        ) : (
          <ul className="space-y-4">
            {reading.slice(0, 4).map(book => (
              <li key={book.id} className="flex items-center gap-3">
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} className="h-14 w-10 object-cover rounded" />
                ) : (
                  <div className="h-14 w-10 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                    <BookOpen size={16} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{book.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{book.author}</p>
                  <div className="h-1.5 mt-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full bg-aurora-500"
                      style={{ width: `${porcentagem(book.pages_read || 0, book.pages_total || 0)}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {porcentagem(book.pages_read || 0, book.pages_total || 0)}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </div>
  )
}
