import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

const CATEGORIES = ['All', 'Furniture', 'Electronics', 'Sports', 'Kids', 'Tools', 'Appliances', 'Clothing', 'Books', 'Other']

function timeLeft(endsAt) {
  if (!endsAt) return 'No expiry'
  const diff = new Date(endsAt) - new Date()
  if (diff <= 0) return 'Ended'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 24) return `${Math.floor(h / 24)}d left`
  if (h > 0) return `${h}h ${m}m left`
  return `${m}m left`
}

export default function Feed() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [search, setSearch] = useState('')

  const [listings, setListings] = useState([])
  const [category, setCategory] = useState('All')
const [sortOption, setSortOption] = useState('Newest')

  const SORT_OPTIONS = ['Newest', 'Ending Soonest', 'Price: Low to High', 'Price: High to Low', 'Free Items']
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState(new Set())
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const pageRef = useRef(0)
  const PAGE_SIZE = 12

  const fetchListings = useCallback(async (isLoadMore = false) => {
    const currentPage = isLoadMore ? pageRef.current + 1 : 0
    if (isLoadMore) setLoadingMore(true)
    else setLoading(true)

    let query = supabase.from('listings').select('*, profiles(username)')

    if (category !== 'All') {
      query = query.eq('category', category)
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (sortOption === 'Newest') {
      query = query.order('created_at', { ascending: false })
    } else if (sortOption === 'Ending Soonest') {
      query = query.not('ends_at', 'is', null).order('ends_at', { ascending: true })
    } else if (sortOption === 'Price: Low to High') {
      query = query.order('current_price', { ascending: true })
    } else if (sortOption === 'Price: High to Low') {
      query = query.order('current_price', { ascending: false })
    } else if (sortOption === 'Free Items') {
      query = query.eq('is_free', true).order('created_at', { ascending: false })
    }

    const { data } = await query.range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1)

    if (data) {
      setHasMore(data.length === PAGE_SIZE)
      if (isLoadMore) {
        setListings(prev => {
          const newIds = data.map(d => d.id)
          const filteredPrev = prev.filter(p => !newIds.includes(p.id))
          return [...filteredPrev, ...data]
        })
      } else {
        setListings(data)
      }
      pageRef.current = currentPage
    }
    
    setLoading(false)
    setLoadingMore(false)
  }, [category, search, sortOption])

  const fetchFavorites = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('favorites')
      .select('listing_id')
      .eq('user_id', user.id)
    setFavorites(new Set(data?.map(f => f.listing_id) || []))
  }, [user])

  useEffect(() => {
    fetchListings()
    fetchFavorites()

    // Refetch when tab becomes visible again
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchListings()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    const channel = supabase
      .channel('feed-listings')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'listings'
      }, payload => {
        setListings(prev => [payload.new, ...prev])
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'listings'
      }, payload => {
        setListings(prev => prev.map(l => l.id === payload.new.id ? { ...l, ...payload.new } : l))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [fetchListings, fetchFavorites])


  // Removed in-memory filtering since it's now handled by the database

  const toggleFavorite = async (e, listingId) => {
    e.stopPropagation()
    if (!user) {
      navigate('/login')
      return
    }

    const isFavorited = favorites.has(listingId)

    if (isFavorited) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('listing_id', listingId)
      const newFavs = new Set(favorites)
      newFavs.delete(listingId)
      setFavorites(newFavs)
    } else {
      await supabase
        .from('favorites')
        .insert({ user_id: user.id, listing_id: listingId })
      const newFavs = new Set(favorites)
      newFavs.add(listingId)
      setFavorites(newFavs)
    }
  }

  return (
    <div className="min-h-screen bg-[#07090e] bg-grid-pattern text-slate-100 relative overflow-hidden">
      {/* Floating Ambient Glow Orbs */}
      <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none animate-float-slow z-0" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none animate-float-slower z-0" />

      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6 relative z-10">

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1 group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-400 transition-colors">🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search listings in your neighborhood..."
              className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl pl-11 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:bg-white/[0.04] focus:ring-1 focus:ring-orange-500/20 backdrop-blur-md transition-all duration-300 shadow-inner"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>


        </div>

        {/* Categories and Sort */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex justify-between items-end px-1">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Browse</h2>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-orange-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
              </div>
  
                <select value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-white/[0.02] border border-white/[0.08] hover:border-orange-500/40 hover:bg-white/[0.04] rounded-xl pl-9 pr-8 py-2.5 text-sm text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all cursor-pointer appearance-none shadow-sm"
              >
                {SORT_OPTIONS.map(s => (
                  <option key={s} value={s} className="bg-[#07090e] text-slate-300">{s}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-orange-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/[0.05]">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all duration-200 font-semibold cursor-pointer ${
                  category === c
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/10'
                    : 'bg-white/[0.02] border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-3">
            <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
            <span className="text-sm font-medium tracking-wide">Loading neighborhood listings...</span>
          </div>
        )}

        {!loading && listings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white/[0.01] border border-white/[0.04] rounded-2xl p-8 backdrop-blur-md max-w-lg mx-auto">
            <div className="text-5xl mb-4 animate-bounce">📦</div>
            <h3 className="text-xl font-bold mb-2 text-white">No listings found</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-xs">Be the first to share something or try a different filter or search term</p>
            <button
              onClick={() => navigate('/create')}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 text-white rounded-lg font-semibold transition-all shadow-lg shadow-orange-500/25 active:scale-95 cursor-pointer"
            >
              + List Your First Item
            </button>
          </div>
        )}

        {!loading && listings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map(listing => (
              <div
                key={listing.id}
                onClick={() => navigate('/listing/' + listing.id)}
                className="card-gradient-border bg-white/[0.015] backdrop-blur-md border border-white/[0.04] rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col h-full group"
              >
                {/* Image */}
                <div className="h-48 bg-white/[0.02] flex items-center justify-center relative overflow-hidden border-b border-white/[0.04]">
                  {listing.photos && listing.photos[0] ? (
                    <img
                      src={listing.photos[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-5xl transition-transform duration-500 group-hover:scale-110">📦</span>
                  )}

                  {/* SOLD Overlay */}
                  {listing.status === 'sold' && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10 backdrop-blur-[2px]">
                      <div className="text-3xl font-extrabold text-white tracking-widest transform -rotate-12 border-4 border-white px-5 py-1.5 rounded-sm">
                        SOLD
                      </div>
                    </div>
                  )}

                  {/* RESERVED Overlay */}
                  {listing.status === 'reserved' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-[2px]">
                      <div className="text-2xl font-extrabold text-amber-400 tracking-widest transform -rotate-12 border-4 border-amber-400 px-5 py-1.5 rounded-sm">
                        RESERVED
                      </div>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3 z-20">
                    {listing.is_free ? (
                      <span className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-md">FREE</span>
                    ) : (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-md ${
                        listing.status === 'sold'
                          ? 'bg-zinc-500/10 border border-zinc-500/30 text-zinc-400'
                          : listing.status === 'reserved'
                          ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                          : timeLeft(listing.ends_at) === 'Ended'
                          ? 'bg-rose-500/10 border border-rose-500/25 text-rose-400'
                          : 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
                      }`}>
                        {listing.status === 'sold' ? 'Sold' : listing.status === 'reserved' ? 'Reserved' : timeLeft(listing.ends_at)}
                      </span>
                    )}
                  </div>

                  {/* Favorite Button */}
                  <div className="absolute top-3 left-3 z-20">
                    <button
                      onClick={(e) => toggleFavorite(e, listing.id)}
                      className="w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-base hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    >
                      {favorites.has(listing.id) ? '❤️' : '🤍'}
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 flex flex-col flex-grow justify-between">
                  <div>
                    <div className="text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-1.5">{listing.category}</div>
                    <h3 className="font-bold text-lg text-white mb-1 truncate group-hover:text-orange-400 transition-colors duration-200">{listing.title}</h3>
                    <p className="text-slate-400 text-sm line-clamp-2 mb-4 h-10">{listing.description}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between border-t border-white/[0.04] pt-4 mb-3">
                      <div>
                        {listing.is_free ? (
                          <span className="text-blue-400 font-extrabold text-xl">Free</span>
                        ) : (
                          <div>
                            <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider mb-0.5">
                              {listing.current_price && listing.current_price > listing.starting_price ? 'Highest Bid' : 'Starting Price'}
                            </div>
                            <span className="text-orange-400 font-extrabold text-xl">
                              ${listing.current_price || listing.starting_price}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 text-right">
                        <div className="font-semibold text-white/95">@{listing.profiles?.username || 'neighbor'}</div>
                        {!listing.is_free && listing.status !== 'sold' && timeLeft(listing.ends_at) !== 'Ended' && (
                          <div className="flex items-center gap-1 mt-1 justify-end text-emerald-400 font-medium">
                            <span>🕐</span>
                            <span>{timeLeft(listing.ends_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Buy It Now badge */}
                    {listing.buy_now_price && listing.status !== 'sold' && (
                      <div className="mt-2 flex items-center gap-1.5 bg-emerald-500/5 border border-emerald-500/15 text-emerald-400 px-3 py-1.5 rounded-xl justify-center text-xs font-semibold hover:bg-emerald-500/10 transition-colors">
                        <span>⚡ Buy Instantly:</span>
                        <span className="font-bold">${listing.buy_now_price}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {!loading && hasMore && listings.length > 0 && (
          <div className="flex justify-center mt-10 mb-4">
            <button
              onClick={() => fetchListings(true)}
              disabled={loadingMore}
              className="px-8 py-3 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.08] text-white rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-lg"
            >
              {loadingMore ? (
                <>
                  <div className="w-4 h-4 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                  Loading...
                </>
              ) : (
                'Load More Listings'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
