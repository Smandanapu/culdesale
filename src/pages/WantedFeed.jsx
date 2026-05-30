import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import SkeletonCard from '../components/SkeletonCard'

const CATEGORIES = ['All', 'Furniture', 'Electronics', 'Sports', 'Kids', 'Tools', 'Appliances', 'Clothing', 'Books', 'Other']

export default function WantedFeed() {
  const navigate = useNavigate()
  const [bounties, setBounties] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')

  const fetchBounties = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('bounties').select('*, profiles(username)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (category !== 'All') {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data } = await query
    if (data) {
      setBounties(data)
    }
    setLoading(false)
  }, [category, search])

  useEffect(() => {
    fetchBounties()

    const channel = supabase
      .channel('public:bounties')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bounties' }, payload => {
        if (payload.new.status === 'active') {
          setBounties(prev => [payload.new, ...prev])
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bounties' }, payload => {
        setBounties(prev => prev.map(b => b.id === payload.new.id ? { ...b, ...payload.new } : b))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchBounties])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] bg-grid-pattern text-slate-900 dark:text-slate-100 relative overflow-hidden">
      <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none animate-float-slow z-0" />
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span className="text-4xl">🎯</span> Neighborhood Wanted Board
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
              See what your neighbors are looking for. Got something lying around that matches? Sell it directly to them!
            </p>
          </div>
          <button
            onClick={() => navigate('/create-wanted')}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 text-slate-900 dark:text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-500/25 active:scale-95 whitespace-nowrap"
          >
            + Post a Request
          </button>
        </div>

        {/* Search & Categories */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="relative group max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search requested items..."
              className="w-full bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl pl-11 pr-10 py-3 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20 backdrop-blur-md"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/[0.05]">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  category === c
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-900 dark:text-white shadow-md shadow-orange-500/10'
                    : 'bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={`skel-${i}`} />)}
          </div>
        )}

        {!loading && bounties.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white/[0.01] border border-slate-200 dark:border-white/[0.04] rounded-2xl p-8 backdrop-blur-md max-w-lg mx-auto">
            <div className="text-5xl mb-4 animate-bounce">🎯</div>
            <h3 className="text-xl font-bold mb-2">No active requests</h3>
            <p className="text-slate-500 text-sm mb-6">Nobody is looking for anything right now, or try a different filter.</p>
            <button
              onClick={() => navigate('/create-wanted')}
              className="px-6 py-3 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 rounded-lg font-semibold transition-all"
            >
              Post a Request
            </button>
          </div>
        )}

        {!loading && bounties.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bounties.map(bounty => (
              <div
                key={bounty.id}
                onClick={() => navigate('/wanted/' + bounty.id)}
                className="bg-[url('/wanted-texture.png')] bg-cover relative group cursor-pointer hover:-translate-y-1.5 hover:rotate-1 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300"
              >
                <div className="bg-amber-100/95 dark:bg-amber-900/10 border-2 border-amber-900/20 dark:border-amber-500/20 rounded-sm p-6 shadow-[2px_4px_10px_rgba(0,0,0,0.1)] min-h-[220px] flex flex-col justify-between overflow-hidden relative">
                  
                  {/* Tape decoration */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-8 bg-white/40 backdrop-blur-sm -rotate-2 z-10" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}} />
                  
                  <div>
                    <div className="text-center mb-4">
                      <div className="text-xs font-black tracking-[0.2em] text-red-600 dark:text-red-500 uppercase border-b-2 border-red-600/30 dark:border-red-500/30 pb-1 mb-2 inline-block">WANTED</div>
                      <h3 className="font-extrabold text-xl text-slate-900 dark:text-slate-100 leading-tight drop-shadow-sm">{bounty.title}</h3>
                    </div>
                    
                    <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3 font-medium leading-relaxed italic border-l-2 border-amber-900/20 dark:border-amber-500/30 pl-3">
                      "{bounty.description}"
                    </p>
                  </div>
                  
                  <div className="mt-5 flex items-end justify-between border-t border-amber-900/10 dark:border-amber-500/20 pt-3">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Reward / Budget</div>
                      <div className="text-2xl font-black text-green-700 dark:text-emerald-400">
                        {bounty.budget ? '$' + bounty.budget : 'Negotiable'}
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      @{bounty.profiles?.username || 'neighbor'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
