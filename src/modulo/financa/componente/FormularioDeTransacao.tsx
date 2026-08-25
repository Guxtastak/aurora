import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Select } from '@/compartilhado/componente/Campo'
import { Button } from '@/compartilhado/componente/Botao'
import { todayISO } from '@/compartilhado/utilitario/formato'

export const CATEGORIES = [
  'Salário',
  'Freelance',
  'Investimentos',
  'Moradia',
  'Alimentação',
  'Transporte',
  'Saúde',
  'Educação',
  'Lazer',
  'Assinaturas',
  'Outros'
]

const schema = z.object({
  date: z.string().min(1, 'Informe a data'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Informe a categoria'),
  amount: z.number().positive('Valor precisa ser maior que zero'),
  description: z.string().optional()
})

export type TransactionFormValues = z.infer<typeof schema>

interface TransactionFormProps {
  onSubmit: (values: TransactionFormValues) => Promise<void>
  onCancel: () => void
}

export function TransactionForm({ onSubmit, onCancel }: TransactionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: todayISO(),
      type: 'expense',
      category: 'Alimentação',
      amount: 0,
      description: ''
    }
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select label="Tipo" {...register('type')}>
          <option value="expense">Despesa</option>
          <option value="income">Receita</option>
        </Select>
        <Input label="Data" type="date" error={errors.date?.message} {...register('date')} />
      </div>

      <Select label="Categoria" error={errors.category?.message} {...register('category')}>
        {CATEGORIES.map(c => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>

      <Input
        label="Valor (R$)"
        type="number"
        step="0.01"
        min={0}
        error={errors.amount?.message}
        {...register('amount', { valueAsNumber: true })}
      />

      <Input label="Descrição (opcional)" {...register('description')} />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Salvar
        </Button>
      </div>
    </form>
  )
}
