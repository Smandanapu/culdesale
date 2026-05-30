import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import SkeletonCard from '../components/SkeletonCard'
const CATEGORIES = ['All', 'Furniture', 'Electronics', 'Sports', 'Kids', 'Tools', 'Appliances', 'Clothing', 'Books', 'Other']

function getDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null
  const R = 3958.8; // Radius of Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

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
  const [zipSearch, setZipSearch] = useState('')
  const [radius, setRadius] = useState('All')
  const RADIUS_OPTIONS = ['All', '5 miles', '10 miles', '15 miles', '20 miles', '25 miles', '50 miles']
  const [searchCoords, setSearchCoords] = useState(null)

  const [listings, setListings] = useState([])
  const [category, setCategory] = useState('All')
const [sortOption, setSortOption] = useState('Newest')

  const SORT_OPTIONS = ['Newest', 'Ending Soonest', 'Price: Low to High', 'Price: High to Low', 'Free Items']
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState(new Set())
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const pageRef = useRef(0)
  const observerTarget = useRef(null)
  const PAGE_SIZE = 12
  const [sellerRatings, setSellerRatings] = useState({})

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

    if (zipSearch && zipSearch.length === 5) {
      if (radius === 'All' || !searchCoords) {
        query = query.eq('zip_code', zipSearch)
      } else {
        const maxDist = parseInt(radius.split(' ')[0])
        const latDiff = maxDist / 69.0
        const lonDiff = Math.abs(maxDist / (69.0 * Math.cos(searchCoords.lat * Math.PI / 180)))
        
        const minLat = searchCoords.lat - latDiff
        const maxLat = searchCoords.lat + latDiff
        const minLon = searchCoords.lon - lonDiff
        const maxLon = searchCoords.lon + lonDiff
        
        query = query.or(`zip_code.eq.${zipSearch},and(latitude.gte.${minLat},latitude.lte.${maxLat},longitude.gte.${minLon},longitude.lte.${maxLon})`)
      }
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
  }, [category, search, zipSearch, radius, sortOption, searchCoords])

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

  useEffect(() => {
    if (zipSearch.length === 5) {
      fetch(`https://api.zippopotam.us/us/${zipSearch}`)
        .then(res => res.json())
        .then(data => {
          if (data.places && data.places.length > 0) {
            setSearchCoords({
              lat: parseFloat(data.places[0].latitude),
              lon: parseFloat(data.places[0].longitude)
            })
          } else {
            setSearchCoords(null)
          }
        })
        .catch(() => setSearchCoords(null))
    } else {
      setSearchCoords(null)
    }
  }, [zipSearch])

  // Fetch ratings for all unique sellers on the current feed
  useEffect(() => {
    if (!listings || listings.length === 0) return
    const sellerIds = [...new Set(listings.map(l => l.seller_id).filter(Boolean))]
    if (sellerIds.length === 0) return

    supabase
      .from('reviews')
      .select('seller_id, rating')
      .in('seller_id', sellerIds)
      .then(({ data }) => {
        if (data) {
          const groups = {}
          data.forEach(r => {
            if (!groups[r.seller_id]) groups[r.seller_id] = []
            groups[r.seller_id].push(r.rating)
          })
          const map = {}
          Object.keys(groups).forEach(sellerId => {
            const ratings = groups[sellerId]
            const avg = (ratings.reduce((sum, val) => sum + val, 0) / ratings.length).toFixed(1)
            map[sellerId] = { avg, count: ratings.length }
          })
          setSellerRatings(map)
        }
      })
  }, [listings])

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchListings(true)
        }
      },
      { rootMargin: '100px' }
    )
    if (observerTarget.current) observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, fetchListings])


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

  const listingsWithDistance = listings.map(l => {
    if (searchCoords && l.latitude && l.longitude) {
      return { ...l, computedDistance: getDistance(searchCoords.lat, searchCoords.lon, l.latitude, l.longitude) }
    }
    return l;
  });

  const filteredListings = listingsWithDistance.filter(l => {
    if (radius === 'All' || !searchCoords) return true;
    if (l.zip_code === zipSearch) return true; // Always include exact ZIP match
    const maxDist = parseInt(radius.split(' ')[0]);
    return l.computedDistance !== undefined && l.computedDistance !== null && l.computedDistance <= maxDist;
  });

  const liveDrops = filteredListings.filter(l => l.is_live_drop);
  const regularListings = filteredListings.filter(l => !l.is_live_drop);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] bg-grid-pattern text-slate-900 dark:text-slate-100 relative overflow-hidden">
      {/* Floating Ambient Glow Orbs */}
      <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none animate-float-slow z-0" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none animate-float-slower z-0" />

      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6 relative z-10">

        {/* Search & Sort & ZIP Code */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1 group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 group-focus-within:text-orange-400 transition-colors">🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search listings in your neighborhood..."
              className="w-full bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl pl-11 pr-10 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:bg-white dark:focus:bg-white/[0.04] focus:ring-1 focus:ring-orange-500/20 backdrop-blur-md transition-all duration-300 shadow-inner"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-40 group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 group-focus-within:text-orange-400 transition-colors">📍</span>
            <input
              value={zipSearch}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 5)
                setZipSearch(val)
              }}
              placeholder="ZIP Code"
              className="w-full bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:bg-white dark:focus:bg-white/[0.04] focus:ring-1 focus:ring-orange-500/20 backdrop-blur-md transition-all duration-300 shadow-inner"
            />
            {zipSearch && (
              <button
                onClick={() => setZipSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-40 group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 group-focus-within:text-orange-400 transition-colors">🎯</span>
            <select
              value={radius}
              onChange={e => setRadius(e.target.value)}
              className="w-full bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] hover:border-orange-500/40 hover:bg-white dark:bg-white/[0.04] rounded-xl pl-10 pr-8 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all cursor-pointer appearance-none shadow-sm"
            >
              {RADIUS_OPTIONS.map(r => (
                <option key={r} value={r} className="bg-slate-50 dark:bg-[#07090e] text-slate-600 dark:text-slate-300">{r === 'All' ? 'Any distance' : r}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none group-hover:text-orange-400 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        {/* Categories and Sort */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex justify-between items-end px-1">
            <h2 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Browse</h2>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none group-hover:text-orange-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
              </div>
  
                <select value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] hover:border-orange-500/40 hover:bg-white dark:bg-white/[0.04] rounded-xl pl-9 pr-8 py-2.5 text-sm text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all cursor-pointer appearance-none shadow-sm"
              >
                {SORT_OPTIONS.map(s => (
                  <option key={s} value={s} className="bg-slate-50 dark:bg-[#07090e] text-slate-600 dark:text-slate-300">{s}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none group-hover:text-orange-400 transition-colors">
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
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-900 dark:text-white shadow-md shadow-orange-500/10'
                    : 'bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-white/[0.05]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={`skeleton-${i}`} />
            ))}
          </div>
        )}

        {!loading && filteredListings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white/[0.01] border border-slate-200 dark:border-white/[0.04] rounded-2xl p-8 backdrop-blur-md max-w-lg mx-auto">
            <div className="text-5xl mb-4 animate-bounce">📦</div>
            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">No listings found</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-xs">Be the first to share something or try a different filter or search term</p>
            <button
              onClick={() => navigate('/create')}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 text-slate-900 dark:text-white rounded-lg font-semibold transition-all shadow-lg shadow-orange-500/25 active:scale-95 cursor-pointer"
            >
              + List Your First Item
            </button>
          </div>
        )}

        {/* 🔥 Live Drops Section */}
        {!loading && liveDrops.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-black text-orange-500 mb-4 flex items-center gap-2">
              <span className="animate-pulse">🔥</span> LIVE DROPS
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-orange-500/20">
              {liveDrops.map(listing => (
                <div
                  key={listing.id}
                  onClick={() => navigate('/listing/' + listing.id)}
                  className="w-72 shrink-0 card-gradient-border bg-[#0a0a0a] backdrop-blur-md border-2 border-orange-500/30 rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1.5 hover:shadow-[0_0_20px_rgba(249,115,22,0.2)] transition-all duration-300 flex flex-col group"
                >
                  <div className="h-40 bg-black flex items-center justify-center relative overflow-hidden">
                    {listing.photos && listing.photos[0] ? (
                      <img
                        src={listing.photos[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                      />
                    ) : (
                      <span className="text-4xl">📦</span>
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl mb-1">⏱️</span>
                      <span className="text-white font-black tracking-widest text-lg drop-shadow-md bg-black/50 px-3 py-1 rounded-md border border-white/10">
                        {listing.drop_time && new Date(listing.drop_time) > new Date() ? 'DROPS SOON' : 'LIVE NOW'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-white text-lg truncate mb-1">{listing.title}</h3>
                    <p className="text-xs font-semibold text-orange-400">
                      {listing.drop_time ? new Date(listing.drop_time).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'}) : 'TBD'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && regularListings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularListings.map(listing => (
              <div
                key={listing.id}
                onClick={() => navigate('/listing/' + listing.id)}
                className="card-gradient-border bg-white dark:bg-white/[0.015] backdrop-blur-md border border-slate-200 dark:border-white/[0.04] rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col h-full group"
              >
                {/* Image */}
                <div className="h-48 bg-white dark:bg-white/[0.02] flex items-center justify-center relative overflow-hidden border-b border-slate-200 dark:border-white/[0.04]">
                  {listing.photos && listing.photos[0] ? (
                    <>
                      <img
                        src={listing.photos[0]}
                        alt={listing.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {listing.photos.length > 1 && (
                        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 bg-black/50 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-2 py-1 rounded-lg pointer-events-none shadow-md">
                          <span>📸</span> {listing.photos.length}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-5xl transition-transform duration-500 group-hover:scale-110">📦</span>
                  )}

                  {/* SOLD Overlay */}
                  {listing.status === 'sold' && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10 backdrop-blur-[2px]">
                      <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-widest transform -rotate-12 border-4 border-white px-5 py-1.5 rounded-sm">
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
                <div className="p-5 flex flex-col flex-grow justify-between relative">
                  <div>
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">{listing.category}</div>
                        {listing.zip_code && (
                          <div className="text-[10px] text-slate-500 font-bold bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.05] px-1.5 py-0.5 rounded-md">
                            Zip:{listing.zip_code}
                          </div>
                        )}
                      </div>
                      
                      {listing.computedDistance !== undefined && listing.computedDistance !== null && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                          <span>📍</span>
                          {listing.computedDistance.toFixed(1)} mi away
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 truncate group-hover:text-orange-400 transition-colors duration-200">{listing.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 mb-4 h-10">{listing.description}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/[0.04] pt-4 mb-3">
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
                      <div className="text-xs text-slate-500 dark:text-slate-400 text-right">
                        <div className="flex items-center justify-end gap-1.5 font-semibold text-slate-900 dark:text-white/95">
                          <span 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (listing.profiles?.username) navigate(`/user/${listing.profiles.username}`); 
                            }}
                            className={listing.profiles?.username ? "hover:text-orange-500 hover:underline cursor-pointer transition-colors" : ""}
                          >
                            @{listing.profiles?.username || 'neighbor'}
                          </span>
                          {sellerRatings[listing.seller_id] && (
                            <span className="text-amber-400 font-extrabold text-[11px] flex items-center gap-0.5 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                              ★{sellerRatings[listing.seller_id].avg}
                            </span>
                          )}
                        </div>
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

        {/* Infinite Scroll Target */}
        {!loading && hasMore && filteredListings.length > 0 && (
          <div ref={observerTarget} className="flex justify-center mt-10 mb-10 h-10">
            {loadingMore && (
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold">
                <div className="w-5 h-5 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                Loading more...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
