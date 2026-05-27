import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
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
  const [loading, setLoading] = useState(true)
  const [editingUsername, setEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [usernameSuccess, setUsernameSuccess] = useState('')

  useEffect(() => {
    fetchListings()
    fetchBids()
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
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Profile Header */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-orange-500/20 border-2 border-orange-500/40 flex items-center justify-center text-2xl font-bold text-orange-500">
              {profile?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              {editingUsername ? (
                <div className="flex gap-2 items-center">
                  <input
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value.toLowerCase())}
                    placeholder={profile?.username}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition flex-1"
                  />
                  <button
                    onClick={handleUsernameUpdate}
                    className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingUsername(false)}
                    className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-xl font-bold">{profile?.username}</div>
                  <button
                    onClick={() => {
                      setNewUsername(profile?.username || '')
                      setEditingUsername(true)
                    }}
                    className="text-zinc-500 hover:text-orange-500 transition text-sm"
                  >
                    ✏️
                  </button>
                </div>
              )}
              <div className="text-sm text-zinc-500">{user?.email}</div>
            </div>
          </div>

          {usernameError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg px-3 py-2 mb-3">
              {usernameError}
            </div>
          )}

          {usernameSuccess && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-xs rounded-lg px-3 py-2 mb-3">
              {usernameSuccess}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-800">
            {[
              ['Total Listed', listings.length],
              ['Active', activeListings.length],
              ['Sold', soldListings.length],
            ].map(([label, value]) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold text-orange-500">{value}</div>
                <div className="text-xs text-zinc-500">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'listings', label: 'My Listings' },
            { id: 'bids', label: 'My Bids' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                tab === t.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >{t.label}</button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-12 text-zinc-500">Loading...</div>
        )}

        {/* My Listings Tab */}
        {!loading && tab === 'listings' && (
          <div className="flex flex-col gap-3">
            {listings.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📦</div>
                <div className="text-zinc-400 mb-4">No listings yet</div>
                <button
                  onClick={() => navigate('/create')}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition"
                >
                  + List your first item
                </button>
              </div>
            )}

            {listings.map(listing => (
              <div
                key={listing.id}
                onClick={() => navigate(`/listing/${listing.id}`)}
                className="flex gap-3 bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 rounded-2xl p-4 cursor-pointer transition"
              >
                <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {listing.photos?.[0] ? (
                    <img src={listing.photos[0]} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">📦</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate mb-1">{listing.title}</div>
                  <div className="text-sm text-zinc-500 mb-2">{listing.category}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500 font-bold text-sm">
                      ${listing.current_price || listing.starting_price}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      listing.status === 'sold'
                        ? 'bg-blue-500/20 text-blue-400'
                        : timeLeft(listing.ends_at) === 'Ended'
                        ? 'bg-zinc-500/20 text-zinc-400'
                        : 'bg-green-500/20 text-green-400'
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
              <div className="text-center py-12">
                <div className="text-4xl mb-3">⚡</div>
                <div className="text-zinc-400 mb-4">No bids placed yet</div>
                <button
                  onClick={() => navigate('/feed')}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition"
                >
                  Browse listings
                </button>
              </div>
            )}

            {bids.map(bid => (
              <div
                key={bid.id}
                onClick={() => navigate(`/listing/${bid.listing_id}`)}
                className="flex gap-3 bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 rounded-2xl p-4 cursor-pointer transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate mb-1">
                    {bid.listings?.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-zinc-500">Your bid:</span>
                    <span className="text-orange-500 font-bold text-sm">${bid.amount}</span>
                    <span className="text-sm text-zinc-500">·</span>
                    <span className="text-sm text-zinc-500">
                      Current: ${bid.listings?.current_price}
                    </span>
                  </div>
                  <div className="mt-1">
                    {bid.amount >= bid.listings?.current_price ? (
                      <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                        Winning
                      </span>
                    ) : (
                      <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                        Outbid
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full mt-8 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition text-sm"
        >
          Sign Out
        </button>

      </div>
    </div>
  )
}
