/**
 * Formulário de criar e editar hábito (nome, descrição, ícone, cor,
 * frequência e meta diária). Validação com zod via react-hook-form.
 */
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Habito } from '@/compartilhado/tipo/banco'
import { CampoDeTexto, CampoDeSelecao, CampoDeTextoLongo } from '@/compartilhado/componente/Campo'
import { Botao } from '@/compartilhado/componente/Botao'

const schema = z.object({
  name: z.string().min(1, 'Informe um nome'),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  target_count: z.number().min(1, 'Mínimo 1')
})

export type ValoresDoHabito = z.infer<typeof schema>

interface FormularioDeHabitoProps {
  habit?: Habito | null
  onSubmit: (values: ValoresDoHabito) => Promise<void>
  onCancel: () => void
}

const ICONS = ['💪', '📖', '🧘', '💧', '🏃', '🌱', '🎯', '🎸', '💻', '🛏️']

export function FormularioDeHabito({ habit, onSubmit, onCancel }: FormularioDeHabitoProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ValoresDoHabito>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: habit?.name ?? '',
      description: habit?.description ?? '',
      icon: habit?.icon ?? '🎯',
      color: habit?.color ?? '#3a6bff',
      frequency: habit?.frequency ?? 'daily',
      target_count: habit?.target_count ?? 1
    }
  })

  const selectedIcon = watch('icon')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <CampoDeTexto label="Nome" placeholder="Ler 20 páginas" error={errors.name?.message} {...register('name')} />

      <CampoDeTextoLongo
        label="Descrição (opcional)"
        rows={2}
        placeholder="Por que esse hábito importa?"
        {...register('description')}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ícone</label>
        <div className="flex flex-wrap gap-2">
          {ICONS.map(icon => (
            <button
              key={icon}
              type="button"
              onClick={() => setValue('icon', icon)}
              className={`h-9 w-9 rounded-lg text-lg flex items-center justify-center border transition-colors ${
                selectedIcon === icon
                  ? 'border-aurora-500 bg-aurora-50 dark:bg-aurora-900/40'
                  : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <CampoDeSelecao label="Frequência" {...register('frequency')}>
          <option value="daily">Diário</option>
          <option value="weekly">Semanal</option>
          <option value="monthly">Mensal</option>
        </CampoDeSelecao>

        <CampoDeTexto
          label="Meta (vezes)"
          type="number"
          min={1}
          error={errors.target_count?.message}
          {...register('target_count', { valueAsNumber: true })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cor</label>
        <input
          type="color"
          className="h-10 w-16 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
          {...register('color')}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Botao type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Botao>
        <Botao type="submit" carregando={isSubmitting}>
          {habit ? 'Salvar' : 'Criar hábito'}
        </Botao>
      </div>
    </form>
  )
}
