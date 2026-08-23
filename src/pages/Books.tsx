import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { BookOpen, Plus, Search } from 'lucide-react'
import { BookService } from '../services/data'
import type { Book } from '../types/database.types'
import { BookCard } from '../components/books/BookCard'
import { BookSearch } from '../components/books/BookSearch'
import { BookForm } from '../components/books/BookForm'
import type { BookFormValues } from '../components/books/BookForm'
import { Modal } from '../components/common/Modal'
import { Button } from '../components/common/Button'
import { Loading } from '../components/common/Loading'
import { EmptyState } from '../components/common/EmptyState'
import { StatCard } from '../components/common/StatCard'

type Filter = 'all' | Book['status']

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'reading', label: 'Lendo' },
  { key: 'finished', label: 'Finalizados' },
  { key: 'want_to_read', label: 'Quero ler' },
  { key: 'dropped', label: 'Abandonados' }
]

export function Books() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [searchOpen, setSearchOpen] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)

  const load = async () => {
    try {
      setError('')
      setBooks(await BookService.getBooks())
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar livros')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleProgress = async (book: Book, pages: number) => {
    try {
      const updated = await BookService.updateProgress(book.id, pages)
      setBooks(prev => prev.map(b => (b.id === book.id ? updated : b)))
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar progresso')
    }
  }

  const handleFinish = async (book: Book) => {
    const input = window.prompt('Nota de 1 a 5 (opcional):', '')
    const rating = input ? Number(input) : undefined
    try {
      const updated = await BookService.finishBook(
        book.id,
        rating && rating >= 1 && rating <= 5 ? rating : undefined
      )
      setBooks(prev => prev.map(b => (b.id === book.id ? updated : b)))
    } catch (err: any) {
      setError(err.message || 'Erro ao finalizar livro')
    }
  }

  const handleDelete = async (book: Book) => {
    if (!window.confirm(`Excluir "${book.title}"?`)) return
    try {
      await BookService.deleteBook(book.id)
      setBooks(prev => prev.filter(b => b.id !== book.id))
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir livro')
    }
  }

  const handleManualAdd = async (values: BookFormValues) => {
    try {
      await BookService.addBook(values)
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
          <Button variant="secondary" icon={<Plus size={16} />} onClick={() => setManualOpen(true)}>
            Manual
          </Button>
          <Button icon={<Search size={16} />} onClick={() => setSearchOpen(true)}>
            Buscar livro
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2">{error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Na biblioteca" value={books.length} />
        <StatCard label="Finalizados" value={finished.length} accent="green" />
        <StatCard label="Páginas lidas" value={pagesRead} accent="amber" />
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
        <Loading label="Carregando livros..." />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={40} />}
          title={books.length === 0 ? 'Sua biblioteca está vazia' : 'Nada neste filtro'}
          description={
            books.length === 0
              ? 'Busque um livro no Google Books ou cadastre manualmente.'
              : 'Tente outro filtro para ver seus livros.'
          }
          action={
            books.length === 0 ? (
              <Button icon={<Search size={16} />} onClick={() => setSearchOpen(true)}>
                Buscar livro
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <AnimatePresence>
            {visible.map(book => (
              <BookCard
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

      <Modal open={searchOpen} onClose={() => setSearchOpen(false)} title="Buscar no Google Books" maxWidth="max-w-lg">
        <BookSearch
          onAdded={() => {
            setSearchOpen(false)
            load()
          }}
        />
      </Modal>

      <Modal open={manualOpen} onClose={() => setManualOpen(false)} title="Adicionar livro manualmente">
        <BookForm onSubmit={handleManualAdd} onCancel={() => setManualOpen(false)} />
      </Modal>
    </div>
  )
}
