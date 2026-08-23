import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { AppRoutes } from './routes'
import './styles/index.css'

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
