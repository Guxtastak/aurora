/** Formata valores em Real brasileiro */
export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

/** Formata YYYY-MM-DD (ou ISO) como DD/MM/YYYY, sem deslocamento de timezone */
export function formatDate(date: string) {
  if (!date) return '-'
  const [y, m, d] = date.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

/** Converte um Date para YYYY-MM-DD no fuso local (toISOString usaria UTC e trocaria o dia) */
export function toISODate(date: Date) {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().split('T')[0]
}

/** Data de hoje em YYYY-MM-DD no fuso local */
export function todayISO() {
  return toISODate(new Date())
}

/** Percentual limitado entre 0 e 100 */
export function percent(value: number, total: number) {
  if (!total) return 0
  return Math.min(100, Math.max(0, Math.round((value / total) * 100)))
}

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]
