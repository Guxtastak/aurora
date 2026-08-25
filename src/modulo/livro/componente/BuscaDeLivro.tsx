import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { ServicoDeLivros } from '@/compartilhado/fonte/fonteDeDados'
import type { LivroDoGoogle } from '@/modulo/livro/servico'
import { Botao } from '@/compartilhado/componente/Botao'
import { Carregando } from '@/compartilhado/componente/Carregando'

interface BuscaDeLivroProps {
  onAdded: () => void
}

export function BuscaDeLivro({ onAdded }: BuscaDeLivroProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LivroDoGoogle[]>([])
  const [carregando, setCarregando] = useState(false)
  const [idSendoAdicionado, setIdSendoAdicionado] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setCarregando(true)
    setError('')
    try {
      const items = await ServicoDeLivros.buscarNoGoogleBooks(query, 10)
      setResults(items)
      if (items.length === 0) setError('Nenhum livro encontrado')
    } catch (err: any) {
      setError(err.message || 'Erro na busca')
    } finally {
      setCarregando(false)
    }
  }

  const handleAdd = async (googleBookId: string) => {
    setIdSendoAdicionado(googleBookId)
    setError('')
    try {
      await ServicoDeLivros.adicionarLivroDoGoogle(googleBookId)
      onAdded()
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar livro')
    } finally {
      setIdSendoAdicionado(null)
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
        <Botao type="submit" icon={<Search size={16} />} carregando={carregando}>
          Buscar
        </Botao>
      </form>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {carregando ? (
        <Carregando label="Buscando no Google Books..." />
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
              <Botao
                size="sm"
                variant="secondary"
                icon={<Plus size={14} />}
                carregando={idSendoAdicionado === item.id}
                onClick={() => handleAdd(item.id)}
              >
                Adicionar
              </Botao>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
