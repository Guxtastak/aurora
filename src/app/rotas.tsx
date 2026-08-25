import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/compartilhado/componente/RotaProtegida'
import { Login } from '@/modulo/conta/PaginaDeEntrada'
import { Register } from '@/modulo/conta/PaginaDeCadastro'
import { Dashboard } from '@/modulo/painel/Pagina'
import { Habits } from '@/modulo/habito/Pagina'
import { Books } from '@/modulo/livro/Pagina'
import { Finances } from '@/modulo/financa/Pagina'
import { Goals } from '@/modulo/meta/Pagina'
import { Mood } from '@/modulo/humor/Pagina'
import { Settings } from '@/modulo/conta/PaginaDeConfiguracoes'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/habits" element={<ProtectedRoute><Habits /></ProtectedRoute>} />
      <Route path="/books" element={<ProtectedRoute><Books /></ProtectedRoute>} />
      <Route path="/finances" element={<ProtectedRoute><Finances /></ProtectedRoute>} />
      <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
      <Route path="/mood" element={<ProtectedRoute><Mood /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
