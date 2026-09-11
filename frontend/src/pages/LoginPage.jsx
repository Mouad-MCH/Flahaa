import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Field } from '../components/ui/ui.jsx'
import { usePostAuthRedirect } from '../hooks/usePostAuthRedirect.js'


const LoginPage = () => {
  const navigate = useNavigate()
  const { login, loading } = useAuthStore()
  const redirectAfterAuth = usePostAuthRedirect()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    const result = await login({ email, password })

    if (result.success) {
      toast.success('Signed in successfully')
      redirectAfterAuth(useAuthStore.getState().user)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <main className="w-full min-h-screen flex items-center justify-center bg-paper p-4 relative overflow-x-hidden">
        <img className='absolute -top-2 -right-2 w-30 rotate-180' src='/icons/plante_auth.png' />
        <img className='absolute -bottom-2 -left-2 w-30 ' src='/icons/plante_auth.png' />
      <div className="w-full max-w-4xl bg-card rounded-card shadow-lift overflow-hidden flex flex-col md:flex-row">

        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-8">
            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-field-soft text-field">
              <img src='/icons/Logo.png' />
            </span>
            <span className="text-xl font-bold text-field">Flahaa</span>
          </div>

          <h1 className="text-2xl font-bold text-olive-ink mb-1.5" style={{ color: "var(--olive-ink)" }}>Welcome back!</h1>
          <p className="text-sm text-ink-2 mb-7">
            Sign in to your Flahaa account to manage your farms, teams, and payroll.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Email">
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
                <input
                  type="email"
                  className="input"
                  style={{ paddingLeft: '2.25rem' }}
                  placeholder="admin@flahaapro.ma"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </Field>

            <Field label="Mot de passe">
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  style={{ paddingLeft: '2.25rem', paddingRight: '2.25rem' }}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink-2"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-ink-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--field)' }}
                  className="w-4 h-4"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-field font-medium hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-field hover:bg-field-hover disabled:opacity-60 text-white font-medium rounded-input py-2.5 flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-ink-2 mt-7">
            Don't have an account?{' '}
            <Link to="/register" className="text-field font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        <div className="hidden md:block md:w-1/2 relative">
          <img src="/images/auth.jpg" alt="Flahaa" className="absolute inset-0 w-full h-full object-cover" />
        </div>
      </div>
    </main>
  )
}

export default LoginPage
