import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
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
  const [search, setSearch] = useState('')
  const [listings, setListings] = useState([])
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)

  const fetchListings = useCallback(async () => {
    const { data } = await supabase
      .from('listings')
      .select('*, profiles(username)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    setListings(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchListings()

    const channel = supabase
      .channel('feed-listings')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'listings'
      }, payload => {
        setListings(prev => [payload.new, ...prev])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchListings])

  const filtered = listings.filter(l => {
    const matchesCategory = category === 'All' || l.category === category
    const matchesSearch = search === '' ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.description?.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6">

      {/* Search */}
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search listings..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition"
            >
              ✕
            </button>
          )}
        </div>
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition font-medium
                ${category === c
                  ? 'bg-orange-500 text-white'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24 text-zinc-500">
            Loading listings...
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-xl font-bold mb-2">No listings yet</h3>
            <p className="text-zinc-400 text-sm mb-6">Be the first to list something in your neighborhood</p>
            <button
              onClick={() => navigate('/create')}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition"
            >
              + List Your First Item
            </button>
          </div>
        )}

        {/* Listings Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(listing => (
              <div
                key={listing.id}
                onClick={() => navigate(`/listing/${listing.id}`)}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden cursor-pointer hover:border-orange-500/40 hover:-translate-y-1 transition-all duration-200"
              >
                {/* Image */}
                <div className="h-48 bg-zinc-800 flex items-center justify-center relative">
                  {listing.photos && listing.photos[0] ? (
                    <img
                      src={listing.photos[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl">📦</span>
                  )}
                  <div className="absolute top-3 right-3">
                    {listing.is_free ? (
                      <span className="bg-blue-500/20 text-blue-400 text-xs font-medium px-2 py-1 rounded-full">FREE</span>
                    ) : (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        listing.status === 'sold'
                          ? 'bg-blue-500/20 text-blue-400'
                          : timeLeft(listing.ends_at) === 'Ended'
                          ? 'bg-zinc-500/20 text-zinc-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {listing.status === 'sold' ? 'Sold' : timeLeft(listing.ends_at)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="text-xs text-zinc-500 mb-1">{listing.category}</div>
                  <h3 className="font-bold text-base mb-1 truncate">{listing.title}</h3>
                  <p className="text-zinc-400 text-sm truncate mb-3">{listing.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      {listing.is_free ? (
                        <span className="text-blue-400 font-bold text-lg">Free</span>
                      ) : (
                        <span className="text-orange-500 font-bold text-lg">${listing.current_price || listing.starting_price}</span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500">
                      by {listing.profiles?.username}
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
