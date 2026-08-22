import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { BookService } from '../../services/bookService'
import type { GoogleBook } from '../../services/bookService'
import { Button } from '../common/Button'
import { Loading } from '../common/Loading'

interface BookSearchProps {
  onAdded: () => void
}

export function BookSearch({ onAdded }: BookSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GoogleBook[]>([])
  const [loading, setLoading] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    try {
      const items = await BookService.searchGoogleBooks(query, 10)
      setResults(items)
      if (items.length === 0) setError('Nenhum livro encontrado')
    } catch (err: any) {
      setError(err.message || 'Erro na busca')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (googleBookId: string) => {
    setAddingId(googleBookId)
    setError('')
    try {
      await BookService.addBookFromGoogle(googleBookId)
      onAdded()
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar livro')
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Título, autor ou ISBN"
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-aurora-500 outline-none"
        />
        <Button type="submit" icon={<Search size={16} />} loading={loading}>
          Buscar
        </Button>
      </form>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading ? (
        <Loading label="Buscando no Google Books..." />
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
          {results.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {item.volumeInfo.imageLinks?.thumbnail && (
                <img
                  src={item.volumeInfo.imageLinks.thumbnail}
                  alt={item.volumeInfo.title}
                  className="h-16 w-11 object-cover rounded"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {item.volumeInfo.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {item.volumeInfo.authors?.join(', ') || 'Autor desconhecido'}
                  {item.volumeInfo.pageCount ? ` · ${item.volumeInfo.pageCount} págs` : ''}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                icon={<Plus size={14} />}
                loading={addingId === item.id}
                onClick={() => handleAdd(item.id)}
              >
                Adicionar
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
