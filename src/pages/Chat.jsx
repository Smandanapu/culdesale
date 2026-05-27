import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'

export default function Chat() {
  const { conversationId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const bottomRef = useRef(null)

  const [messages, setMessages] = useState([])
  const [conversation, setConversation] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchConversation()
    fetchMessages()

    const channel = supabase
      .channel('chat-' + conversationId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: 'conversation_id=eq.' + conversationId
      }, payload => {
        setMessages(prev => [...prev, payload.new])
        markRead()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [conversationId])

  useEffect(() => {
    bottomRef.current && bottomRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchConversation = async () => {
    const { data } = await supabase
      .from('conversations')
      .select(`
        id,
        listing_id,
        seller_id,
        buyer_id,
        listings(title, photos),
        seller:profiles!conversations_seller_id_fkey(username),
        buyer:profiles!conversations_buyer_id_fkey(username)
      `)
      .eq('id', conversationId)
      .single()
    setConversation(data)
  }

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*, profiles(username)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    setLoading(false)
    markRead()
  }

  const markRead = async () => {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
  }

  const sendMessage = async () => {
    if (!input.trim()) return
    setSending(true)
    const content = input.trim()
    setInput('')

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      is_read: false,
    })

    setSending(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getOtherUser = () => {
    if (!conversation) return ''
    return user.id === conversation.seller_id
      ? conversation.buyer && conversation.buyer.username
      : conversation.seller && conversation.seller.username
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <Navbar />

      {/* Chat Header */}
      <div className="border-b border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-950">
        <button
          onClick={() => navigate('/inbox')}
          className="text-zinc-400 hover:text-white transition text-xl"
        >
          ←
        </button>

        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
          {conversation && conversation.listings && conversation.listings.photos && conversation.listings.photos[0] ? (
            <img
              src={conversation.listings.photos[0]}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>📦</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold">{getOtherUser()}</div>
          <div className="text-xs text-zinc-500 truncate">
            Re: {conversation && conversation.listings && conversation.listings.title}
          </div>
        </div>

        <button
          onClick={() => conversation && navigate('/listing/' + conversation.listing_id)}
          className="text-xs text-orange-500 hover:text-orange-400 transition flex-shrink-0"
        >
          View listing
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {loading && (
          <div className="text-center text-zinc-500 py-8">Loading...</div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-center text-zinc-500 py-8">
            <div className="text-3xl mb-2">👋</div>
            <div className="text-sm">Start the conversation!</div>
          </div>
        )}

        {messages.map(msg => {
          const isMine = msg.sender_id === user.id
          return (
            <div
              key={msg.id}
              className={'flex ' + (isMine ? 'justify-end' : 'justify-start')}
            >
              <div className={'max-w-xs lg:max-w-md flex flex-col gap-1 ' + (isMine ? 'items-end' : 'items-start')}>
                <div className={'px-4 py-2.5 rounded-2xl text-sm leading-relaxed ' + (
                  isMine
                    ? 'bg-orange-500 text-white rounded-br-sm'
                    : 'bg-zinc-800 text-white rounded-bl-sm'
                )}>
                  {msg.content}
                </div>
                <div className="text-xs text-zinc-600 px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 px-4 py-3 flex gap-3 bg-zinc-950">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message..."
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition"
        />
        <button
          onClick={sendMessage}
          disabled={sending || !input.trim()}
          className="px-5 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition"
        >
          Send
        </button>
      </div>
    </div>
  )
}
