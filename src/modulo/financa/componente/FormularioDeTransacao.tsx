import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CampoDeTexto, CampoDeSelecao } from '@/compartilhado/componente/Campo'
import { Botao } from '@/compartilhado/componente/Botao'
import { dataDeHoje } from '@/compartilhado/utilitario/formato'

export const CATEGORIAS = [
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

export type ValoresDaTransacao = z.infer<typeof schema>

interface FormularioDeTransacaoProps {
  onSubmit: (values: ValoresDaTransacao) => Promise<void>
  onCancel: () => void
}

export function FormularioDeTransacao({ onSubmit, onCancel }: FormularioDeTransacaoProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ValoresDaTransacao>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: dataDeHoje(),
      type: 'expense',
      category: 'Alimentação',
      amount: 0,
      description: ''
    }
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <CampoDeSelecao label="Tipo" {...register('type')}>
          <option value="expense">Despesa</option>
          <option value="income">Receita</option>
        </CampoDeSelecao>
        <CampoDeTexto label="Data" type="date" error={errors.date?.message} {...register('date')} />
      </div>

      <CampoDeSelecao label="Categoria" error={errors.category?.message} {...register('category')}>
        {CATEGORIAS.map(c => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </CampoDeSelecao>

      <CampoDeTexto
        label="Valor (R$)"
        type="number"
        step="0.01"
        min={0}
        error={errors.amount?.message}
        {...register('amount', { valueAsNumber: true })}
      />

      <CampoDeTexto label="Descrição (opcional)" {...register('description')} />

      <div className="flex justify-end gap-2 pt-2">
        <Botao type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Botao>
        <Botao type="submit" loading={isSubmitting}>
          Salvar
        </Botao>
      </div>
    </form>
  )
}
