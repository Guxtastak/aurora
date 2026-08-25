/**
 * A casca do app.
 *
 * Liga, nesta ordem: o roteador (react-router), o provedor de autenticação
 * (quem é o usuário logado) e a moldura visual (menu lateral + cabeçalho).
 * Quem decide qual tela aparece é o rotas.tsx.
 */
import { BrowserRouter as Router } from 'react-router-dom'
import { ProvedorDeAutenticacao } from '@/compartilhado/gancho/useAutenticacao'
import { Rotas } from '@/app/rotas'
import '@/estilo/index.css'

function App() {
  return (
    // basename acompanha o base do Vite: '/' em dev, '/aurora/' no GitHub Pages
    <Router basename={import.meta.env.BASE_URL}>
      <ProvedorDeAutenticacao>
        <Rotas />
      </ProvedorDeAutenticacao>
    </Router>
  )
}

export default App
