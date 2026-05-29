import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function SetupUsername() {
  const { user, setNeedsUsername } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Only letters, numbers and underscores allowed')
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', user.id)

    if (error) {
      if (error.code === '23505') {
        setError('Username already taken, try another')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    setNeedsUsername(false)
    navigate('/feed')
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
        <h1 className="text-2xl font-bold mb-1 text-slate-900 dark:text-white">Pick a username</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
          This is how your neighbors will see you on CulDeSale
        </p>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">Username</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase())}
              placeholder="e.g. john_doe"
              required
              className="w-full bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:bg-white dark:focus:bg-white/[0.04] focus:ring-1 focus:ring-orange-500/20 transition-all duration-300 shadow-inner"
            />
            <div className="text-xs text-slate-500 mt-1.5">
              Letters, numbers and underscores only
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 dark:text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/25 active:scale-[0.98] cursor-pointer mt-2"
          >
            {loading ? 'Saving...' : 'Set Username →'}
          </button>
        </form>
      </div>
    </div>
  )
}
