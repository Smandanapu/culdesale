import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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

export default function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [listing, setListing] = useState(null)
  const [bids, setBids] = useState([])
  const [bidAmount, setBidAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [bidding, setBidding] = useState(false)
  const [messaging, setMessaging] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [marking, setMarking] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [photo, setPhoto] = useState(0)

  const fetchListing = useCallback(async () => {
    const { data } = await supabase
      .from('listings')
      .select('*, profiles(username)')
      .eq('id', id)
      .single()
    setListing(data)
    setLoading(false)
  }, [id])

  const fetchBids = useCallback(async () => {
    const { data } = await supabase
      .from('bids')
      .select('*, profiles(username)')
      .eq('listing_id', id)
      .order('amount', { ascending: false })
    setBids(data || [])
  }, [id])

  useEffect(() => {
    fetchListing()
    fetchBids()

    const channel = supabase
      .channel(`listing-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'bids',
        filter: `listing_id=eq.${id}`
      }, payload => {
        setBids(prev => [payload.new, ...prev])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [id, fetchListing, fetchBids])

  const handleBid = async () => {
    setError('')
    setSuccess('')
    const amount = parseFloat(bidAmount)
    const minBid = (listing.current_price || listing.starting_price) + 1

    if (!amount || amount < minBid) {
      setError('Minimum bid is $' + minBid)
      return
    }

    setBidding(true)

    const { error } = await supabase.from('bids').insert({
      listing_id: id,
      bidder_id: user.id,
      amount,
    })

    if (error) {
      setError(error.message)
      setBidding(false)
      return
    }

    await supabase
      .from('listings')
      .update({ current_price: amount })
      .eq('id', id)

    setListing(prev => ({ ...prev, current_price: amount }))
    setSuccess('Bid placed successfully!')
    setBidAmount('')
    setBidding(false)
  }

  const handleBuyNow = async () => {
    const confirmed = window.confirm('Buy this item now for $' + listing.buy_now_price + '?')
    if (!confirmed) return
    setBidding(true)
    await supabase
      .from('listings')
      .update({ status: 'sold', current_price: listing.buy_now_price })
      .eq('id', id)
    setSuccess('Purchased! Arrange pickup with the seller.')
    setBidding(false)
  }

  const handleMessage = async () => {
    setMessaging(true)

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', id)
      .eq('buyer_id', user.id)
      .single()

    if (existing) {
      navigate('/inbox/' + existing.id)
      return
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        listing_id: id,
        seller_id: listing.seller_id,
        buyer_id: user.id,
      })
      .select()
      .single()

    if (error) {
      setMessaging(false)
      return
    }

    navigate('/inbox/' + data.id)
  }

  const handleDelete = async () => {
    const confirmed = window.confirm('Are you sure you want to delete this listing?')
    if (!confirmed) return
    setDeleting(true)
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id)
    if (error) {
      setError(error.message)
      setDeleting(false)
      return
    }
    navigate('/feed')
  }

  const handleMarkSold = async () => {
    const confirmed = window.confirm('Mark this item as sold?')
    if (!confirmed) return
    setMarking(true)
    setError('')
    setSuccess('')

    const { error } = await supabase
      .from('listings')
      .update({ status: 'sold' })
      .eq('id', id)

    if (error) {
      setError(error.message)
      setMarking(false)
      return
    }

    setListing(prev => ({ ...prev, status: 'sold' }))
    setSuccess('Item marked as sold!')
    setMarking(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />
      <div className="flex items-center justify-center py-24 text-zinc-500">Loading...</div>
    </div>
  )

  if (!listing) return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />
      <div className="flex items-center justify-center py-24 text-zinc-500">Listing not found</div>
    </div>
  )

  const isSeller = user.id === listing.seller_id
  const minBid = (listing.current_price || listing.starting_price) + 1
  const isEnded = timeLeft(listing.ends_at) === 'Ended'
  const isSold = listing.status === 'sold'

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-6">

        <button
          onClick={() => navigate('/feed')}
          className="text-zinc-400 hover:text-white text-sm mb-4 flex items-center gap-1 transition"
        >
          Back to Feed
        </button>

        <div className="bg-zinc-900 rounded-2xl overflow-hidden mb-4">
          <div className="h-72 flex items-center justify-center relative">
            {listing.photos && listing.photos.length > 0 ? (
              <img
                src={listing.photos[photo]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-6xl">📦</span>
            )}
            
            {/* SOLD Overlay */}
            {isSold && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-6xl font-bold text-white transform -rotate-45 border-4 border-white px-8 py-4">
                  SOLD
                </div>
              </div>
            )}
            
            <div className="absolute top-3 right-3">
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                isSold
                  ? 'bg-blue-500/20 text-blue-400'
                  : listing.is_free
                  ? 'bg-blue-500/20 text-blue-400'
                  : isEnded
                  ? 'bg-zinc-500/20 text-zinc-400'
                  : 'bg-green-500/20 text-green-400'
              }`}>
                {isSold ? 'Sold' : listing.is_free ? 'FREE' : timeLeft(listing.ends_at)}
              </span>
            </div>
          </div>

          {listing.photos && listing.photos.length > 1 && (
            <div className="flex gap-2 p-3">
              {listing.photos.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  onClick={() => setPhoto(i)}
                  className={`w-16 h-16 object-cover rounded-lg cursor-pointer border-2 transition ${
                    photo === i ? 'border-orange-500' : 'border-transparent'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="text-xs text-zinc-500 mb-1">{listing.category}</div>
          <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>
          <p className="text-zinc-400 leading-relaxed mb-3">{listing.description}</p>
          <div className="text-sm text-zinc-500">
            Listed by <span className="text-zinc-300">{listing.profiles && listing.profiles.username}</span> · {listing.meetup_type}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <div className="text-xs text-zinc-500 mb-1">Current Bid</div>
              <div className="text-3xl font-extrabold text-orange-500">
                {listing.is_free ? 'Free' : '$' + (listing.current_price || listing.starting_price)}
              </div>
            </div>
            {listing.buy_now_price && (
              <div className="text-right">
                <div className="text-xs text-zinc-500 mb-1">Buy It Now</div>
                <div className="text-2xl font-bold text-green-400">${listing.buy_now_price}</div>
              </div>
            )}
          </div>
          <div className="flex justify-between text-sm text-zinc-500">
            <span>{bids.length} bids</span>
            <span>Started at ${listing.starting_price}</span>
          </div>
        </div>

        {bids.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
            <div className="text-sm font-semibold mb-3">Recent Bids</div>
            {bids.slice(0, 5).map((bid) => (
              <div key={bid.id} className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-0 text-sm">
                <span className="text-zinc-400">{bid.profiles && bid.profiles.username}</span>
                <span className="text-orange-500 font-semibold">${bid.amount}</span>
                <span className="text-zinc-600 text-xs">
                  {new Date(bid.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3 mb-4">
            {success}
          </div>
        )}

        {/* Auction Ended State */}
        {!isSeller && (isEnded || isSold) && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center mb-4">
            <div className="text-3xl mb-2">🔨</div>
            <div className="text-lg font-bold mb-1">
              {isSold ? 'Item Sold' : 'Auction Ended'}
            </div>
            <div className="text-zinc-400 text-sm">
              {isSold ? 'This item has been sold' : 'This auction has ended'}
            </div>
            {bids.length > 0 && (
              <div className="mt-3 text-sm text-zinc-500">
                Final price: <span className="text-orange-500 font-bold">${listing.current_price}</span>
              </div>
            )}
          </div>
        )}

        {/* Buyer Actions */}
        {!isSeller && listing.status === 'active' && !isEnded && (
          <div className="flex flex-col gap-3">
            {!listing.is_free && (
              <div className="flex gap-3">
                <input
                  type="number"
                  value={bidAmount}
                  onChange={e => setBidAmount(e.target.value)}
                  placeholder={'Min $' + minBid}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition"
                />
                <button
                  onClick={handleBid}
                  disabled={bidding}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-xl transition"
                >
                  {bidding ? '...' : 'Bid'}
                </button>
              </div>
            )}

            {listing.buy_now_price && (
              <button
                onClick={handleBuyNow}
                disabled={bidding}
                className="w-full py-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 font-semibold rounded-xl transition"
              >
                Buy It Now - ${listing.buy_now_price}
              </button>
            )}

            <button
              onClick={handleMessage}
              disabled={messaging}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition"
            >
              {messaging ? 'Opening chat...' : '💬 Message Seller'}
            </button>
          </div>
        )}

        {/* Seller Actions */}
        {isSeller && (
          <div className="flex flex-col gap-3">
            {listing.status === 'active' && (
              <button
                onClick={handleMarkSold}
                disabled={marking}
                className="w-full py-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 font-semibold rounded-xl transition disabled:opacity-50"
              >
                {marking ? 'Marking...' : '✓ Mark as Sold'}
              </button>
            )}
            <button
              onClick={() => navigate('/edit/' + id)}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition"
            >
              Edit Listing
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold rounded-xl transition disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Listing'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
