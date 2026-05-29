import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Navbar() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [unread, setUnread] = useState(0)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchUnread()
    fetchUnreadNotifs()

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

    const notifChannel = supabase
      .channel('navbar-notifs-' + user.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: 'user_id=eq.' + user.id
      }, payload => {
        setNotifications(prev => [payload.new, ...prev].slice(0, 5))
        setUnreadNotifs(prev => prev + 1)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: 'user_id=eq.' + user.id
      }, payload => {
        setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n))
        fetchUnreadNotifs()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(notifChannel)
    }
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

  const fetchUnreadNotifs = async () => {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_read', false)
    setUnreadNotifs(count || 0)

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
    if (data) setNotifications(data)
  }

  const handleNotifClick = async (notif) => {
    setShowNotifs(false)
    if (!notif.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id)
      setUnreadNotifs(prev => Math.max(0, prev - 1))
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n))
    }
    if (notif.type === 'message') {
      navigate('/inbox')
    } else if (notif.listing_id) {
      navigate('/listing/' + notif.listing_id)
    }
  }

  const handleMarkAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    setUnreadNotifs(0)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  return (
    <nav className="sticky top-0 z-50 bg-slate-50/75 dark:bg-[#07090e]/75 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.06] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
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
        {user && (
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition cursor-pointer active:scale-95 group"
            title="Seller Dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 stroke-current group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h6v8H4z" />
              <path d="M14 4h6v4h-6z" />
              <path d="M14 12h6v8h-6z" />
              <path d="M4 16h6v4H4z" />
            </svg>
          </button>
        )}

        <button
          onClick={() => navigate('/create')}
          className="px-3 sm:px-4 py-2 text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 text-slate-900 dark:text-white rounded-lg transition-all font-semibold shadow-lg shadow-orange-500/25 active:scale-95 cursor-pointer"
        >
          <span className="sm:hidden">+</span>
          <span className="hidden sm:inline">+ List Item</span>
        </button>

        {user && (
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition cursor-pointer active:scale-95"
            >
              <span className="text-xl">🔔</span>
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md shadow-rose-500/30">
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </button>
            
            {showNotifs && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#151821] border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl flex flex-col">
                  <div className="p-4 border-b border-slate-200 dark:border-white/[0.08] flex justify-between items-center bg-slate-50 dark:bg-[#07090e]">
                    <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                    {unreadNotifs > 0 && (
                      <button onClick={handleMarkAllRead} className="text-xs font-semibold text-orange-500 hover:text-orange-400 cursor-pointer">Mark all as read</button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">No new notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => handleNotifClick(n)}
                          className={`p-4 border-b border-slate-100 dark:border-white/[0.04] last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors ${n.is_read ? 'opacity-70' : 'bg-orange-500/5'}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className={`text-sm font-bold ${n.is_read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>{n.title}</div>
                            {!n.is_read && <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{n.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <button
          onClick={() => navigate('/inbox')}
          className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition cursor-pointer active:scale-95"
        >
          <span className="text-xl">💬</span>
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-orange-500 text-slate-900 dark:text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md shadow-orange-500/30">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:text-orange-500 dark:text-slate-500 dark:text-slate-400 dark:hover:text-slate-900 dark:text-white transition cursor-pointer active:scale-95"
          title="Toggle Theme"
        >
          <span className="text-xl">{theme === 'dark' ? '☀️' : '🌙'}</span>
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
