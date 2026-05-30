import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { compressImage } from '../lib/imageCompression'

export default function Chat() {
  const { conversationId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)

  const [messages, setMessages] = useState([])
  const [conversation, setConversation] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showOfferInput, setShowOfferInput] = useState(false)
  const [offerAmount, setOfferAmount] = useState('')
  const [sendingOffer, setSendingOffer] = useState(false)

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
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: 'conversation_id=eq.' + conversationId
      }, payload => {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m))
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
        bounty_id,
        seller_id,
        buyer_id,
        listings(title, photos),
        bounties(title),
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
    if (!input.trim() || !conversation) return
    setSending(true)
    const content = input.trim()
    setInput('')

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      message_type: 'text',
      is_read: false,
    })

    const recipientId = user.id === conversation.seller_id ? conversation.buyer_id : conversation.seller_id
    if (recipientId) {
      await supabase.from('notifications').insert({
        user_id: recipientId,
        type: 'message',
        title: 'New Message',
        message: `New message regarding "${conversation.listings?.title || conversation.bounties?.title || 'an item'}"`,
        listing_id: conversation.listing_id
      })
    }

    setSending(false)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !conversation) return
    setUploadingImage(true)

    try {
      const compressedFile = await compressImage(file, 1200, 0.8)
      const ext = compressedFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      
      const { error } = await supabase.storage
        .from('chat-images')
        .upload(path, compressedFile)

      if (error) throw error

      const { data } = supabase.storage
        .from('chat-images')
        .getPublicUrl(path)
      
      const imageUrl = data.publicUrl

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: 'Sent an image',
        message_type: 'image',
        image_url: imageUrl,
        is_read: false,
      })

      const recipientId = user.id === conversation.seller_id ? conversation.buyer_id : conversation.seller_id
      if (recipientId) {
        await supabase.from('notifications').insert({
          user_id: recipientId,
          type: 'message',
          title: 'New Photo',
          message: `New photo regarding "${conversation.listings?.title || conversation.bounties?.title || 'an item'}"`,
          listing_id: conversation.listing_id
        })
      }
    } catch (err) {
      console.error(err)
      alert('Failed to upload image')
    }
    setUploadingImage(false)
    e.target.value = ''
  }

  const sendOffer = async () => {
    const amt = parseFloat(offerAmount)
    if (isNaN(amt) || amt <= 0 || !conversation) return
    setSendingOffer(true)
    setShowOfferInput(false)
    setOfferAmount('')

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: `Sent an offer of $${amt.toFixed(2)}`,
      message_type: 'offer',
      offer_amount: amt,
      offer_status: 'pending',
      is_read: false,
    })

    const recipientId = user.id === conversation.seller_id ? conversation.buyer_id : conversation.seller_id
    if (recipientId) {
      await supabase.from('notifications').insert({
        user_id: recipientId,
        type: 'message',
        title: 'New Offer',
        message: `New offer of $${amt.toFixed(2)} regarding "${conversation.listings?.title || conversation.bounties?.title || 'an item'}"`,
        listing_id: conversation.listing_id
      })
    }

    setSendingOffer(false)
  }

  const handleOfferResponse = async (msg, status) => {
    if (msg.offer_status !== 'pending') return
    
    // Update message
    await supabase.from('messages').update({ offer_status: status }).eq('id', msg.id)

    if (status === 'accepted') {
      // Option B: Automatically reserve listing and update price
      await supabase.from('listings').update({
        status: 'reserved',
        buy_now_price: msg.offer_amount
      }).eq('id', conversation.listing_id)
    }

    // Send notification to buyer
    const recipientId = msg.sender_id
    await supabase.from('notifications').insert({
      user_id: recipientId,
      type: 'message',
      title: `Offer ${status === 'accepted' ? 'Accepted' : 'Declined'}`,
      message: `Your offer of $${msg.offer_amount} for "${conversation.listings?.title || conversation.bounties?.title || 'an item'}" was ${status}.`,
      listing_id: conversation.listing_id
    })
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (showOfferInput) {
        sendOffer()
      } else {
        sendMessage()
      }
    }
  }

  const getOtherUser = () => {
    if (!conversation) return ''
    return user.id === conversation.seller_id
      ? conversation.buyer && conversation.buyer.username
      : conversation.seller && conversation.seller.username
  }

  return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-[#07090e] bg-grid-pattern text-slate-900 dark:text-slate-100 flex flex-col relative overflow-hidden">
      <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/5 blur-[120px] pointer-events-none animate-float-slow z-0" />
      <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/5 blur-[140px] pointer-events-none animate-float-slower z-0" />

      <Navbar />

      <div className="border-b border-slate-200 dark:border-white/[0.06] px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-3 bg-slate-50 dark:bg-[#07090e]/75 backdrop-blur-md relative z-10">
        <button
          onClick={() => navigate('/inbox')}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-all hover:-translate-x-1 cursor-pointer font-bold text-xl"
        >
          ←
        </button>

        <div className="w-11 h-11 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
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
          <div className="font-bold text-slate-900 dark:text-white text-base">@{getOtherUser() || 'neighbor'}</div>
          <div className="text-xs text-indigo-400 font-semibold tracking-wide truncate mt-0.5">
            Re: {(conversation?.listings?.title) || (conversation?.bounties?.title) || 'an item'}
          </div>
        </div>

        {conversation?.listing_id ? (
          <button
            onClick={() => navigate('/listing/' + conversation.listing_id)}
            className="text-xs text-orange-400 hover:text-orange-300 font-bold transition-colors flex-shrink-0 cursor-pointer"
          >
            View Listing
          </button>
        ) : conversation?.bounty_id ? (
          <button
            onClick={() => navigate('/wanted/' + conversation.bounty_id)}
            className="text-xs text-orange-400 hover:text-orange-300 font-bold transition-colors flex-shrink-0 cursor-pointer"
          >
            View Wanted
          </button>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-4 relative z-10">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400 gap-3">
            <div className="w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
            <span className="text-xs font-semibold tracking-wide">Loading chat messages...</span>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-center text-slate-500 dark:text-slate-400 py-20 bg-white/[0.01] border border-slate-200 dark:border-white/[0.04] rounded-2xl max-w-sm mx-auto w-full backdrop-blur-md">
            <div className="text-4xl mb-3 animate-bounce">👋</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">Start the conversation!</div>
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
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-900 dark:text-white rounded-br-sm shadow-orange-500/10'
                    : 'bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] text-slate-900 dark:text-slate-100 rounded-bl-sm'
                )}>
                  {msg.message_type === 'image' && msg.image_url ? (
                    <img src={msg.image_url} alt="Chat image" className="max-w-full rounded-lg cursor-pointer hover:opacity-90" onClick={() => window.open(msg.image_url, '_blank')} />
                  ) : msg.message_type === 'offer' ? (
                    <div className="flex flex-col gap-3 min-w-[200px]">
                      <div className="font-bold text-center text-lg">Offer: ${msg.offer_amount}</div>
                      <div className="text-center font-semibold text-xs uppercase tracking-wider opacity-80 bg-black/10 dark:bg-white/10 rounded py-1">
                        Status: {msg.offer_status}
                      </div>
                      {msg.offer_status === 'pending' && !isMine && user.id === conversation?.seller_id && (
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => handleOfferResponse(msg, 'accepted')} className="flex-1 bg-green-500 text-white rounded py-1.5 font-bold hover:bg-green-600 active:scale-95 transition-all text-xs cursor-pointer">Accept</button>
                          <button onClick={() => handleOfferResponse(msg, 'rejected')} className="flex-1 bg-rose-500 text-white rounded py-1.5 font-bold hover:bg-rose-600 active:scale-95 transition-all text-xs cursor-pointer">Decline</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    msg.content
                  )}
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

      <div className="border-t border-slate-200 dark:border-white/[0.06] px-2 sm:px-6 py-2 sm:py-4 flex flex-col gap-2 bg-slate-50 dark:bg-[#07090e]/90 backdrop-blur-md relative z-10 pb-safe">
        
        {showOfferInput && (
          <div className="flex gap-1 sm:gap-2 mb-2 p-2 sm:p-3 bg-white dark:bg-white/[0.02] border border-orange-500/30 rounded-xl items-center animate-in slide-in-from-bottom-4 shadow-sm">
            <span className="font-bold text-orange-500 text-lg sm:text-xl">$</span>
            <input 
              type="number"
              value={offerAmount}
              onChange={e => setOfferAmount(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Enter amount..."
              className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white font-bold w-16 sm:w-auto"
              autoFocus
            />
            <button onClick={() => setShowOfferInput(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold mr-1 sm:mr-2 cursor-pointer transition-colors">Cancel</button>
            <button onClick={sendOffer} disabled={sendingOffer || !offerAmount} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-lg font-bold disabled:opacity-50 text-xs sm:text-sm cursor-pointer hover:opacity-90 transition-opacity whitespace-nowrap">Send Offer</button>
          </div>
        )}

        <div className="flex gap-1.5 sm:gap-3 items-center">
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          <button 
            onClick={() => fileInputRef.current.click()}
            disabled={uploadingImage}
            className="p-2.5 sm:p-3 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-500 dark:text-slate-400 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-inner shrink-0"
            title="Send Photo"
          >
            {uploadingImage ? '⏳' : '📷'}
          </button>

          {conversation && user.id === conversation.buyer_id && (
             <button 
               onClick={() => setShowOfferInput(!showOfferInput)}
               className="p-2.5 sm:p-3 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-500 dark:text-slate-400 rounded-xl transition-colors cursor-pointer shadow-inner shrink-0"
               title="Make Offer"
             >
               🤝
             </button>
          )}

          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Message..."
            className="flex-1 min-w-0 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:bg-white dark:focus:bg-white/[0.04] focus:ring-1 focus:ring-orange-500/20 transition-all duration-300 shadow-inner"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="px-4 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 dark:text-white font-bold rounded-xl transition-all active:scale-95 cursor-pointer shadow-lg shadow-orange-500/20 shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
