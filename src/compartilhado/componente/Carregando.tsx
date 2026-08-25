/**
 * Rodinha de carregando. Carregando ocupa o espaço do bloco;
 * CarregandoPaginaInteira cobre a tela toda, usada enquanto o app ainda não
 * sabe se existe usuário logado.
 */
import { motion } from 'framer-motion'

export function Carregando({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500 dark:text-gray-400">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        className="h-8 w-8 rounded-full border-3 border-aurora-200 border-t-aurora-500"
        style={{ borderWidth: 3 }}
      />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function CarregandoPaginaInteira() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Carregando />
    </div>
  )
}
