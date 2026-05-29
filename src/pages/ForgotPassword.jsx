import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    const { error } = await resetPassword(email)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setEmail('')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] bg-grid-pattern text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Floating Ambient Glow Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none animate-float-slow z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none animate-float-slower z-0" />

      <div className="flex items-center gap-2 mb-8 relative z-10 group">
        <img src="/logo.png" alt="CulDeSale" className="w-10 h-10 rounded-xl shadow-md transition-transform group-hover:scale-110 duration-200" />
        <span className="text-2xl font-extrabold tracking-tight animate-text-shimmer bg-gradient-to-r from-orange-400 via-rose-400 to-indigo-400 bg-clip-text text-transparent">CulDeSale</span>
      </div>

      <div className="w-full max-w-md card-gradient-border bg-white dark:bg-white/[0.015] backdrop-blur-md border border-slate-200 dark:border-white/[0.04] rounded-2xl p-8 shadow-2xl relative z-10">
        <h1 className="text-2xl font-bold mb-1 text-slate-900 dark:text-white">Reset your password</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">Enter your email and we'll send you a link to reset your password</p>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm rounded-xl px-4 py-3 mb-6">
            Check your email for a password reset link. It may take a few minutes to arrive.
          </div>
        )}

        {!success ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:bg-white dark:focus:bg-white/[0.04] focus:ring-1 focus:ring-orange-500/20 transition-all duration-300 shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 dark:text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/25 active:scale-[0.98] cursor-pointer mt-2"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 text-slate-900 dark:text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/25 active:scale-[0.98] cursor-pointer"
            >
              Try Another Email
            </button>
          </div>
        )}

        <p className="text-center text-slate-500 dark:text-slate-400 text-sm mt-6">
          Remember your password?{' '}
          <Link to="/login" className="text-orange-400 hover:text-orange-300 transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </div>

    </div>
  )
}
