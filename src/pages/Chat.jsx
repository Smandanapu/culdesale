import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
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
    <div className="min-h-screen bg-[#07090e] bg-grid-pattern text-slate-100 flex flex-col relative overflow-hidden">
      {/* Floating Ambient Glow Orbs */}
      <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/5 blur-[120px] pointer-events-none animate-float-slow z-0" />
      <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/5 blur-[140px] pointer-events-none animate-float-slower z-0" />

      <Navbar />

      {/* Chat Header */}
      <div className="border-b border-white/[0.06] px-6 py-4 flex items-center gap-3 bg-[#07090e]/75 backdrop-blur-md relative z-10">
        <button
          onClick={() => navigate('/inbox')}
          className="text-slate-400 hover:text-white transition-all hover:-translate-x-1 cursor-pointer font-bold text-xl"
        >
          ←
        </button>

        <div className="w-11 h-11 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
          {conversation && conversation.listings && conversation.listings.photos && conversation.listings.photos[0] ? (
            <img
              src={conversation.listings.photos[0]}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl">📦</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-base">@{getOtherUser() || 'neighbor'}</div>
          <div className="text-xs text-indigo-400 font-semibold tracking-wide truncate mt-0.5">
            Re: {conversation && conversation.listings && conversation.listings.title}
          </div>
        </div>

        <button
          onClick={() => conversation && navigate('/listing/' + conversation.listing_id)}
          className="text-xs text-orange-400 hover:text-orange-300 font-bold transition-colors flex-shrink-0 cursor-pointer"
        >
          View Listing
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4 relative z-10">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <div className="w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
            <span className="text-xs font-semibold tracking-wide">Loading chat messages...</span>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-center text-slate-400 py-20 bg-white/[0.01] border border-white/[0.04] rounded-2xl max-w-sm mx-auto w-full backdrop-blur-md">
            <div className="text-4xl mb-3 animate-bounce">👋</div>
            <div className="text-sm font-bold text-white mb-1">Start the conversation!</div>
            <div className="text-xs text-slate-500">Ask about item availability, pickup time, or details</div>
          </div>
        )}

        {messages.map(msg => {
          const isMine = msg.sender_id === user.id
          return (
            <div
              key={msg.id}
              className={'flex ' + (isMine ? 'justify-end' : 'justify-start')}
            >
              <div className={'max-w-xs lg:max-w-md flex flex-col gap-1.5 ' + (isMine ? 'items-end' : 'items-start')}>
                <div className={'px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-md ' + (
                  isMine
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-br-sm shadow-orange-500/10'
                    : 'bg-white/[0.04] border border-white/[0.06] text-slate-100 rounded-bl-sm'
                )}>
                  {msg.content}
                </div>
                <div className="text-[10px] text-slate-500 px-1 font-semibold tracking-wider">
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
      <div className="border-t border-white/[0.06] px-6 py-4 flex gap-3 bg-[#07090e]/90 backdrop-blur-md relative z-10">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message to your neighbor..."
          className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:bg-white/[0.04] focus:ring-1 focus:ring-orange-500/20 transition-all duration-300 shadow-inner"
        />
        <button
          onClick={sendMessage}
          disabled={sending || !input.trim()}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all active:scale-95 cursor-pointer shadow-lg shadow-orange-500/20"
        >
          Send
        </button>
      </div>
    </div>
  )
}
