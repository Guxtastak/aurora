import type { Livro } from '@/compartilhado/tipo/banco'
import { ServicoDeLivros } from '@/modulo/livro/servico'
import { agoraISO, gravarDemonstracao, hojeNaDemonstracao, lerDemonstracao, novoId, usuarioDaDemonstracao } from '@/compartilhado/fonte/armazenamentoDeDemonstracao'

/**
 * Livros no modo demonstração.
 *
 * Mesma lista de metodos do servico do lado (servico.ts), operando sobre o
 * localStorage em vez do Supabase. Quem escolhe entre os dois e o
 * compartilhado/fonte/fonteDeDados.ts.
 */
export class LivrosDaDemonstracao {
  // A busca no Google Books é uma API pública: continua usando a implementação real
  static buscarNoGoogleBooks = ServicoDeLivros.buscarNoGoogleBooks.bind(ServicoDeLivros)

  static async listarLivros() {
    return [...lerDemonstracao().books].sort((a, b) => b.created_at.localeCompare(a.created_at))
  }

  static async listarLivrosPorStatus(status: Livro['status']) {
    return (await this.listarLivros()).filter(b => b.status === status)
  }

  static async buscarLivroPorId(id: string) {
    return lerDemonstracao().books.find(b => b.id === id) as Livro
  }

  static async adicionarLivro(book: Omit<Livro, 'id' | 'created_at' | 'updated_at' | 'user_id'>) {
    const data = lerDemonstracao()
    const created: Livro = {
      ...book,
      id: novoId(),
      user_id: usuarioDaDemonstracao,
      created_at: agoraISO(),
      updated_at: agoraISO()
    }
    data.books = [created, ...data.books]
    gravarDemonstracao(data)
    return created
  }

  static async adicionarLivroDoGoogle(googleBookId: string) {
    const results = await ServicoDeLivros.buscarNoGoogleBooks(`id:${googleBookId}`, 1).catch(() => [])
    const volume = results[0]?.volumeInfo

    return this.adicionarLivro({
      title: volume?.title || 'Livro adicionado',
      author: volume?.authors?.[0] || 'Autor desconhecido',
      cover_url: volume?.imageLinks?.thumbnail || '',
      pages_total: volume?.pageCount || 0,
      pages_read: 0,
      google_books_id: googleBookId,
      status: 'reading',
      started_date: hojeNaDemonstracao()
    })
  }

  static async atualizarLivro(id: string, updates: Partial<Omit<Livro, 'id' | 'created_at' | 'updated_at'>>) {
    const data = lerDemonstracao()
    data.books = data.books.map(b => (b.id === id ? { ...b, ...updates, updated_at: agoraISO() } : b))
    gravarDemonstracao(data)
    return data.books.find(b => b.id === id) as Livro
  }

  static async atualizarProgresso(id: string, pagesRead: number) {
    return this.atualizarLivro(id, { pages_read: pagesRead })
  }

  static async finalizarLivro(id: string, rating?: number) {
    return this.atualizarLivro(id, {
      status: 'finished',
      finished_date: hojeNaDemonstracao(),
      ...(rating ? { rating } : {})
    })
  }

  static async excluirLivro(id: string) {
    const data = lerDemonstracao()
    data.books = data.books.filter(b => b.id !== id)
    gravarDemonstracao(data)
  }

  static async obterEstatisticasDeLeitura() {
    const books = await this.listarLivros()
    const finished = books.filter(b => b.status === 'finished')
    return {
      total: books.length,
      reading: books.filter(b => b.status === 'reading').length,
      finished: finished.length,
      totalPagesRead: finished.reduce((sum, b) => sum + (b.pages_total || 0), 0),
      averageRating: finished.reduce((sum, b) => sum + (b.rating || 0), 0) / (finished.length || 1)
    }
  }
}
