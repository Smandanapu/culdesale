import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export default function Navbar() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [unread, setUnread] = useState(0)

  const fetchUnread = useCallback(async () => {
    if (!user) return
    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)

    if (!convs || convs.length === 0) {
      setUnread(0)
      return
    }

    const ids = convs.map(c => c.id)

    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .in('conversation_id', ids)
      .eq('is_read', false)
      .neq('sender_id', user.id)

    setUnread(count || 0)
  }, [user])

  useEffect(() => {
    if (!user) return
    fetchUnread()

    const channel = supabase
      .channel('navbar-unread-' + user.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, () => fetchUnread())
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages'
      }, () => fetchUnread())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user, fetchUnread])

  return (
    <nav className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => navigate('/feed')}
      >
        <span className="text-2xl">🏘️</span>
        <span className="text-xl font-bold tracking-tight">CulDeSale</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/create')}
          className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition font-medium"
        >
          + List Item
        </button>

        <button
          onClick={() => navigate('/inbox')}
          className="relative p-2 text-zinc-400 hover:text-white transition"
        >
          <span className="text-xl">💬</span>
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        <button
          onClick={() => navigate('/profile')}
          className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-500 font-bold text-sm hover:bg-orange-500/30 transition"
        >
          {user?.email?.[0]?.toUpperCase()}
        </button>
      </div>
    </nav>
  )
}