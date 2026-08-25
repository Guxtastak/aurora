/**
 * Escalas de humor e energia. Ficam separadas porque a marcação do dia
 * (MoodCheckin) e a edição de um dia antigo (MoodEditForm) mostram exatamente
 * os mesmos botões — e um emoji divergente entre as duas telas confundiria.
 */

export type ScaleOption = {
  value: number
  emoji: string
  label: string
}

export const MOODS: ScaleOption[] = [
  { value: 1, emoji: '😞', label: 'Muito ruim' },
  { value: 2, emoji: '🙁', label: 'Ruim' },
  { value: 3, emoji: '😐', label: 'Neutro' },
  { value: 4, emoji: '🙂', label: 'Bom' },
  { value: 5, emoji: '😄', label: 'Ótimo' }
]

export const ENERGIES: ScaleOption[] = [
  { value: 1, emoji: '😴', label: 'Esgotado' },
  { value: 2, emoji: '🥱', label: 'Baixa' },
  { value: 3, emoji: '🙂', label: 'Normal' },
  { value: 4, emoji: '⚡', label: 'Alta' },
  { value: 5, emoji: '🔥', label: 'Muito alta' }
]

/** Rótulo de um valor 1-5, com o mesmo texto do botão da escala */
export function scaleLabel(options: ScaleOption[], value: number) {
  return options.find(option => option.value === value)?.label || '—'
}

/** Emoji de um valor 1-5 */
export function scaleEmoji(options: ScaleOption[], value: number) {
  return options.find(option => option.value === value)?.emoji || '·'
}
