import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useEffect } from 'react'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, unreadCount, setUnreadCount, fetchUnreadCount, inboxViewed, setInboxViewed } = useAuth()

  useEffect(() => {
    if (!user) return

    // If on inbox page, set unread to 0 and mark inbox as viewed
    if (location.pathname === '/inbox' || location.pathname.startsWith('/inbox/')) {
      setUnreadCount(0)
      setInboxViewed(true)
    } else if (inboxViewed) {
      // If we just came from inbox, keep unread at 0 and reset the flag
      setUnreadCount(0)
      setInboxViewed(false)
    } else {
      // Otherwise fetch unread count
      fetchUnreadCount(user.id)
    }
  }, [user, location.pathname])

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
          onClick={async () => {
            setUnreadCount(0)
            navigate('/inbox')
          }}
          className="relative p-2 text-zinc-400 hover:text-white transition"
        >
          <span className="text-xl">💬</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unreadCount}
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