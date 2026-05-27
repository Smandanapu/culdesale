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
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">💬 Inbox</h1>

        {loading && (
          <div className="text-center py-24 text-zinc-500">Loading...</div>
        )}

        {!loading && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-xl font-bold mb-2">No messages yet</h3>
            <p className="text-zinc-400 text-sm">
              When someone messages you about a listing it will appear here
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => handleOpenConversation(conv.id)}
              className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 rounded-2xl p-4 cursor-pointer transition"
            >
              <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
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
                  <span className="font-semibold truncate">
                    {getOtherUser(conv)}
                  </span>
                  {conv.lastMessage && (
                    <span className="text-xs text-zinc-500 flex-shrink-0 ml-2">
                      {new Date(conv.lastMessage.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-500 truncate mb-1">
                  Re: {conv.listings && conv.listings.title}
                </div>
                <div className="text-sm text-zinc-400 truncate">
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
