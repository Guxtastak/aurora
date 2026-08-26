/**
 * Formulário de cadastro manual e edição de livro.
 */
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CampoDeTexto, CampoDeSelecao } from '@/compartilhado/componente/Campo'
import { Botao } from '@/compartilhado/componente/Botao'
import { dataDeConclusao } from '@/modulo/livro/regraDeConclusao'

const schema = z.object({
  title: z.string().min(1, 'Informe o título'),
  author: z.string().min(1, 'Informe o autor'),
  status: z.enum(['reading', 'finished', 'want_to_read', 'dropped']),
  pages_total: z.number().min(0),
  pages_read: z.number().min(0),
  cover_url: z.string().optional(),
  finished_date: z.string().optional()
})

type CamposDoFormulario = z.infer<typeof schema>

/**
 * O que sai do formulário. A data de conclusão já vem resolvida pela
 * regraDeConclusao: preenchida quando o livro é finalizado, nula quando não é.
 */
export type ValoresDoLivro = Omit<CamposDoFormulario, 'finished_date'> & {
  finished_date: string | null
}

interface FormularioDeLivroProps {
  onSubmit: (values: ValoresDoLivro) => Promise<void>
  onCancel: () => void
}

export function FormularioDeLivro({ onSubmit, onCancel }: FormularioDeLivroProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting }
  } = useForm<CamposDoFormulario>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      author: '',
      status: 'want_to_read',
      pages_total: 0,
      pages_read: 0,
      cover_url: '',
      finished_date: ''
    }
  })

  const status = useWatch({ control, name: 'status' })
  const finalizado = status === 'finished'

  const enviar = (campos: CamposDoFormulario) =>
    onSubmit({
      ...campos,
      finished_date: dataDeConclusao(campos.status, campos.finished_date)
    })

  return (
    <form onSubmit={handleSubmit(enviar)} className="space-y-4">
      <CampoDeTexto label="Título" error={errors.title?.message} {...register('title')} />
      <CampoDeTexto label="Autor" error={errors.author?.message} {...register('author')} />

      <CampoDeSelecao label="Status" {...register('status')}>
        <option value="want_to_read">Quero ler</option>
        <option value="reading">Lendo</option>
        <option value="finished">Finalizado</option>
        <option value="dropped">Abandonado</option>
      </CampoDeSelecao>

      {finalizado && (
        <div>
          <CampoDeTexto
            label="Data de conclusão"
            type="date"
            error={errors.finished_date?.message}
            {...register('finished_date')}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Em branco, vale hoje. É por esta data que as metas de leitura contam o livro.
          </p>
        </div>
      )}

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
