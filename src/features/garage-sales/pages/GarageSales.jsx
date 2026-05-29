import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import GarageSaleNavbar from '../components/GarageSaleNavbar'
import GarageSaleCard from '../components/GarageSaleCard'
import GarageSaleMap from '../components/GarageSaleMap'

const CATEGORIES = ['Furniture', 'Electronics', 'Sports', 'Kids', 'Tools', 'Appliances', 'Clothing', 'Books', 'Other']
const SORT_OPTIONS = ['Soonest', 'Newest', 'Nearest']

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
  const [userLocation, setUserLocation] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  // Get user location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // silently fail
      )
    }
  }, [])

  const fetchSales = useCallback(async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    let query = supabase
      .from('garage_sales')
      .select('*')
      .in('status', ['upcoming', 'active'])
      .gte('sale_date', today)
      .order('sale_date', { ascending: true })

    if (search.trim()) {
      query = query.or(`city.ilike.%${search}%,zip_code.ilike.%${search}%,title.ilike.%${search}%,address.ilike.%${search}%`)
    }

    if (selectedCategory !== 'All') {
      query = query.contains('categories', [selectedCategory])
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching garage sales:', error)
      setSales([])
    } else {
      let sorted = data || []

      if (sortBy === 'Newest') {
        sorted = sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      } else if (sortBy === 'Nearest' && userLocation) {
        sorted = sorted.sort((a, b) => {
          const distA = getDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude)
          const distB = getDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude)
          return (distA || Infinity) - (distB || Infinity)
        })
      }

      setSales(sorted)
    }
    setLoading(false)
  }, [search, selectedCategory, sortBy, userLocation])

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

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
                placeholder="Search by city, zip code, or keyword..."
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

          {/* Category Filter Pills */}
          {showFilters && (
            <div className="max-w-2xl mx-auto mt-4 p-4 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-2xl shadow-sm animate-fade-in-up">
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
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden animate-pulse">
                <div className="h-36 sm:h-44 bg-slate-200 dark:bg-white/[0.04]" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-200 dark:bg-white/[0.04] rounded w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-white/[0.04] rounded w-1/2" />
                  <div className="h-3 bg-slate-200 dark:bg-white/[0.04] rounded w-2/3" />
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
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-30">🏷️</div>
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No Garage Sales Found</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
              {search || selectedCategory !== 'All'
                ? 'Try adjusting your search or filters to find more results.'
                : 'Be the first to post a garage sale in your neighborhood!'}
            </p>
            <button
              onClick={() => user ? navigate('/create-garage-sale') : navigate('/login')}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              + Post a Garage Sale
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {sales.map(sale => (
              <GarageSaleCard
                key={sale.id}
                sale={sale}
                distance={getDistanceForSale(sale)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
