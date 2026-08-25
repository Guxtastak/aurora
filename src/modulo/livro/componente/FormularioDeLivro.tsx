import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CampoDeTexto, CampoDeSelecao } from '@/compartilhado/componente/Campo'
import { Botao } from '@/compartilhado/componente/Botao'

const schema = z.object({
  title: z.string().min(1, 'Informe o título'),
  author: z.string().min(1, 'Informe o autor'),
  status: z.enum(['reading', 'finished', 'want_to_read', 'dropped']),
  pages_total: z.number().min(0),
  pages_read: z.number().min(0),
  cover_url: z.string().optional()
})

export type ValoresDoLivro = z.infer<typeof schema>

interface FormularioDeLivroProps {
  onSubmit: (values: ValoresDoLivro) => Promise<void>
  onCancel: () => void
}

export function FormularioDeLivro({ onSubmit, onCancel }: FormularioDeLivroProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ValoresDoLivro>({
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
      <CampoDeTexto label="Título" error={errors.title?.message} {...register('title')} />
      <CampoDeTexto label="Autor" error={errors.author?.message} {...register('author')} />

      <CampoDeSelecao label="Status" {...register('status')}>
        <option value="want_to_read">Quero ler</option>
        <option value="reading">Lendo</option>
        <option value="finished">Finalizado</option>
        <option value="dropped">Abandonado</option>
      </CampoDeSelecao>

      <div className="grid grid-cols-2 gap-4">
        <CampoDeTexto
          label="Total de páginas"
          type="number"
          min={0}
          {...register('pages_total', { valueAsNumber: true })}
        />
        <CampoDeTexto
          label="Páginas lidas"
          type="number"
          min={0}
          {...register('pages_read', { valueAsNumber: true })}
        />
      </div>

      <CampoDeTexto label="URL da capa (opcional)" {...register('cover_url')} />

      <div className="flex justify-end gap-2 pt-2">
        <Botao type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Botao>
        <Botao type="submit" carregando={isSubmitting}>
          Adicionar livro
        </Botao>
      </div>
    </form>
  )
}
