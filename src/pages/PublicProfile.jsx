import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'

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

export default function PublicProfile() {
  const { username } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [listings, setListings] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('listings')

  useEffect(() => {
    fetchUserData()
  }, [username])

  const fetchUserData = async () => {
    setLoading(true)
    setError('')
    
    // 1. Fetch Profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', username)
      .single()

    if (profileError || !profileData) {
      setError('User not found')
      setLoading(false)
      return
    }

    setProfile(profileData)

    // 2. Fetch Listings
    const { data: listingsData } = await supabase
      .from('listings')
      .select('*')
      .eq('seller_id', profileData.id)
      .order('created_at', { ascending: false })

    setListings(listingsData || [])

    // 3. Fetch Reviews
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('*, profiles!reviews_reviewer_id_fkey(username)')
      .eq('seller_id', profileData.id)
      .order('created_at', { ascending: false })

    setReviews(reviewsData || [])
    setLoading(false)
  }

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const soldCount = listings.filter(l => l.status === 'sold').length

  const badges = []
  if (averageRating >= 4.8 && reviews.length >= 3) {
    badges.push({ icon: '🏅', label: 'Trusted Neighbor', color: 'from-amber-400 to-orange-500' })
  }
  if (soldCount >= 5) {
    badges.push({ icon: '🔥', label: 'Top Seller', color: 'from-rose-400 to-red-500' })
  }
  if (profile && (new Date() - new Date(profile.created_at)) / (1000 * 60 * 60 * 24) <= 30) {
    badges.push({ icon: '👋', label: 'New Neighbor', color: 'from-indigo-400 to-purple-500' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] bg-grid-pattern text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] bg-grid-pattern text-slate-900 dark:text-slate-100">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-32 text-center">
          <div className="text-6xl mb-4 animate-bounce">🔍</div>
          <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
          <p className="text-slate-500 mb-6">The profile you are looking for doesn't exist or was removed.</p>
          <button onClick={() => navigate('/feed')} className="px-6 py-2 bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] rounded-lg font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors">
            Back to Feed
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] bg-grid-pattern text-slate-900 dark:text-slate-100 relative overflow-hidden">
      <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none animate-float-slow z-0" />
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        {/* Cover & Profile Header */}
        <div className="card-gradient-border bg-white dark:bg-white/[0.015] border border-slate-200 dark:border-white/[0.04] rounded-3xl overflow-hidden mb-6 shadow-2xl">
          <div className="h-32 sm:h-48 bg-gradient-to-r from-orange-500/20 via-rose-500/20 to-indigo-500/20 relative">
            <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-sm"></div>
            {/* Avatar positioning */}
            <div className="absolute -bottom-12 sm:-bottom-16 left-6 sm:left-10 w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-[#07090e] bg-gradient-to-tr from-orange-500 to-indigo-500 flex items-center justify-center text-4xl sm:text-5xl font-extrabold text-white shadow-xl z-20">
              {profile.username[0].toUpperCase()}
            </div>
          </div>
          
          <div className="pt-14 sm:pt-20 px-6 sm:px-10 pb-8 relative">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-1">
                  @{profile.username}
                </h1>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-semibold mb-4">
                  Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </div>
                
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {badges.map((b, i) => (
                    <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg bg-gradient-to-r ${b.color} hover:scale-105 transition-transform cursor-default`}>
                      <span className="text-sm">{b.icon}</span> {b.label}
                    </div>
                  ))}
                  {badges.length === 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08]">
                      <span>🌱</span> Growing Reputation
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats Box */}
              <div className="flex gap-6 bg-slate-50 dark:bg-[#07090e] border border-slate-200 dark:border-white/[0.04] rounded-2xl p-4 shadow-inner mt-2 sm:mt-0">
                <div className="text-center">
                  <div className="text-2xl font-extrabold text-orange-400">{averageRating || '-'}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Rating</div>
                </div>
                <div className="w-px bg-slate-200 dark:bg-white/[0.08]"></div>
                <div className="text-center">
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{soldCount}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Sold</div>
                </div>
                <div className="w-px bg-slate-200 dark:bg-white/[0.08]"></div>
                <div className="text-center">
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{listings.length}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Listed</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-white/[0.08]">
          <button
            onClick={() => setTab('listings')}
            className={`px-6 py-3 font-bold transition-colors relative ${
              tab === 'listings' ? 'text-orange-500' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Listings
            {tab === 'listings' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 shadow-[0_-2px_10px_rgba(249,115,22,0.5)]"></div>}
          </button>
          <button
            onClick={() => setTab('reviews')}
            className={`px-6 py-3 font-bold transition-colors relative ${
              tab === 'reviews' ? 'text-orange-500' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Reviews ({reviews.length})
            {tab === 'reviews' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 shadow-[0_-2px_10px_rgba(249,115,22,0.5)]"></div>}
          </button>
        </div>

        {/* Tab Content */}
        {tab === 'listings' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.length === 0 && (
              <div className="col-span-full text-center py-16 bg-white/[0.01] border border-slate-200 dark:border-white/[0.04] rounded-2xl p-6">
                <div className="text-4xl mb-3">📦</div>
                <div className="text-slate-500 dark:text-slate-400 text-sm">No listings available</div>
              </div>
            )}
            {listings.map(listing => (
              <div
                key={listing.id}
                onClick={() => navigate(`/listing/${listing.id}`)}
                className="card-gradient-border bg-white dark:bg-white/[0.015] backdrop-blur-md border border-slate-200 dark:border-white/[0.04] rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col group"
              >
                <div className="h-40 bg-white dark:bg-white/[0.02] flex items-center justify-center relative overflow-hidden border-b border-slate-200 dark:border-white/[0.04]">
                  {listing.photos && listing.photos[0] ? (
                    <img src={listing.photos[0]} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <span className="text-4xl">📦</span>
                  )}
                  {listing.status === 'sold' && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10 backdrop-blur-[2px]">
                      <div className="text-xl font-extrabold text-white transform -rotate-12 border-2 border-white px-3 py-1">SOLD</div>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-grow justify-between">
                  <div>
                    <div className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider mb-1">{listing.category}</div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 truncate group-hover:text-orange-400 transition-colors">{listing.title}</h3>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/[0.04] pt-3">
                    <span className="text-orange-400 font-extrabold">${listing.current_price || listing.starting_price}</span>
                    <span className="text-xs text-slate-500 font-semibold">{timeLeft(listing.ends_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'reviews' && (
          <div className="flex flex-col gap-4">
            {reviews.length === 0 && (
              <div className="text-center py-16 bg-white/[0.01] border border-slate-200 dark:border-white/[0.04] rounded-2xl p-6">
                <div className="text-4xl mb-3">⭐</div>
                <div className="text-slate-500 dark:text-slate-400 text-sm">No reviews yet</div>
              </div>
            )}
            {reviews.map(rev => (
              <div key={rev.id} className="card-gradient-border bg-white dark:bg-white/[0.015] border border-slate-200 dark:border-white/[0.04] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-white">
                      {rev.profiles?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white cursor-pointer hover:underline" onClick={() => navigate(`/user/${rev.profiles?.username}`)}>
                        @{rev.profiles?.username || 'neighbor'}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{new Date(rev.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(star => (
                      <span key={star} className={`text-base ${star <= rev.rating ? 'text-amber-400 drop-shadow-sm' : 'text-slate-300 dark:text-slate-700'}`}>★</span>
                    ))}
                  </div>
                </div>
                {rev.comment && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 ml-14 leading-relaxed">{rev.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
