import { useEffect, useState, useCallback } from 'react'
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
  const [sortOption, setSortOption] = useState('newest')
  const [listings, setListings] = useState([])
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState(new Set())

  const fetchListings = useCallback(async () => {
    const { data } = await supabase
      .from('listings')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false })

    const listingsWithBids = await Promise.all(
      (data || []).map(async (listing) => {
        const { data: bids } = await supabase
          .from('bids')
          .select('amount')
          .eq('listing_id', listing.id)
          .order('amount', { ascending: false })
          .limit(1)
        return {
          ...listing,
          highest_bid: bids && bids.length > 0 ? bids[0].amount : null
        }
      })
    )

    setListings(listingsWithBids)
    setLoading(false)
  }, [])

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
      }, () => {
        fetchListings()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [fetchListings, fetchFavorites])

  const filtered = listings.filter(l => {
    const matchesCategory = category === 'All' || l.category === category
    const matchesSearch = search === '' ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.description?.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  }).sort((a, b) => {
    if (sortOption === 'price_asc') {
      const priceA = a.is_free ? 0 : (a.highest_bid || a.current_price || a.starting_price || 0)
      const priceB = b.is_free ? 0 : (b.highest_bid || b.current_price || b.starting_price || 0)
      return priceA - priceB
    }
    if (sortOption === 'price_desc') {
      const priceA = a.highest_bid || a.current_price || a.starting_price || 0
      const priceB = b.highest_bid || b.current_price || b.starting_price || 0
      return priceB - priceA
    }
    if (sortOption === 'ending_soon') {
      if (!a.ends_at) return 1
      if (!b.ends_at) return -1
      return new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime()
    }
    return new Date(b.created_at) - new Date(a.created_at)
  })

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

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-slate-300 focus:outline-none focus:border-orange-500/60 focus:bg-white/[0.04] backdrop-blur-md cursor-pointer transition-all appearance-none pr-10 hover:bg-white/[0.04]"
            style={{ backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 1rem center", backgroundSize: "1em" }}
          >
            <option value="newest" className="bg-[#07090e]">Newest First</option>
            <option value="ending_soon" className="bg-[#07090e]">Ending Soonest</option>
            <option value="price_asc" className="bg-[#07090e]">Price: Low to High</option>
            <option value="price_desc" className="bg-[#07090e]">Price: High to Low</option>
          </select>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-thin scrollbar-thumb-white/[0.05]">
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

        {loading && (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-3">
            <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
            <span className="text-sm font-medium tracking-wide">Loading neighborhood listings...</span>
          </div>
        )}

        {!loading && filtered.length === 0 && (
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

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(listing => (
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
                              {listing.highest_bid ? 'Highest Bid' : 'Starting Price'}
                            </div>
                            <span className="text-orange-400 font-extrabold text-xl">
                              ${listing.highest_bid || listing.current_price || listing.starting_price}
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
      </div>
    </div>
  )
}
