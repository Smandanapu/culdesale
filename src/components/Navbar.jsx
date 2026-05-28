import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Navbar() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [unread, setUnread] = useState(0)

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
  }, [user])

  const fetchUnread = async () => {
    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .or('seller_id.eq.' + user.id + ',buyer_id.eq.' + user.id)

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
  }

  return (
    <nav className="sticky top-0 z-50 bg-[#07090e]/75 backdrop-blur-md border-b border-white/[0.06] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
      <div
        className="flex items-center gap-2 cursor-pointer group"
        onClick={() => navigate('/feed')}
      >
        <span className="text-2xl transition-transform group-hover:scale-110 duration-200">🏘️</span>
        <span className="text-xl font-extrabold tracking-tight animate-text-shimmer bg-gradient-to-r from-orange-400 via-rose-400 to-indigo-400 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
          CulDeSale
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => navigate('/create')}
          className="px-3 sm:px-4 py-2 text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 text-white rounded-lg transition-all font-semibold shadow-lg shadow-orange-500/25 active:scale-95 cursor-pointer"
        >
          <span className="sm:hidden">+</span>
          <span className="hidden sm:inline">+ List Item</span>
        </button>

        <button
          onClick={() => navigate('/inbox')}
          className="relative p-2 text-slate-400 hover:text-white transition cursor-pointer active:scale-95"
        >
          <span className="text-xl">💬</span>
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md shadow-orange-500/30">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        <button
          onClick={() => navigate('/profile')}
          className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-500 font-bold text-sm hover:bg-orange-500/30 transition cursor-pointer active:scale-95"
        >
          {user && user.email ? user.email[0].toUpperCase() : '?'}
        </button>
      </div>
    </nav>
  )
}
