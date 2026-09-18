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
import WorkersPage from './pages/WorkersPage'
import WorkerDetailPage from './pages/workerDetailPage'
import SupervisorsPage from './pages/SupervisorsPage'
import SupervisorDetailPage from './pages/SupervisorDetailPage'
import AttendancePage from './pages/AttendancePage'
import TasksPage from './pages/TasksPage'
import MyTasksPage from './pages/MyTasksPage'
import PayrollPage from './pages/PayrollPage'

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

          <Route path='/workers' element={
            <RoleRoute roles={['admin', 'supervisor']}>
              <WorkersPage/>
            </RoleRoute>
          } />

          <Route path='/workers/:id' element={
            <RoleRoute roles={['admin', 'supervisor']}>
              <WorkerDetailPage/>
            </RoleRoute>
          } />

          <Route path='/supervisors' element={
            <RoleRoute roles={['admin']}>
              <SupervisorsPage/>
            </RoleRoute>
          } />

          <Route path='/supervisor/:id' element={
            <RoleRoute roles={['admin']}>
              <SupervisorDetailPage/>
            </RoleRoute>
          } />

          <Route path='/attendance' element={
            <RoleRoute roles={['admin', 'supervisor']}>
              <AttendancePage/>
            </RoleRoute>
          } />

          <Route path='/tasks' element={
            <RoleRoute roles={['admin', 'supervisor']}>
              <TasksPage/>
            </RoleRoute>
          } />

          <Route path='/my-tasks' element={
            <RoleRoute roles={['worker']}>
              <MyTasksPage/>
            </RoleRoute>
          } />

          <Route path='/payroll' element={
            <RoleRoute roles={['admin']}>
              <PayrollPage/>
            </RoleRoute>
          } />

          </Route>

          <Route path="*" element={<NotFoundPage/>} />
       </Routes>
    </BrowserRouter>
  )
}

export default App
