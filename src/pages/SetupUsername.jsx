import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

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
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-6">
      <div className="flex items-center gap-2 mb-8">
        <span className="text-3xl">🏘️</span>
        <span className="text-2xl font-bold">CulDeSale</span>
      </div>

      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-1">Pick a username</h1>
        <p className="text-zinc-400 text-sm mb-8">
          This is how your neighbors will see you on CulDeSale
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Username</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase())}
              placeholder="e.g. john_doe"
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition"
            />
            <div className="text-xs text-zinc-600 mt-1">
              Letters, numbers and underscores only
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition mt-2"
          >
            {loading ? 'Saving...' : 'Set Username →'}
          </button>
        </form>
      </div>
    </div>
  )
}
