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
