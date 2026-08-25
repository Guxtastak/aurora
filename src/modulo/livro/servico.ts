import { supabase } from '@/compartilhado/fonte/supabase'
import type { Book } from '@/compartilhado/tipo/banco'
import { todayISO } from '@/compartilhado/utilitario/formato'

export interface GoogleBook {
  id: string
  volumeInfo: {
    title: string
    authors?: string[]
    imageLinks?: {
      thumbnail: string
    }
    pageCount?: number
    publishedDate?: string
    description?: string
  }
}

const GOOGLE_BOOKS_URL = 'https://www.googleapis.com/books/v1/volumes'

/** A chave é opcional: a API do Google Books aceita consultas anônimas (com quota menor) */
function withKey(url: string) {
  const key = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY
  if (!key || key === 'sua_chave_aqui') return url
  return `${url}${url.includes('?') ? '&' : '?'}key=${key}`
}

export class BookService {
  /**
   * Busca todos os livros do usuário
   */
  static async getBooks() {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Book[]
  }

  /**
   * Busca livros por status
   */
  static async getBooksByStatus(status: Book['status']) {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Book[]
  }

  /**
   * Busca livro por ID
   */
  static async getBookById(id: string) {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Book
  }

  /**
   * Busca livros na API do Google Books
   */
  static async searchGoogleBooks(query: string, maxResults: number = 10) {
    const response = await fetch(
      withKey(`${GOOGLE_BOOKS_URL}?q=${encodeURIComponent(query)}&maxResults=${maxResults}`)
    )

    if (!response.ok) {
      throw new Error('Erro ao buscar livros no Google Books')
    }

    const data = await response.json()
    return (data.items || []) as GoogleBook[]
  }

  /**
   * Adiciona um livro usando dados do Google Books
   */
  static async addBookFromGoogle(googleBookId: string) {
    const response = await fetch(withKey(`${GOOGLE_BOOKS_URL}/${googleBookId}`))

    if (!response.ok) {
      throw new Error('Erro ao buscar detalhes do livro')
    }

    const bookData: GoogleBook = await response.json()
    const volumeInfo = bookData.volumeInfo

    const book = {
      title: volumeInfo.title || 'Título desconhecido',
      author: volumeInfo.authors?.[0] || 'Autor desconhecido',
      cover_url: volumeInfo.imageLinks?.thumbnail || '',
      pages_total: volumeInfo.pageCount || 0,
      pages_read: 0,
      google_books_id: googleBookId,
      status: 'reading' as const,
      started_date: todayISO()
    }

    const { data, error } = await supabase
      .from('books')
      .insert(book)
      .select()
      .single()

    if (error) throw error
    return data as Book
  }

  /**
   * Adiciona um livro manualmente
   */
  static async addBook(book: Omit<Book, 'id' | 'created_at' | 'updated_at' | 'user_id'>) {
    const { data, error } = await supabase
      .from('books')
      .insert(book)
      .select()
      .single()

    if (error) throw error
    return data as Book
  }

  /**
   * Atualiza um livro
   */
  static async updateBook(id: string, updates: Partial<Omit<Book, 'id' | 'created_at' | 'updated_at'>>) {
    const { data, error } = await supabase
      .from('books')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Book
  }

  /**
   * Atualiza o progresso de leitura
   */
  static async updateProgress(id: string, pagesRead: number) {
    const { data, error } = await supabase
      .from('books')
      .update({ pages_read: pagesRead })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Book
  }

  /**
   * Marca livro como finalizado
   */
  static async finishBook(id: string, rating?: number) {
    const updates: Partial<Omit<Book, 'id'>> = {
      status: 'finished',
      finished_date: todayISO()
    }

    if (rating) updates.rating = rating

    const { data, error } = await supabase
      .from('books')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Book
  }

  /**
   * Remove um livro
   */
  static async deleteBook(id: string) {
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Busca estatísticas de leitura
   */
  static async getReadingStats() {
    const books = await this.getBooks()
    const finished = books.filter(b => b.status === 'finished')
    const reading = books.filter(b => b.status === 'reading')

    return {
      total: books.length,
      reading: reading.length,
      finished: finished.length,
      totalPagesRead: finished.reduce((sum, b) => sum + (b.pages_total || 0), 0),
      averageRating: finished.reduce((sum, b) => sum + (b.rating || 0), 0) / (finished.length || 1)
    }
  }
}
