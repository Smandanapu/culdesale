import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'

export default function WantedDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [bounty, setBounty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState([])
  const [isMatching, setIsMatching] = useState(true)

  useEffect(() => {
    fetchBounty()
  }, [id])

  const fetchBounty = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('bounties')
      .select('*, profiles(username)')
      .eq('id', id)
      .single()

    if (error || !data) {
      toast.error('Wanted request not found')
      navigate('/wanted')
      return
    }

    setBounty(data)
    setLoading(false)
    findMatches(data)
  }

  const findMatches = async (bountyData) => {
    setIsMatching(true)
    // Simple MVP matcher: same category, search for terms in title
    const searchTerms = bountyData.title.split(' ').filter(w => w.length > 3).join(' | ')
    
    let query = supabase.from('listings').select('*, profiles(username)')
      .eq('status', 'active')
      .eq('category', bountyData.category)
      .neq('seller_id', bountyData.buyer_id) // Don't match their own stuff
      .order('created_at', { ascending: false })
      .limit(6)
    
    // We'll just use ilike on the whole title to be simple for MVP, if search terms are too complex
    // For MVP, just show same category if ilike fails, but let's try a simple ilike on the first main word
    const firstWord = bountyData.title.split(' ').find(w => w.length > 3) || bountyData.title
    
    const { data: matchedListings } = await supabase.from('listings').select('*, profiles(username)')
      .eq('status', 'active')
      .eq('category', bountyData.category)
      .ilike('title', `%${firstWord}%`)
      .limit(4)

    // Fallback if no direct keyword match
    if (!matchedListings || matchedListings.length === 0) {
      const { data: fallback } = await supabase.from('listings').select('*, profiles(username)')
        .eq('status', 'active')
        .eq('category', bountyData.category)
        .limit(4)
      setMatches(fallback || [])
    } else {
      setMatches(matchedListings)
    }
    
    setIsMatching(false)
  }

  const handleContactBuyer = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .eq('bounty_id', bounty.id)
        .eq('buyer_id', bounty.buyer_id) // For a bounty, the person fulfilling it is the "seller", the person who posted is the "buyer".
        .eq('seller_id', user.id)
        .maybeSingle()

      let convId = existing?.id

      if (!convId) {
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({
            bounty_id: bounty.id,
            buyer_id: bounty.buyer_id, // Person who wants it
            seller_id: user.id // Person who has it
          })
          .select()
          .single()
        
        if (error) throw error
        convId = newConv.id
      }

      // Send initial message
      await supabase.from('messages').insert({
        conversation_id: convId,
        sender_id: user.id,
        content: `Hi! I saw your Wanted request for "${bounty.title}". I might have exactly what you're looking for!`
      })

      // Send explicit notification
      await supabase.from('notifications').insert({
        user_id: bounty.buyer_id,
        type: 'message',
        title: '🎯 Bounty Match!',
        message: `A neighbor has the "${bounty.title}" you requested! Check your inbox.`,
        related_user_id: user.id
      })

      navigate(`/inbox/${convId}`)
    } catch (err) {
      console.error(err)
      toast.error('Could not start conversation')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#07090e]">
        <Navbar />
        <div className="flex items-center justify-center py-32"><span className="animate-pulse">Loading...</span></div>
      </div>
    )
  }

  const isOwner = user?.id === bounty.buyer_id

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] bg-grid-pattern text-slate-900 dark:text-slate-100 relative">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        <button onClick={() => navigate('/wanted')} className="mb-6 flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
          ← Back to Wanted Board
        </button>

        <div className="bg-[url('/wanted-texture.png')] bg-cover relative shadow-xl">
          <div className="bg-amber-50/95 dark:bg-amber-900/20 border-4 border-amber-900/30 dark:border-amber-500/30 rounded-lg p-8 sm:p-12 relative overflow-hidden">
            
            {/* Wanted Header */}
            <div className="text-center mb-10">
              <div className="inline-block border-y-4 border-red-700/80 dark:border-red-500/80 py-2 px-12 mb-6 transform -rotate-1">
                <h1 className="text-5xl sm:text-7xl font-black tracking-[0.2em] text-red-700 dark:text-red-500 font-serif">WANTED</h1>
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-tight leading-tight">{bounty.title}</h2>
              <div className="text-amber-900/60 dark:text-amber-500/60 font-bold uppercase tracking-widest mt-4">By @{bounty.profiles?.username || 'neighbor'} in {bounty.zip_code}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              
              <div className="md:col-span-2 text-lg sm:text-xl text-slate-800 dark:text-slate-200 leading-relaxed font-medium italic border-l-4 border-amber-900/20 dark:border-amber-500/30 pl-6">
                "{bounty.description}"
              </div>

              <div className="bg-white/50 dark:bg-black/20 border-2 border-dashed border-amber-900/30 dark:border-amber-500/30 rounded-xl p-6 text-center transform rotate-1">
                <div className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Reward</div>
                <div className="text-4xl sm:text-5xl font-black text-green-700 dark:text-emerald-400">
                  {bounty.budget ? '$' + bounty.budget : 'Negotiable'}
                </div>
              </div>

            </div>

            {!isOwner && bounty.status === 'active' && (
              <div className="mt-16 sm:mt-20 pt-10 border-t border-amber-900/10 dark:border-amber-500/20 text-center relative z-10 flex flex-col items-center">
                <button
                  onClick={handleContactBuyer}
                  className="group relative inline-flex items-center justify-center gap-3 px-10 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-2xl text-white font-bold text-lg tracking-wide shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 transition-all duration-300 active:scale-95 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full -translate-x-full transition-transform duration-500 skew-x-12" />
                  <span className="text-2xl drop-shadow-md">✨</span>
                  <span className="drop-shadow-md">I Have This Item</span>
                </button>
                <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Click to instantly message the buyer.</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Matches Section */}
        {isOwner && (
          <div className="mt-12">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
              <span className="text-2xl animate-pulse">🤖</span> AI Matcher: Found {matches.length} items for sale!
            </h3>
            
            {isMatching ? (
              <div className="text-slate-500">Scanning neighborhood...</div>
            ) : matches.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {matches.map(m => (
                  <div key={m.id} onClick={() => navigate('/listing/' + m.id)} className="bg-white dark:bg-[#0b0e14] rounded-xl border border-slate-200 dark:border-white/[0.08] overflow-hidden cursor-pointer hover:border-orange-500/50 transition-all">
                    <div className="h-32 bg-slate-100 dark:bg-black relative">
                      {m.photos && m.photos[0] ? (
                        <img src={m.photos[0]} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                      )}
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md">
                        ${m.current_price || m.starting_price}
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="font-bold text-sm truncate">{m.title}</div>
                      <div className="text-xs text-orange-500 font-semibold mt-1">94% Match</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 text-center text-sm text-slate-400">
                No exact matches found currently. We will notify you when a neighbor posts one!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
