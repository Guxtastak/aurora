interface CampoDeTextoProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const base =
  'w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-aurora-500 focus:border-transparent outline-none'

export function CampoDeTexto({ label, error, className = '', ...props }: CampoDeTextoProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <input className={`${base} ${className}`} {...props} />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

interface CampoDeSelecaoProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export function CampoDeSelecao({ label, error, className = '', children, ...props }: CampoDeSelecaoProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <select className={`${base} ${className}`} {...props}>
        {children}
      </select>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

interface CampoDeTextoLongoProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function CampoDeTextoLongo({ label, error, className = '', ...props }: CampoDeTextoLongoProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <textarea className={`${base} ${className}`} {...props} />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
