import { Link } from 'react-router-dom'
import { Tractor, Home, ArrowLeft, Sprout } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const NotFoundPage = () => {
  const { isAuthenticated } = useAuthStore()
  const homeHref = isAuthenticated ? '/dashboard' : '/login'

  return (
    <main className="w-full min-h-screen flex items-center justify-center bg-paper p-4 relative overflow-x-hidden">
      <img className="absolute -top-2 -right-2 w-30 rotate-180" src="/icons/plante_auth.png" alt="" />
      <img className="absolute -bottom-2 -left-2 w-30" src="/icons/plante_auth.png" alt="" />

      <div className="w-full max-w-lg bg-card rounded-card shadow-lift overflow-hidden p-8 md:p-12 text-center relative z-10">
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="flex items-center justify-center w-9 h-9 rounded-full bg-field-soft text-field">
            <img src="/icons/Logo.png" alt="Flahaa" />
          </span>
          <span className="text-xl font-bold text-field">Flahaa</span>
        </div>

        <div className="relative h-20 flex items-end justify-center mb-4">
          <span className="absolute left-1/2 -translate-x-1/2 bottom-8 text-[64px] md:text-[80px] font-bold leading-none tracking-tight opacity-10 select-none" style={{ color: 'var(--olive-ink)' }}>
            404
          </span>
          <Tractor size={40} strokeWidth={1.75} className="relative z-10" style={{ color: 'var(--field)' }} />
          <div className="tractor-loader-road absolute bottom-0 left-1/2 -translate-x-1/2 w-24" />
        </div>

        <h1 className="text-2xl font-bold mb-1.5" style={{ color: 'var(--olive-ink)' }}>
          Field not found
        </h1>
        <p className="text-sm text-ink-2 mb-8 max-w-sm mx-auto">
          This page doesn't exist or has been moved. Check the address or head back to safe ground.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={homeHref}
            className="w-full sm:w-auto bg-field hover:bg-field-hover text-white font-medium rounded-input py-2.5 px-6 flex items-center justify-center gap-2 transition-colors"
          >
            <Home size={18} />
            {isAuthenticated ? 'Back to dashboard' : 'Back to login'}
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto text-ink-2 hover:text-ink font-medium rounded-input py-2.5 px-6 flex items-center justify-center gap-2 border border-line-strong transition-colors"
          >
            <ArrowLeft size={18} />
            Previous page
          </button>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-xs text-ink-3 mt-8">
          <Sprout size={14} />
          Flahaa — farm management
        </p>
      </div>
    </main>
  )
}

export default NotFoundPage
