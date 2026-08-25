import { motion } from 'framer-motion'
import { BookOpen, Star, Trash2, CheckCircle2 } from 'lucide-react'
import type { Book } from '@/compartilhado/tipo/banco'
import { percent } from '@/compartilhado/utilitario/formato'

const STATUS_LABEL: Record<Book['status'], string> = {
  reading: 'Lendo',
  finished: 'Finalizado',
  want_to_read: 'Quero ler',
  dropped: 'Abandonado'
}

const STATUS_STYLE: Record<Book['status'], string> = {
  reading: 'bg-aurora-50 text-aurora-700 dark:bg-aurora-900/40 dark:text-aurora-300',
  finished: 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  want_to_read: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  dropped: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300'
}

interface BookCardProps {
  book: Book
  onProgress: (book: Book, pages: number) => void
  onFinish: (book: Book) => void
  onDelete: (book: Book) => void
}

export function BookCard({ book, onProgress, onFinish, onDelete }: BookCardProps) {
  const progress = percent(book.pages_read || 0, book.pages_total || 0)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex gap-4"
    >
      {book.cover_url ? (
        <img
          src={book.cover_url}
          alt={book.title}
          className="h-28 w-20 object-cover rounded-lg shrink-0 bg-gray-100 dark:bg-gray-700"
        />
      ) : (
        <div className="h-28 w-20 rounded-lg shrink-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
          <BookOpen size={22} />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white truncate">{book.title}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{book.author}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${STATUS_STYLE[book.status]}`}>
            {STATUS_LABEL[book.status]}
          </span>
        </div>

        {book.rating ? (
          <div className="flex items-center gap-0.5 mt-1 text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={13} fill={i < (book.rating || 0) ? 'currentColor' : 'none'} />
            ))}
          </div>
        ) : null}

        {!!book.pages_total && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>
                {book.pages_read || 0} / {book.pages_total} páginas
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <motion.div
                className="h-full bg-aurora-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mt-3">
          {book.status === 'reading' && (
            <>
              <input
                type="number"
                min={0}
                max={book.pages_total || undefined}
                defaultValue={book.pages_read || 0}
                onBlur={e => {
                  const value = Number(e.target.value)
                  if (value !== (book.pages_read || 0)) onProgress(book, value)
                }}
                className="w-24 px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                aria-label="Páginas lidas"
              />
              <button
                onClick={() => onFinish(book)}
                className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400 hover:underline"
              >
                <CheckCircle2 size={15} /> Finalizar
              </button>
            </>
          )}
          <button
            onClick={() => onDelete(book)}
            className="ml-auto p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
            aria-label="Excluir livro"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
