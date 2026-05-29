import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import GarageSaleNavbar from '../components/GarageSaleNavbar'
import GarageSaleCard from '../components/GarageSaleCard'
import GarageSaleMap from '../components/GarageSaleMap'

const CATEGORIES = ['Furniture', 'Electronics', 'Sports', 'Kids', 'Tools', 'Appliances', 'Clothing', 'Books', 'Other']
const SORT_OPTIONS = ['Soonest', 'Newest', 'Nearest', 'Most Viewed']
const TIME_FILTERS = ['All Upcoming', 'Active Now', 'This Weekend']

function getDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default function GarageSales() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list') // 'map' or 'list'
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('Soonest')
  const [timeFilter, setTimeFilter] = useState('All Upcoming')
  const [userLocation, setUserLocation] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  
  const ITEMS_PER_PAGE = 20
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // Get user location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // silently fail
      )
    }
  }, [])

  const fetchSales = useCallback(async (isLoadMore = false) => {
    if (!isLoadMore) {
      setLoading(true)
      setPage(0)
    }
    
    const currentPage = isLoadMore ? page + 1 : 0
    const today = new Date().toISOString().split('T')[0]
    const nowTime = new Date().toTimeString().split(' ')[0].substring(0, 5)

    let query = supabase
      .from('garage_sales')
      .select('*')
      .in('status', ['upcoming', 'active'])

    if (timeFilter === 'Active Now') {
      query = query.lte('start_date', today).gte('end_date', today).lte('start_time', nowTime).gte('end_time', nowTime)
    } else {
      query = query.gte('end_date', today)
    }

    if (search.trim()) {
      query = query.or(`city.ilike.%${search}%,zip_code.ilike.%${search}%,title.ilike.%${search}%,address.ilike.%${search}%,neighborhood.ilike.%${search}%`)
    }

    if (selectedCategory !== 'All') {
      query = query.contains('categories', [selectedCategory])
    }

    if (sortBy === 'Soonest') {
      query = query.order('start_date', { ascending: true })
    } else if (sortBy === 'Newest') {
      query = query.order('created_at', { ascending: false })
    } else if (sortBy === 'Most Viewed') {
      query = query.order('view_count', { ascending: false })
    }

    query = query.range(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching garage sales:', error)
      if (!isLoadMore) setSales([])
    } else {
      let results = data || []

      if (timeFilter === 'This Weekend') {
        results = results.filter(sale => {
          const d = new Date(sale.start_date)
          const day = d.getDay()
          return day === 5 || day === 6 || day === 0 || day === 4 // Include Friday-Sunday (4 is rough due to timezone shift from GMT)
        })
      }

      let sorted = results
      
      if (sortBy === 'Nearest' && userLocation) {
        sorted = sorted.sort((a, b) => {
          const distA = getDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude)
          const distB = getDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude)
          return (distA || Infinity) - (distB || Infinity)
        })
      }

      if (isLoadMore) {
        setSales(prev => [...prev, ...sorted])
        setPage(currentPage)
      } else {
        setSales(sorted)
      }
      setHasMore(data.length === ITEMS_PER_PAGE)
    }
    setLoading(false)
  }, [search, selectedCategory, sortBy, userLocation, timeFilter, page])

  useEffect(() => {
    fetchSales(false)
  }, [search, selectedCategory, sortBy, userLocation, timeFilter])

  const getDistanceForSale = (sale) => {
    if (!userLocation || !sale.latitude || !sale.longitude) return null
    return getDistance(userLocation.lat, userLocation.lng, sale.latitude, sale.longitude)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] text-slate-900 dark:text-slate-100">
      <GarageSaleNavbar />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.07] via-teal-500/[0.05] to-cyan-500/[0.07] dark:from-emerald-500/[0.04] dark:via-teal-500/[0.03] dark:to-cyan-500/[0.04]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-4xl font-extrabold mb-2">
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Nearest Garage Sales</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              Discover garage sales happening in your neighborhood. Find great deals, right around the corner.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by neighborhood, city, or keyword..."
                className="w-full bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 max-w-2xl mx-auto">
            {/* View Toggle */}
            <div className="flex bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => setView('list')}
                className={`px-4 py-2 text-xs font-semibold transition-all ${view === 'list' ? 'bg-emerald-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                📋 List
              </button>
              <button
                onClick={() => setView('map')}
                className={`px-4 py-2 text-xs font-semibold transition-all ${view === 'map' ? 'bg-emerald-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                🗺️ Map
              </button>
            </div>

            {/* Sort + Filter */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500/60 cursor-pointer shadow-sm"
              >
                {SORT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all shadow-sm ${showFilters ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400'}`}
              >
                ⚙️ Filters
              </button>
            </div>
          </div>

          {/* Category & Time Filters */}
          {showFilters && (
            <div className="max-w-2xl mx-auto mt-4 p-4 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-2xl shadow-sm animate-fade-in-up space-y-5">
              
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">When</div>
                <div className="flex flex-wrap gap-2">
                  {TIME_FILTERS.map(tf => (
                    <button
                      key={tf}
                      onClick={() => setTimeFilter(tf)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${timeFilter === tf ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08]'}`}
                    >
                      {tf === 'Active Now' ? '🟢 ' : ''}{tf}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Categories</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedCategory === 'All' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08]'}`}
                >
                  All
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedCategory === cat ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08]'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 animate-pulse">
                <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-200 dark:bg-white/[0.04]" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-5 bg-slate-200 dark:bg-white/[0.04] rounded w-3/4" />
                  <div className="h-4 bg-slate-200 dark:bg-white/[0.04] rounded w-1/2" />
                  <div className="h-4 bg-slate-200 dark:bg-white/[0.04] rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : view === 'map' ? (
          <GarageSaleMap
            sales={sales}
            center={userLocation ? [userLocation.lat, userLocation.lng] : null}
            zoom={12}
            className="h-[calc(100vh-280px)] sm:h-[600px]"
          />
        ) : sales.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-3xl max-w-2xl mx-auto shadow-sm">
            <div className="w-24 h-24 mx-auto mb-6 bg-emerald-500/10 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-5xl">🔭</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-200 mb-3">No Garage Sales Found</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto leading-relaxed">
              {search || selectedCategory !== 'All' || timeFilter !== 'All Upcoming'
                ? "We couldn't find any garage sales matching your exact filters. Try broadening your search!"
                : "Looks like it's quiet in your neighborhood. Be the first to host a garage sale this weekend!"}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {(search || selectedCategory !== 'All' || timeFilter !== 'All Upcoming') && (
                <button
                  onClick={() => { setSearch(''); setSelectedCategory('All'); setTimeFilter('All Upcoming'); }}
                  className="px-6 py-3 bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-white/[0.1] active:scale-95 transition-all w-full sm:w-auto"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={() => user ? navigate('/create-garage-sale') : navigate('/login')}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 hover:opacity-90 active:scale-95 transition-all w-full sm:w-auto"
              >
                + Post a Sale
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {sales.map(sale => (
                <GarageSaleCard
                  key={sale.id}
                  sale={sale}
                  distance={getDistanceForSale(sale)}
                />
              ))}
            </div>
            {hasMore && view !== 'map' && (
              <div className="mt-10 text-center">
                <button
                  onClick={() => fetchSales(true)}
                  className="px-8 py-3 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 rounded-xl font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-white/[0.06] active:scale-95 transition-all"
                >
                  Load More Garage Sales
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
