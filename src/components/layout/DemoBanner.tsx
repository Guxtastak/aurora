import { Info, RotateCcw } from 'lucide-react'
import { resetDemo } from '../../services/demo/demoStore'

/** Aviso exibido apenas na prévia sem Supabase configurado */
export function DemoBanner() {
  const handleReset = () => {
    if (!window.confirm('Restaurar os dados de exemplo desta prévia?')) return
    resetDemo()
    window.location.reload()
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2 text-xs text-amber-800 dark:text-amber-200">
        <Info size={14} className="shrink-0" />
        <span>
          <strong>Modo demonstração:</strong> dados de exemplo salvos só no seu navegador. Suas
          alterações não vão para servidor nenhum. Para usar de verdade, configure o Supabase
          conforme o README.
        </span>
        <button
          onClick={handleReset}
          className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-md border border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/60"
        >
          <RotateCcw size={12} /> Restaurar dados
        </button>
      </div>
    </div>
  )
}
