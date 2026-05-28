import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
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

export default function Profile() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('listings')
  const [listings, setListings] = useState([])
  const [bids, setBids] = useState([])
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingUsername, setEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [usernameSuccess, setUsernameSuccess] = useState('')

  useEffect(() => {
    fetchListings()
    fetchBids()
    fetchFavorites()
  }, [])

  const fetchListings = async () => {
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
    setListings(data || [])
    setLoading(false)
  }

  const fetchBids = async () => {
    const { data } = await supabase
      .from('bids')
      .select('*, listings(title, current_price, status, ends_at)')
      .eq('bidder_id', user.id)
      .order('created_at', { ascending: false })
    setBids(data || [])
  }

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*, listings(id, title, photos, category, current_price, starting_price, status, ends_at, seller_id, profiles(username))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching favorites:', error)
        return
      }
      
      setFavorites(data || [])
    } catch (err) {
      console.error('Favorites fetch error:', err)
    }
  }

  const handleUsernameUpdate = async () => {
    setUsernameError('')
    setUsernameSuccess('')

    if (newUsername.length < 3) {
      setUsernameError('At least 3 characters required')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      setUsernameError('Letters, numbers and underscores only')
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({ username: newUsername })
      .eq('id', user.id)

    if (error) {
      if (error.code === '23505') {
        setUsernameError('Username already taken')
      } else {
        setUsernameError(error.message)
      }
      return
    }

    setUsernameSuccess('Username updated!')
    setEditingUsername(false)
    setTimeout(() => setUsernameSuccess(''), 3000)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const activeListings = listings.filter(l => l.status === 'active')
  const soldListings = listings.filter(l => l.status === 'sold')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] bg-grid-pattern text-slate-900 dark:text-slate-100 relative overflow-hidden">
      {/* Floating Ambient Glow Orbs */}
      <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none animate-float-slow z-0" />
      <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none animate-float-slower z-0" />

      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8 relative z-10">

        {/* Profile Header */}
        <div className="card-gradient-border bg-white dark:bg-white/[0.015] border border-slate-200 dark:border-white/[0.04] rounded-2xl p-6 mb-6 shadow-2xl">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-500 to-indigo-500 flex items-center justify-center text-2xl font-bold text-slate-900 dark:text-white shadow-lg shadow-orange-500/20">
              {profile?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-grow min-w-0">
              {editingUsername ? (
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <input
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value.toLowerCase())}
                    placeholder={profile?.username}
                    className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-orange-500/60 focus:bg-white dark:bg-white/[0.04] focus:ring-1 focus:ring-orange-500/20 transition-all duration-300 flex-1 shadow-inner"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUsernameUpdate}
                      className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-900 dark:text-white text-xs font-bold rounded-lg transition active:scale-95 cursor-pointer shadow shadow-orange-500/10"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingUsername(false)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg transition hover:bg-white/[0.05] active:scale-95 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-xl font-extrabold text-slate-900 dark:text-white">{profile?.username}</div>
                  <button
                    onClick={() => {
                      setNewUsername(profile?.username || '')
                      setEditingUsername(true)
                    }}
                    className="text-slate-500 hover:text-orange-400 transition-colors text-sm cursor-pointer"
                  >
                    ✏️
                  </button>
                </div>
              )}
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold truncate">{user?.email}</div>
            </div>
          </div>

          {usernameError && (
            <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs rounded-xl px-3 py-2 mb-3">
              {usernameError}
            </div>
          )}

          {usernameSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs rounded-xl px-3 py-2 mb-3">
              {usernameSuccess}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-5 border-t border-slate-200 dark:border-white/[0.04]">
            {[
              ['Total Listed', listings.length],
              ['Active Items', activeListings.length],
              ['Sold Items', soldListings.length],
            ].map(([label, value]) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-extrabold text-orange-400">{value}</div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/[0.05]">
          {[
            { id: 'listings', label: 'My Listings' },
            { id: 'bids', label: 'My Bids' },
            { id: 'favorites', label: 'Favorites' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                tab === t.id
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-900 dark:text-white shadow-md shadow-orange-500/10'
                  : 'bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-white/[0.05]'
              }`}
            >{t.label}</button>
          ))}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400 gap-3">
            <div className="w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
            <span className="text-xs font-semibold tracking-wide">Loading statistics...</span>
          </div>
        )}

        {/* My Listings Tab */}
        {!loading && tab === 'listings' && (
          <div className="flex flex-col gap-3">
            {listings.length === 0 && (
              <div className="text-center py-16 bg-white/[0.01] border border-slate-200 dark:border-white/[0.04] rounded-2xl p-6">
                <div className="text-4xl mb-3">📦</div>
                <div className="text-slate-500 dark:text-slate-400 text-sm mb-4">No active listings yet</div>
                <button
                  onClick={() => navigate('/create')}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-900 dark:text-white rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer shadow-md shadow-orange-500/25"
                >
                  + List your first item
                </button>
              </div>
            )}

            {listings.map(listing => (
              <div
                key={listing.id}
                onClick={() => navigate(`/listing/${listing.id}`)}
                className="card-gradient-border bg-white dark:bg-white/[0.015] border border-slate-200 dark:border-white/[0.04] hover:border-orange-500/40 rounded-2xl p-4 cursor-pointer hover:-translate-y-0.5 hover:bg-white dark:bg-white/[0.03] transition-all duration-300 flex gap-4 items-center"
              >
                <div className="w-16 h-16 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                  {listing.photos?.[0] ? (
                    <img src={listing.photos[0]} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">📦</span>
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="font-bold text-slate-900 dark:text-white truncate text-base mb-0.5">{listing.title}</div>
                  <div className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider mb-2">{listing.category}</div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-orange-400 font-extrabold text-sm">
                      ${listing.current_price || listing.starting_price}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      listing.status === 'sold'
                        ? 'bg-zinc-500/10 border border-zinc-500/30 text-zinc-400'
                        : timeLeft(listing.ends_at) === 'Ended'
                        ? 'bg-rose-500/10 border border-rose-500/25 text-rose-400'
                        : 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
                    }`}>
                      {listing.status === 'sold' ? 'Sold' : timeLeft(listing.ends_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* My Bids Tab */}
        {!loading && tab === 'bids' && (
          <div className="flex flex-col gap-3">
            {bids.length === 0 && (
              <div className="text-center py-16 bg-white/[0.01] border border-slate-200 dark:border-white/[0.04] rounded-2xl p-6">
                <div className="text-4xl mb-3">⚡</div>
                <div className="text-slate-500 dark:text-slate-400 text-sm mb-4">No bids placed yet</div>
                <button
                  onClick={() => navigate('/feed')}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-900 dark:text-white rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer shadow-md shadow-orange-500/25"
                >
                  Browse Listings
                </button>
              </div>
            )}

            {bids.map(bid => (
              <div
                key={bid.id}
                onClick={() => navigate(`/listing/${bid.listing_id}`)}
                className="card-gradient-border bg-white dark:bg-white/[0.015] border border-slate-200 dark:border-white/[0.04] hover:border-orange-500/40 rounded-2xl p-4 cursor-pointer hover:-translate-y-0.5 hover:bg-white dark:bg-white/[0.03] transition-all duration-300 flex items-center"
              >
                <div className="flex-grow min-w-0">
                  <div className="font-bold text-slate-900 dark:text-white truncate text-base mb-1.5">
                    {bid.listings?.title}
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    <span>Your bid:</span>
                    <span className="text-orange-400 font-extrabold">${bid.amount}</span>
                    <span className="text-slate-500">·</span>
                    <span>Current: ${bid.listings?.current_price}</span>
                  </div>
                  <div className="mt-2.5">
                    {bid.amount >= bid.listings?.current_price ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                        Winning
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 rounded-full">
                        Outbid
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Favorites Tab */}
        {!loading && tab === 'favorites' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.length === 0 && (
              <div className="col-span-full text-center py-16 bg-white/[0.01] border border-slate-200 dark:border-white/[0.04] rounded-2xl p-6">
                <div className="text-4xl mb-3">❤️</div>
                <div className="text-slate-500 dark:text-slate-400 text-sm mb-4">No favorites saved yet</div>
                <button
                  onClick={() => navigate('/feed')}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-900 dark:text-white rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer shadow-md shadow-orange-500/25"
                >
                  Browse Listings
                </button>
              </div>
            )}

            {favorites.map(fav => (
              <div
                key={fav.id}
                onClick={() => navigate(`/listing/${fav.listing_id}`)}
                className="card-gradient-border bg-white dark:bg-white/[0.015] border border-slate-200 dark:border-white/[0.04] rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col h-full group"
              >
                <div className="h-48 bg-white dark:bg-white/[0.02] flex items-center justify-center relative overflow-hidden border-b border-slate-200 dark:border-white/[0.04]">
                  {fav.listings?.photos && fav.listings.photos[0] ? (
                    <img
                      src={fav.listings.photos[0]}
                      alt={fav.listings.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-5xl transition-transform duration-500 group-hover:scale-110">📦</span>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-grow justify-between">
                  <div>
                    <div className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider mb-1.5">{fav.listings?.category}</div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2 truncate group-hover:text-orange-400 transition-colors duration-200">{fav.listings?.title}</h3>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/[0.04] pt-3">
                    <div>
                      <span className="text-orange-400 font-extrabold text-base">
                        ${fav.listings?.current_price || fav.listings?.starting_price}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold">
                      @{fav.listings?.profiles?.username || 'neighbor'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full mt-8 py-3.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 font-bold rounded-xl active:scale-[0.98] cursor-pointer transition-all text-sm shadow-sm hover:shadow-rose-500/5"
        >
          Sign Out
        </button>

      </div>
    </div>
  )
}
