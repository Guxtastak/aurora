/**
 * Buscar dados de um serviço, com carregando e erro.
 *
 * As seis telas do app faziam a mesma coisa à mão: um estado para os dados,
 * um para "está carregando", um para a mensagem de erro, uma função que junta
 * os três num try/catch e um useEffect para disparar tudo na abertura. Isso
 * mora aqui agora.
 *
 * Uso:
 *
 *   const { dados: metas, carregando, erro, setErro, recarregar } =
 *     useDados(() => ServicoDeMetas.listarMetas(), [])
 *
 * `dados` começa como o valor inicial que você passar (uma lista vazia, por
 * exemplo), então a tela nunca precisa checar `null`.
 */
import { useCallback, useEffect, useState } from 'react'

/** Mensagem legível de qualquer coisa que tenha sido lançada */
function mensagemDaFalha(falha: unknown, padrao: string) {
  if (falha instanceof Error && falha.message) return falha.message
  return padrao
}

export function useDados<T>(
  buscar: () => Promise<T>,
  valorInicial: T,
  opcoes: { aoFalhar?: string } = {}
) {
  const [dados, setDados] = useState<T>(valorInicial)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const recarregar = useCallback(async () => {
    try {
      // O setState acontece depois do await, não durante a renderização do
      // efeito — é o que evita a cascata de renders que o lint aponta.
      const resultado = await buscar()
      setDados(resultado)
      setErro('')
    } catch (falha) {
      setErro(mensagemDaFalha(falha, opcoes.aoFalhar || 'Erro ao carregar os dados'))
    } finally {
      setCarregando(false)
    }
    // `buscar` é redefinida a cada render da tela; quem manda na hora de
    // recarregar é a própria tela, chamando recarregar().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { dados, setDados, carregando, erro, setErro, recarregar }
}
