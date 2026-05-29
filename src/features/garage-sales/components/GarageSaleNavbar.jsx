import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'

export default function GarageSaleNavbar() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className="sticky top-0 z-50 bg-slate-50/75 dark:bg-[#07090e]/75 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.06] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => navigate(user ? '/feed' : '/')}
        >
          <img src="/logo.png" alt="CulDeSale Logo" className="w-8 h-8 rounded-lg shadow-sm transition-transform group-hover:scale-110 duration-200" />
          <span className="text-xl font-extrabold tracking-tight animate-text-shimmer bg-gradient-to-r from-orange-400 via-rose-400 to-indigo-400 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
            CulDeSale
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-slate-400 dark:text-slate-500">
          <span>/</span>
        </div>
        <span 
          onClick={() => navigate('/garage-sales')}
          className="hidden sm:inline text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition cursor-pointer"
        >
          🏷️ Garage Sales
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => user ? navigate('/create-garage-sale') : navigate('/login')}
          className="px-3 sm:px-4 py-2 text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white rounded-lg transition-all font-semibold shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer"
        >
          <span className="sm:hidden">+ Sale</span>
          <span className="hidden sm:inline">+ Post a Sale</span>
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:text-orange-500 dark:text-slate-400 dark:hover:text-white transition cursor-pointer active:scale-95"
          title="Toggle Theme"
        >
          <span className="text-xl">{theme === 'dark' ? '☀️' : '🌙'}</span>
        </button>

        {user ? (
          <button
            onClick={() => navigate('/profile')}
            className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-500 font-bold text-sm hover:bg-orange-500/30 transition cursor-pointer active:scale-95"
          >
            {user.email ? user.email[0].toUpperCase() : '?'}
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition font-medium cursor-pointer"
          >
            Sign in
          </button>
        )}
      </div>
    </nav>
  )
}
