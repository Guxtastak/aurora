import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Select } from '../common/Input'
import { Button } from '../common/Button'

const schema = z.object({
  title: z.string().min(1, 'Informe o título'),
  author: z.string().min(1, 'Informe o autor'),
  status: z.enum(['reading', 'finished', 'want_to_read', 'dropped']),
  pages_total: z.number().min(0),
  pages_read: z.number().min(0),
  cover_url: z.string().optional()
})

export type BookFormValues = z.infer<typeof schema>

interface BookFormProps {
  onSubmit: (values: BookFormValues) => Promise<void>
  onCancel: () => void
}

export function BookForm({ onSubmit, onCancel }: BookFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<BookFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      author: '',
      status: 'want_to_read',
      pages_total: 0,
      pages_read: 0,
      cover_url: ''
    }
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Título" error={errors.title?.message} {...register('title')} />
      <Input label="Autor" error={errors.author?.message} {...register('author')} />

      <Select label="Status" {...register('status')}>
        <option value="want_to_read">Quero ler</option>
        <option value="reading">Lendo</option>
        <option value="finished">Finalizado</option>
        <option value="dropped">Abandonado</option>
      </Select>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Total de páginas"
          type="number"
          min={0}
          {...register('pages_total', { valueAsNumber: true })}
        />
        <Input
          label="Páginas lidas"
          type="number"
          min={0}
          {...register('pages_read', { valueAsNumber: true })}
        />
      </div>

      <Input label="URL da capa (opcional)" {...register('cover_url')} />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Adicionar livro
        </Button>
      </div>
    </form>
  )
}
