import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Habit } from '@/compartilhado/tipo/banco'
import { Input, Select, Textarea } from '@/compartilhado/componente/Campo'
import { Button } from '@/compartilhado/componente/Botao'

const schema = z.object({
  name: z.string().min(1, 'Informe um nome'),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  target_count: z.number().min(1, 'Mínimo 1')
})

export type HabitFormValues = z.infer<typeof schema>

interface HabitFormProps {
  habit?: Habit | null
  onSubmit: (values: HabitFormValues) => Promise<void>
  onCancel: () => void
}

const ICONS = ['💪', '📖', '🧘', '💧', '🏃', '🌱', '🎯', '🎸', '💻', '🛏️']

export function HabitForm({ habit, onSubmit, onCancel }: HabitFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<HabitFormValues>({
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
      <Input label="Nome" placeholder="Ler 20 páginas" error={errors.name?.message} {...register('name')} />

      <Textarea
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
        <Select label="Frequência" {...register('frequency')}>
          <option value="daily">Diário</option>
          <option value="weekly">Semanal</option>
          <option value="monthly">Mensal</option>
        </Select>

        <Input
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
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {habit ? 'Salvar' : 'Criar hábito'}
        </Button>
      </div>
    </form>
  )
}
