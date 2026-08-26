/**
 * Tudo que o app faz com livros: no Supabase e também na API do Google
 * Books, que é de onde vem a capa e a contagem de páginas.
 */
import { supabase } from '@/compartilhado/fonte/supabase'
import type { Livro } from '@/compartilhado/tipo/banco'
import { dataDeHoje } from '@/compartilhado/utilitario/formato'

export interface LivroDoGoogle {
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

export class ServicoDeLivros {
  /**
   * Busca todos os livros do usuário
   */
  static async listarLivros() {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Livro[]
  }

  /**
   * Busca livros por status
   */
  static async listarLivrosPorStatus(status: Livro['status']) {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Livro[]
  }

  /**
   * Busca livro por ID
   */
  static async buscarLivroPorId(id: string) {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Livro
  }

  /**
   * Busca livros na API do Google Books
   */
  static async buscarNoGoogleBooks(query: string, maxResults: number = 10) {
    const response = await fetch(
      withKey(`${GOOGLE_BOOKS_URL}?q=${encodeURIComponent(query)}&maxResults=${maxResults}`)
    )

    if (!response.ok) {
      throw new Error('Erro ao buscar livros no Google Books')
    }

    const data = await response.json()
    return (data.items || []) as LivroDoGoogle[]
  }

  /**
   * Adiciona um livro usando dados do Google Books
   */
  static async adicionarLivroDoGoogle(googleBookId: string) {
    const response = await fetch(withKey(`${GOOGLE_BOOKS_URL}/${googleBookId}`))

    if (!response.ok) {
      throw new Error('Erro ao buscar detalhes do livro')
    }

    const bookData: LivroDoGoogle = await response.json()
    const volumeInfo = bookData.volumeInfo

    const book = {
      title: volumeInfo.title || 'Título desconhecido',
      author: volumeInfo.authors?.[0] || 'Autor desconhecido',
      cover_url: volumeInfo.imageLinks?.thumbnail || '',
      pages_total: volumeInfo.pageCount || 0,
      pages_read: 0,
      google_books_id: googleBookId,
      status: 'reading' as const,
      started_date: dataDeHoje()
    }

    const { data, error } = await supabase
      .from('books')
      .insert(book)
      .select()
      .single()

    if (error) throw error
    return data as Livro
  }

  /**
   * Adiciona um livro manualmente
   */
  static async adicionarLivro(book: Omit<Livro, 'id' | 'created_at' | 'updated_at' | 'user_id'>) {
    const { data, error } = await supabase
      .from('books')
      .insert(book)
      .select()
      .single()

    if (error) throw error
    return data as Livro
  }

  /**
   * Atualiza um livro
   */
  static async atualizarLivro(id: string, updates: Partial<Omit<Livro, 'id' | 'created_at' | 'updated_at'>>) {
    const { data, error } = await supabase
      .from('books')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Livro
  }

  /**
   * Atualiza o progresso de leitura
   */
  static async atualizarProgresso(id: string, pagesRead: number) {
    const { data, error } = await supabase
      .from('books')
      .update({ pages_read: pagesRead })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Livro
  }

  /**
   * Marca livro como finalizado
   */
  static async finalizarLivro(id: string, rating?: number) {
    const updates: Partial<Omit<Livro, 'id'>> = {
      status: 'finished',
      finished_date: dataDeHoje()
    }

    if (rating) updates.rating = rating

    const { data, error } = await supabase
      .from('books')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Livro
  }

  /**
   * Remove um livro
   */
  static async excluirLivro(id: string) {
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Busca estatísticas de leitura
   */
  static async obterEstatisticasDeLeitura() {
    const books = await this.listarLivros()
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
