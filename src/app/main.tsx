/**
 * Onde o app começa.
 *
 * O index.html carrega este arquivo, ele monta o App na div #root e importa
 * o CSS. Não tem lógica: se você está procurando alguma coisa, siga para
 * App.tsx.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
