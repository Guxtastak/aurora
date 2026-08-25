import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { BookOpen, Plus, Search } from 'lucide-react'
import { ServicoDeLivros } from '@/compartilhado/fonte/fonteDeDados'
import type { Livro } from '@/compartilhado/tipo/banco'
import { CartaoDeLivro } from '@/modulo/livro/componente/CartaoDeLivro'
import { BuscaDeLivro } from '@/modulo/livro/componente/BuscaDeLivro'
import { FormularioDeLivro } from '@/modulo/livro/componente/FormularioDeLivro'
import type { ValoresDoLivro } from '@/modulo/livro/componente/FormularioDeLivro'
import { Modal } from '@/compartilhado/componente/Modal'
import { Botao } from '@/compartilhado/componente/Botao'
import { Carregando } from '@/compartilhado/componente/Carregando'
import { EstadoVazio } from '@/compartilhado/componente/EstadoVazio'
import { CartaoIndicador } from '@/compartilhado/componente/CartaoIndicador'

type Filter = 'all' | Livro['status']

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'reading', label: 'Lendo' },
  { key: 'finished', label: 'Finalizados' },
  { key: 'want_to_read', label: 'Quero ler' },
  { key: 'dropped', label: 'Abandonados' }
]

export function PaginaDeLivros() {
  const [books, setBooks] = useState<Livro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [searchOpen, setSearchOpen] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)

  const load = async () => {
    try {
      setError('')
      setBooks(await ServicoDeLivros.listarLivros())
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar livros')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleProgress = async (book: Livro, pages: number) => {
    try {
      const updated = await ServicoDeLivros.atualizarProgresso(book.id, pages)
      setBooks(prev => prev.map(b => (b.id === book.id ? updated : b)))
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar progresso')
    }
  }

  const handleFinish = async (book: Livro) => {
    const input = window.prompt('Nota de 1 a 5 (opcional):', '')
    const rating = input ? Number(input) : undefined
    try {
      const updated = await ServicoDeLivros.finalizarLivro(
        book.id,
        rating && rating >= 1 && rating <= 5 ? rating : undefined
      )
      setBooks(prev => prev.map(b => (b.id === book.id ? updated : b)))
    } catch (err: any) {
      setError(err.message || 'Erro ao finalizar livro')
    }
  }

  const handleDelete = async (book: Livro) => {
    if (!window.confirm(`Excluir "${book.title}"?`)) return
    try {
      await ServicoDeLivros.excluirLivro(book.id)
      setBooks(prev => prev.filter(b => b.id !== book.id))
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir livro')
    }
  }

  const handleManualAdd = async (values: ValoresDoLivro) => {
    try {
      await ServicoDeLivros.adicionarLivro(values)
      setManualOpen(false)
      await load()
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar livro')
    }
  }

  const visible = filter === 'all' ? books : books.filter(b => b.status === filter)
  const finished = books.filter(b => b.status === 'finished')
  const pagesRead = finished.reduce((sum, b) => sum + (b.pages_total || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Livros</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Sua biblioteca e progresso de leitura</p>
        </div>
        <div className="flex gap-2">
          <Botao variant="secondary" icon={<Plus size={16} />} onClick={() => setManualOpen(true)}>
            Manual
          </Botao>
          <Botao icon={<Search size={16} />} onClick={() => setSearchOpen(true)}>
            Buscar livro
          </Botao>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2">{error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <CartaoIndicador label="Na biblioteca" value={books.length} />
        <CartaoIndicador label="Finalizados" value={finished.length} accent="green" />
        <CartaoIndicador label="Páginas lidas" value={pagesRead} accent="amber" />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              filter === f.key
                ? 'bg-aurora-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Carregando label="Carregando livros..." />
      ) : visible.length === 0 ? (
        <EstadoVazio
          icon={<BookOpen size={40} />}
          title={books.length === 0 ? 'Sua biblioteca está vazia' : 'Nada neste filtro'}
          description={
            books.length === 0
              ? 'Busque um livro no Google PaginaDeLivros ou cadastre manualmente.'
              : 'Tente outro filtro para ver seus livros.'
          }
          action={
            books.length === 0 ? (
              <Botao icon={<Search size={16} />} onClick={() => setSearchOpen(true)}>
                Buscar livro
              </Botao>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <AnimatePresence>
            {visible.map(book => (
              <CartaoDeLivro
                key={book.id}
                book={book}
                onProgress={handleProgress}
                onFinish={handleFinish}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={searchOpen} onClose={() => setSearchOpen(false)} title="Buscar no Google PaginaDeLivros" maxWidth="max-w-lg">
        <BuscaDeLivro
          onAdded={() => {
            setSearchOpen(false)
            load()
          }}
        />
      </Modal>

      <Modal open={manualOpen} onClose={() => setManualOpen(false)} title="Adicionar livro manualmente">
        <FormularioDeLivro onSubmit={handleManualAdd} onCancel={() => setManualOpen(false)} />
      </Modal>
    </div>
  )
}
