/**
 * Formulário de criar e editar meta. Alvo e unidade são opcionais: sem eles
 * a meta fica qualitativa, sem barra de progresso.
 */
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Meta } from '@/compartilhado/tipo/banco'
import { CampoDeTexto, CampoDeSelecao, CampoDeTextoLongo } from '@/compartilhado/componente/Campo'
import { Botao } from '@/compartilhado/componente/Botao'
import { ORIGENS, origemPorId, origemSugeridaPara, ehAutomatica } from '@/modulo/meta/origens'
import type { Habito } from '@/compartilhado/tipo/banco'

/** Campo numérico opcional: input vazio vira undefined em vez de NaN */
const optionalNumber = z.number({ message: 'Informe um número' }).min(0, 'Não pode ser negativo').optional()

/** Campo de data opcional. O input vazio é normalizado no register, não aqui: um
 *  transform no schema mudaria o tipo de saída e o useForm rejeitaria o resolver. */
const optionalDate = z.string().optional()

const schema = z
  .object({
    title: z.string().min(1, 'Informe um título'),
    description: z.string().optional(),
    category: z.enum(['reading', 'habits', 'finance', 'health']),
    target_value: optionalNumber,
    current_value: optionalNumber,
    unit: z.string().optional(),
    start_date: optionalDate,
    deadline: optionalDate,
    status: z.enum(['active', 'completed', 'failed']),
    source: z.enum(['manual', 'books_finished', 'pages_read', 'habit_checkins', 'money_saved', 'money_spent']),
    source_habit_id: z.string().optional()
  })
  .refine(
    values => values.source !== 'habit_checkins' || !!values.source_habit_id,
    { message: 'Escolha o hábito que vai alimentar esta meta', path: ['source_habit_id'] }
  )
  .refine(
    values => !values.start_date || !values.deadline || values.deadline >= values.start_date,
    { path: ['deadline'], message: 'O prazo não pode ser antes do início' }
  )

type CamposDoFormulario = z.infer<typeof schema>

/**
 * O que sai do formulário. O hábito difere do campo cru: o `<select>` em branco
 * devolve `''`, que não é uuid válido, e origem que não usa hábito não pode
 * carregar o vínculo de quando usava — os dois casos viram `null`.
 */
export type ValoresDaMeta = Omit<CamposDoFormulario, 'source_habit_id'> & {
  source_habit_id: string | null
}

interface FormularioDeMetaProps {
  goal?: Meta | null
  /** Para o seletor da origem "marcacoes de um habito" */
  habitos: Habito[]
  onSubmit: (values: ValoresDaMeta) => Promise<void>
  onCancel: () => void
}

/** react-hook-form entrega '' em campo numérico vazio; Number('') seria 0 */
const asOptionalNumber = { setValueAs: (value: unknown) => (value === '' || value === null ? undefined : Number(value)) }

/** Data em branco precisa chegar ao banco como undefined, não como '' */
const asOptionalDate = { setValueAs: (value: unknown) => (value ? String(value) : undefined) }

export function FormularioDeMeta({ goal, habitos, onSubmit, onCancel }: FormularioDeMetaProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<CamposDoFormulario>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: goal?.title ?? '',
      description: goal?.description ?? '',
      category: goal?.category ?? 'habits',
      target_value: goal?.target_value ?? undefined,
      current_value: goal?.current_value ?? 0,
      unit: goal?.unit ?? '',
      start_date: goal?.start_date ?? undefined,
      deadline: goal?.deadline ?? undefined,
      status: goal?.status ?? 'active',
      source: goal?.source ?? 'manual',
      source_habit_id: goal?.source_habit_id ?? undefined
    }
  })

  const categoria = useWatch({ control, name: 'category' })
  const origemEscolhida = useWatch({ control, name: 'source' })
  const origem = origemPorId(origemEscolhida)
  const automatica = ehAutomatica(origemEscolhida)

  // Trocar a categoria sugere a origem e a unidade dela — so ao criar, para nao
  // sobrescrever a escolha de quem esta editando uma meta que ja existe
  useEffect(() => {
    if (goal || !categoria) return
    const sugerida = origemSugeridaPara(categoria)
    setValue('source', sugerida)
    setValue('unit', origemPorId(sugerida).unidadeSugerida)
  }, [categoria, goal, setValue])

  const enviar = (campos: CamposDoFormulario) =>
    onSubmit({
      ...campos,
      source_habit_id:
        campos.source === 'habit_checkins' ? campos.source_habit_id || null : null
    })

  return (
    <form onSubmit={handleSubmit(enviar)} className="space-y-4">
      <CampoDeTexto
        label="Título"
        placeholder="Ler 24 livros no ano"
        error={errors.title?.message}
        {...register('title')}
      />

      <CampoDeTextoLongo
        label="Descrição (opcional)"
        rows={2}
        placeholder="Por que essa meta importa?"
        {...register('description')}
      />

      <div className="grid grid-cols-2 gap-4">
        <CampoDeSelecao label="Categoria" {...register('category')}>
          <option value="habits">Hábitos</option>
          <option value="reading">Leitura</option>
          <option value="finance">Finanças</option>
          <option value="health">Saúde</option>
        </CampoDeSelecao>

        <CampoDeSelecao label="Status" {...register('status')}>
          <option value="active">Ativa</option>
          <option value="completed">Concluída</option>
          <option value="failed">Não atingida</option>
        </CampoDeSelecao>
      </div>

      <CampoDeSelecao label="De onde vem o progresso" {...register('source')}>
        {ORIGENS.map(opcao => (
          <option key={opcao.id} value={opcao.id}>
            {opcao.rotulo}
          </option>
        ))}
      </CampoDeSelecao>

      {origem.precisaDeHabito && (
        <CampoDeSelecao
          label="Hábito"
          error={errors.source_habit_id?.message}
          {...register('source_habit_id')}
        >
          <option value="">Escolha um hábito</option>
          {habitos.map(habito => (
            <option key={habito.id} value={habito.id}>
              {habito.name}
            </option>
          ))}
        </CampoDeSelecao>
      )}

      <div className="grid grid-cols-3 gap-4">
        <CampoDeTexto
          label="Alvo"
          type="number"
          step="any"
          min={0}
          placeholder="24"
          error={errors.target_value?.message}
          {...register('target_value', asOptionalNumber)}
        />
        {automatica ? (
          <div>
            <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">Atual</span>
            <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
              {origem.explicacao}
            </p>
          </div>
        ) : (
          <CampoDeTexto
            label="Atual"
            type="number"
            step="any"
            min={0}
            error={errors.current_value?.message}
            {...register('current_value', asOptionalNumber)}
          />
        )}
        <CampoDeTexto label="Unidade" placeholder="livros, km, R$" {...register('unit')} />
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
        Sem alvo a meta fica qualitativa: aparece sem barra de progresso e o status é só o que você
        escolher. Com alvo, o progresso é calculado e bater 100% conclui a meta.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <CampoDeTexto label="Início (opcional)" type="date" {...register('start_date', asOptionalDate)} />
        <CampoDeTexto
          label="Prazo (opcional)"
          type="date"
          error={errors.deadline?.message}
          {...register('deadline', asOptionalDate)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Botao type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Botao>
        <Botao type="submit" carregando={isSubmitting}>
          {goal ? 'Salvar' : 'Criar meta'}
        </Botao>
      </div>
    </form>
  )
}
