import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  const [review, setReview] = useState(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewHover, setReviewHover] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

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
      .channel('listing-' + id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'bids',
        filter: 'listing_id=eq.' + id
      }, payload => {
        setBids(prev => [payload.new, ...prev])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [id, fetchListing, fetchBids])

  // Fetch existing review for this listing
  useEffect(() => {
    if (!user || !listing) return
    if (listing.status === 'sold' && listing.buyer_id === user.id) {
      supabase
        .from('reviews')
        .select('*')
        .eq('listing_id', id)
        .eq('reviewer_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setReview(data)
        })
    }
  }, [user, listing, id])

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

    const previousHighestBidder = bids.length > 0 ? bids[0].bidder_id : null;

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

    if (previousHighestBidder && previousHighestBidder !== user.id) {
      await supabase.functions.invoke('send-outbid-notification', {
        body: {
          outbidUserId: previousHighestBidder,
          newBidAmount: amount,
          listingId: id,
          listingTitle: listing.title
        }
      }).catch(err => console.error('Failed to trigger outbid email:', err))
    }

    setListing(prev => ({ ...prev, current_price: amount }))
    setSuccess('Bid placed successfully!')
    setBidAmount('')
    setBidding(false)
  }

  const handleBuyNow = async () => {
    const confirmed = window.confirm('This will reserve the item for 24 hours while the seller confirms. Reserve for $' + listing.buy_now_price + '?')
    if (!confirmed) return
    setBidding(true)
    setError('')

    // Check if user already has 3 active reservations
    const { data: activeReservations } = await supabase
      .from('listings')
      .select('id')
      .eq('reserved_by', user.id)
      .eq('status', 'reserved')

    if (activeReservations && activeReservations.length >= 3) {
      setError('You have too many pending reservations (max 3). Complete or wait for one to expire before reserving another item.')
      setBidding(false)
      return
    }

    const { error } = await supabase
      .from('listings')
      .update({
        status: 'reserved',
        reserved_by: user.id,
        reserved_at: new Date().toISOString(),
        current_price: listing.buy_now_price
      })
      .eq('id', id)
      .eq('status', 'active')

    if (error) {
      setError(error.message)
      setBidding(false)
      return
    }

    // Trigger the notification edge function directly
    await supabase.functions.invoke('send-buynow-notification', {
      body: {
        record: {
          id: listing.id,
          seller_id: listing.seller_id,
          title: listing.title,
          buy_now_price: listing.buy_now_price,
          status: 'reserved'
        },
        old_record: {
          status: 'active'
        }
      }
    }).catch(err => console.error('Failed to trigger reserved email:', err))

    setListing(prev => ({ ...prev, status: 'reserved', reserved_by: user.id, reserved_at: new Date().toISOString() }))
    setSuccess('Item reserved! The seller has 24 hours to confirm the sale.')
    setBidding(false)
  }

  const handleConfirmSale = async () => {
    const confirmed = window.confirm('Confirm sale of this item for $' + listing.buy_now_price + '?')
    if (!confirmed) return
    setMarking(true)
    setError('')

    const { error } = await supabase
      .from('listings')
      .update({ status: 'sold', buyer_id: listing.reserved_by })
      .eq('id', id)

    if (error) {
      setError(error.message)
      setMarking(false)
      return
    }

    // Trigger the sold notification
    await supabase.functions.invoke('send-buynow-notification', {
      body: {
        record: {
          id: listing.id,
          seller_id: listing.seller_id,
          title: listing.title,
          buy_now_price: listing.buy_now_price,
          status: 'sold'
        },
        old_record: {
          status: 'reserved'
        }
      }
    }).catch(err => console.error('Failed to trigger sold email:', err))

    setListing(prev => ({ ...prev, status: 'sold' }))
    setSuccess('Sale confirmed! Arrange pickup with the buyer.')
    setMarking(false)
  }

  const handleRejectReservation = async () => {
    const confirmed = window.confirm('Reject this reservation and re-list the item?')
    if (!confirmed) return
    setMarking(true)
    setError('')

    const { error } = await supabase
      .from('listings')
      .update({
        status: 'active',
        reserved_by: null,
        reserved_at: null
      })
      .eq('id', id)

    if (error) {
      setError(error.message)
      setMarking(false)
      return
    }

    setListing(prev => ({ ...prev, status: 'active', reserved_by: null, reserved_at: null }))
    setSuccess('Reservation rejected. Item is back on the market.')
    setMarking(false)
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

    // Determine the buyer: highest bidder or reserved_by
    const buyerId = listing.reserved_by || (bids.length > 0 ? bids[0].bidder_id : null)

    const { error } = await supabase
      .from('listings')
      .update({ status: 'sold', buyer_id: buyerId })
      .eq('id', id)

    if (error) {
      setError(error.message)
      setMarking(false)
      return
    }

    setListing(prev => ({ ...prev, status: 'sold', buyer_id: buyerId }))
    setSuccess('Item marked as sold!')
    setMarking(false)
  }

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      setError('Please select a star rating')
      return
    }
    setSubmittingReview(true)
    setError('')

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        listing_id: id,
        seller_id: listing.seller_id,
        reviewer_id: user.id,
        rating: reviewRating,
        comment: reviewComment.trim()
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
      setSubmittingReview(false)
      return
    }

    setReview(data)
    setSuccess('Review submitted! Thank you.')
    setSubmittingReview(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] bg-grid-pattern text-slate-900 dark:text-slate-100 relative overflow-hidden">
      <Navbar />
      <div className="flex flex-col items-center justify-center py-32 text-slate-500 dark:text-slate-400 gap-3 relative z-10">
        <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
        <span className="text-sm font-medium tracking-wide">Loading neighborhood details...</span>
      </div>
    </div>
  )

  if (!listing) return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] bg-grid-pattern text-slate-900 dark:text-slate-100 relative overflow-hidden">
      <Navbar />
      <div className="flex flex-col items-center justify-center py-32 text-center relative z-10 max-w-md mx-auto px-6">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Listing not found</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">This listing may have been deleted by the seller or does not exist.</p>
        <button
          onClick={() => navigate('/feed')}
          className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-900 dark:text-white rounded-lg font-semibold transition shadow-md active:scale-95 cursor-pointer"
        >
          Back to Feed
        </button>
      </div>
    </div>
  )

  const isSeller = user.id === listing.seller_id
  const isFirefighter = user?.email === 'satish.dfw@gmail.com'
  const canManage = isSeller || isFirefighter
  const minBid = (listing.current_price || listing.starting_price) + 1
  const isEnded = timeLeft(listing.ends_at) === 'Ended'
  const isSold = listing.status === 'sold'
  const isReserved = listing.status === 'reserved'
  const isReservedByMe = isReserved && listing.reserved_by === user.id

  // Calculate reservation time remaining
  const reservationTimeLeft = () => {
    if (!listing.reserved_at) return ''
    const expiresAt = new Date(new Date(listing.reserved_at).getTime() + 24 * 60 * 60 * 1000)
    const diff = expiresAt - new Date()
    if (diff <= 0) return 'Expired'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `${h}h ${m}m`
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] bg-grid-pattern text-slate-900 dark:text-slate-100 relative overflow-hidden">
      {/* Floating Ambient Glow Orbs */}
      <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none animate-float-slow z-0" />
      <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none animate-float-slower z-0" />

      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-6 relative z-10">

        <button
          onClick={() => navigate('/feed')}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white text-sm mb-5 flex items-center gap-1 transition-all hover:-translate-x-1 cursor-pointer font-medium"
        >
          ← Back to Feed
        </button>

        <div className="card-gradient-border bg-white dark:bg-white/[0.015] backdrop-blur-md border border-slate-200 dark:border-white/[0.04] rounded-2xl overflow-hidden mb-6 shadow-2xl">
          <div className="h-56 sm:h-80 bg-white dark:bg-white/[0.02] flex items-center justify-center relative border-b border-slate-200 dark:border-white/[0.04]">
            {listing.photos && listing.photos.length > 0 ? (
              <img
                src={listing.photos[photo]}
                alt={listing.title}
                className="w-full h-full object-cover transition-transform duration-500"
              />
            ) : (
              <span className="text-7xl">📦</span>
            )}

            {isSold && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-[2px] z-10">
                <div className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-widest transform -rotate-12 border-4 border-white px-6 py-2 rounded-sm shadow-2xl">
                  SOLD
                </div>
              </div>
            )}

            {isReserved && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px] z-10">
                <div className="text-3xl font-extrabold text-amber-400 tracking-widest transform -rotate-12 border-4 border-amber-400 px-6 py-2 rounded-sm shadow-2xl">
                  RESERVED
                </div>
              </div>
            )}

            <div className="absolute top-3 right-3 z-20">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-md border ${
                isSold
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  : isReserved
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : listing.is_free
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  : isEnded
                  ? 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                  : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
              }`}>
                {isSold ? 'Sold' : isReserved ? `Reserved · ${reservationTimeLeft()}` : listing.is_free ? 'FREE' : timeLeft(listing.ends_at)}
              </span>
            </div>
          </div>

          {listing.photos && listing.photos.length > 1 && (
            <div className="flex gap-2.5 p-4 overflow-x-auto bg-white/[0.01]">
              {listing.photos.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  onClick={() => setPhoto(i)}
                  className={`w-16 h-16 object-cover rounded-xl cursor-pointer border-2 transition-all duration-200 hover:scale-105 ${
                    photo === i ? 'border-orange-500 shadow-md shadow-orange-500/20' : 'border-slate-200 dark:border-white/[0.08] hover:border-white/30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-2">{listing.category}</div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">{listing.title}</h1>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4 text-base">{listing.description}</p>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-white/[0.04] pt-4">
            <span className="font-semibold text-slate-900 dark:text-white/95">@{listing.profiles?.username || 'neighbor'}</span>
            <span>·</span>
            <span className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md text-xs font-semibold">{listing.meetup_type}</span>
          </div>
        </div>

        {/* Pricing Dashboard */}
        <div className="bg-white dark:bg-white/[0.015] border border-slate-200 dark:border-white/[0.04] rounded-2xl p-6 mb-6 backdrop-blur-md shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider mb-1">
                {listing.is_free ? 'Price' : bids.length > 0 ? 'Highest Bid' : 'Starting Price'}
              </div>
              <div className="text-3xl font-extrabold text-orange-400">
                {listing.is_free ? 'Free' : '$' + (listing.current_price || listing.starting_price)}
              </div>
            </div>
            {listing.buy_now_price && !isSold && (
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider mb-1">Buy It Now</div>
                <div className="text-2xl font-extrabold text-emerald-400">${listing.buy_now_price}</div>
              </div>
            )}
          </div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-white/[0.04] pt-3 font-medium">
            <span>{bids.length} bids placed</span>
            {!listing.is_free && <span>Started at ${listing.starting_price}</span>}
          </div>
        </div>

        {bids.length > 0 && (
          <div className="bg-white dark:bg-white/[0.015] border border-slate-200 dark:border-white/[0.04] rounded-2xl p-5 mb-6 backdrop-blur-md shadow-lg">
            <div className="text-sm font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Recent Bid History</div>
            <div className="flex flex-col gap-3">
              {bids.slice(0, 5).map((bid) => (
                <div key={bid.id} className="flex justify-between items-center py-2.5 border-b border-slate-200 dark:border-white/[0.04] last:border-0 text-sm">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">@{bid.profiles?.username || 'neighbor'}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-orange-400 font-extrabold">${bid.amount}</span>
                    <span className="text-slate-500 text-xs font-semibold">
                      {new Date(bid.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm rounded-xl px-4 py-3 mb-6">
            {success}
          </div>
        )}

        {/* Reserved State - Buyer View */}
        {isReserved && !canManage && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 text-center mb-6 backdrop-blur-md">
            <div className="text-4xl mb-3">⏳</div>
            <div className="text-lg font-bold mb-1 text-amber-400">
              {isReservedByMe ? 'You Reserved This Item' : 'Item Reserved'}
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              {isReservedByMe
                ? 'Waiting for the seller to confirm. The reservation expires in ' + reservationTimeLeft() + '.'
                : 'Another buyer has reserved this item. It may become available again if the reservation expires.'}
            </div>
          </div>
        )}

        {/* Auction Ended State */}
        {!isSeller && (isEnded || isSold) && !isReserved && (
          <div className="bg-white dark:bg-white/[0.015] border border-slate-200 dark:border-white/[0.04] rounded-2xl p-6 text-center mb-6 backdrop-blur-md">
            <div className="text-4xl mb-3 animate-pulse">🔨</div>
            <div className="text-lg font-bold mb-1 text-slate-900 dark:text-white">
              {isSold ? 'Item Sold' : 'Auction Ended'}
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              {isSold ? 'This listing is no longer active.' : 'Bidding timeframe has closed.'}
            </div>
            {bids.length > 0 && (
              <div className="text-sm text-slate-600 dark:text-slate-300 font-semibold bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl py-3 px-4 max-w-xs mx-auto">
                Final Sold Price: <span className="text-orange-400 font-extrabold ml-1">${listing.current_price}</span>
              </div>
            )}
          </div>
        )}

        {/* Buyer Actions */}
        {!isSeller && listing.status === 'active' && !isEnded && (
          <div className="flex flex-col gap-4">
            {!listing.is_free && (
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="number"
                  value={bidAmount}
                  onChange={e => setBidAmount(e.target.value)}
                  placeholder={'Min $' + minBid}
                  className="flex-1 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:bg-white dark:bg-white/[0.04] focus:ring-1 focus:ring-orange-500/20 transition-all duration-300 shadow-inner"
                />
                <button
                  onClick={handleBid}
                  disabled={bidding}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 disabled:opacity-50 text-slate-900 dark:text-white font-semibold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {bidding ? '...' : 'Place Bid'}
                </button>
              </div>
            )}

            {listing.buy_now_price && (
              <button
                onClick={handleBuyNow}
                disabled={bidding}
                className="w-full py-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer shadow-md"
              >
                {bidding ? 'Processing...' : '⚡ Buy Instantly - $' + listing.buy_now_price}
              </button>
            )}

            <button
              onClick={handleMessage}
              disabled={messaging}
              className="w-full py-3.5 bg-white dark:bg-white/[0.02] hover:bg-white/[0.05] border border-slate-200 dark:border-white/[0.06] text-slate-900 dark:text-white font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer"
            >
              {messaging ? 'Opening chat...' : '💬 Message Seller'}
            </button>
          </div>
        )}

        {/* Seller Actions */}
        {canManage && (
          <div className="flex flex-col gap-4">
            {isFirefighter && !isSeller && (
              <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold px-3 py-2 rounded-xl text-center flex items-center justify-center gap-2">
                <span>🛡️</span> Firefighter Access Override Active
              </div>
            )}

            {/* Reservation Pending - Seller Confirm/Reject */}
            {isReserved && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 mb-2">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">⏳</span>
                  <div>
                    <div className="text-amber-400 font-bold text-sm">Reservation Pending</div>
                    <div className="text-slate-500 dark:text-slate-400 text-xs">A buyer wants to purchase this item · Expires in {reservationTimeLeft()}</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleConfirmSale}
                    disabled={marking}
                    className="flex-1 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  >
                    {marking ? 'Confirming...' : '✅ Confirm Sale'}
                  </button>
                  <button
                    onClick={handleRejectReservation}
                    disabled={marking}
                    className="flex-1 py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  >
                    {marking ? 'Rejecting...' : '❌ Reject & Re-list'}
                  </button>
                </div>
              </div>
            )}

            {listing.status === 'active' && (
              <button
                onClick={handleMarkSold}
                disabled={marking}
                className="w-full py-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-md"
              >
                {marking ? 'Marking...' : 'Mark as Sold'}
              </button>
            )}
            <button
              onClick={() => navigate('/edit/' + id)}
              className="w-full py-3.5 bg-white dark:bg-white/[0.02] hover:bg-white/[0.05] border border-slate-200 dark:border-white/[0.06] text-slate-900 dark:text-white font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer"
            >
              Edit Listing
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full py-3.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Listing'}
            </button>
          </div>
        )}

        {/* Buyer Review Section */}
        {listing.status === 'sold' && listing.buyer_id === user?.id && (
          <div className="mt-6">
            {review ? (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">✅</span>
                  <span className="text-emerald-400 font-bold text-sm">Your Review</span>
                </div>
                <div className="flex gap-1 mb-2">
                  {[1,2,3,4,5].map(star => (
                    <span key={star} className={`text-xl ${star <= review.rating ? 'text-amber-400' : 'text-slate-600'}`}>★</span>
                  ))}
                </div>
                {review.comment && (
                  <p className="text-sm text-slate-600 dark:text-slate-300">{review.comment}</p>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">⭐</span>
                  <span className="text-slate-900 dark:text-white font-bold text-sm">Rate this Seller</span>
                </div>
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(star => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHover(star)}
                      onMouseLeave={() => setReviewHover(0)}
                      className="text-3xl cursor-pointer transition-transform hover:scale-125 active:scale-95"
                    >
                      <span className={(reviewHover || reviewRating) >= star ? 'text-amber-400' : 'text-slate-600 dark:text-slate-500'}>
                        ★
                      </span>
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience with this seller (optional)..."
                  maxLength={300}
                  rows={3}
                  className="w-full bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none mb-3"
                />
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview || reviewRating === 0}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 text-white font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-lg shadow-orange-500/25"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
