import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from '@/compartilhado/gancho/useAutenticacao'
import { AppRoutes } from '@/app/rotas'
import '@/estilo/index.css'

function App() {
  return (
    // basename acompanha o base do Vite: '/' em dev, '/aurora/' no GitHub Pages
    <Router basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}

export default App
