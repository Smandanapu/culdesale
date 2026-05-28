import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

export default function Inbox() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    markAllAsRead()
    fetchConversations()

    const channel = supabase
      .channel('inbox')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, () => fetchConversations())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const markAllAsRead = async () => {
    try {
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)

      if (conversations && conversations.length > 0) {
        const ids = conversations.map(c => c.id)
        const { error } = await supabase
          .from('messages')
          .update({ is_read: true })
          .in('conversation_id', ids)
          .eq('is_read', false)
          .neq('sender_id', user.id)
        
        if (error) {
          console.error('Error marking messages as read:', error)
        } else {
          console.log('Messages marked as read successfully')
        }
      }
    } catch (err) {
      console.error('Error in markAllAsRead:', err)
    }
  }

  const fetchConversations = async () => {
    const { data } = await supabase
      .from('conversations')
      .select(`
        id,
        created_at,
        listing_id,
        seller_id,
        buyer_id,
        listings(title, photos),
        seller:profiles!conversations_seller_id_fkey(username),
        buyer:profiles!conversations_buyer_id_fkey(username)
      `)
      .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (data) {
      const withMessages = await Promise.all(data.map(async (conv) => {
        const { data: msgs } = await supabase
          .from('messages')
          .select('content, created_at, sender_id, is_read')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)

        return {
          ...conv,
          lastMessage: msgs && msgs[0] ? msgs[0] : null,
          unread: 0
        }
      }))
      setConversations(withMessages)
    }
    setLoading(false)
  }

  const getOtherUser = (conv) => {
    return user.id === conv.seller_id
      ? conv.buyer && conv.buyer.username
      : conv.seller && conv.seller.username
  }

  const handleOpenConversation = async (convId) => {
    // Mark all unread messages as read before navigating
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', convId)
      .neq('sender_id', user.id)
    
    // Update the conversation in state to remove unread count
    setConversations(prev => 
      prev.map(conv => 
        conv.id === convId ? { ...conv, unread: 0 } : conv
      )
    )
    
    navigate('/inbox/' + convId)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] bg-grid-pattern text-slate-900 dark:text-slate-100 relative overflow-hidden">
      {/* Floating Ambient Glow Orbs */}
      <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none animate-float-slow z-0" />
      <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none animate-float-slower z-0" />

      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8 relative z-10">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-8 tracking-tight">Messages Inbox</h1>

        {loading && (
          <div className="flex flex-col items-center justify-center py-32 text-slate-500 dark:text-slate-400 gap-3">
            <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
            <span className="text-sm font-medium tracking-wide">Loading conversations...</span>
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-white/[0.015] border border-slate-200 dark:border-white/[0.04] rounded-2xl p-8 backdrop-blur-md max-w-md mx-auto">
            <div className="text-5xl mb-4 animate-bounce">💬</div>
            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">No messages yet</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">
              When neighbors message you about listings or bids, your chats will appear here
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => handleOpenConversation(conv.id)}
              className="card-gradient-border bg-white dark:bg-white/[0.015] border border-slate-200 dark:border-white/[0.04] rounded-2xl p-4 cursor-pointer hover:border-orange-500/40 hover:-translate-y-0.5 hover:bg-white dark:bg-white/[0.03] transition-all duration-300 shadow-md flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] flex items-center justify-center overflow-hidden flex-shrink-0">
                {conv.listings && conv.listings.photos && conv.listings.photos[0] ? (
                  <img
                    src={conv.listings.photos[0]}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">📦</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 dark:text-white truncate text-base">
                    @{getOtherUser(conv) || 'neighbor'}
                  </span>
                  {conv.lastMessage && (
                    <span className="text-xs text-slate-500 flex-shrink-0 ml-2 font-medium">
                      {new Date(conv.lastMessage.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="text-xs text-indigo-400 font-semibold tracking-wide truncate mb-1">
                  Re: {conv.listings && conv.listings.title}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {conv.lastMessage ? conv.lastMessage.content : 'No messages yet'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
