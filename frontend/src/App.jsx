import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import NotFoundPage from './pages/NotFoundPage'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import AuthRedirect from './components/AuthRedirect'
import FarmGuard from './components/FarmGuard'
import SelectFarmPage from './pages/SelectFarmPage'
import MainLayout from './components/layout/MainLayout'

const App = () => {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--c-card)',
            color: 'var(--c-text-1)',
            border: '1px solid var(--c-border)',
            fontSize: 13,
          },
          success: { iconTheme: { primary: 'var(--field)', secondary: '#fff' } },
          error:   { iconTheme: { primary: 'var(--absent)', secondary: '#fff' } },
        }}
      />
       <Routes>
          <Route path="/login" element={
            <AuthRedirect>
              <LoginPage />
            </AuthRedirect>
            } />
          <Route path="/register" element={
            <AuthRedirect>
              <RegisterPage />
            </AuthRedirect>
            } />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/select-farm" element={
            <ProtectedRoute>
              <RoleRoute roles={['admin']}>
                <SelectFarmPage/>
              </RoleRoute>
            </ProtectedRoute>
          } />

          <Route element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>

          <Route path="/dashboard" element={
              <FarmGuard>
                <DashboardPage />
              </FarmGuard>
          } />

          </Route>

          <Route path="*" element={<NotFoundPage/>} />
       </Routes>
    </BrowserRouter>
  )
}

export default App
