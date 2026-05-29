import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import GarageSaleNavbar from '../components/GarageSaleNavbar'
import GarageSaleMap from '../components/GarageSaleMap'
import { getSaleStatus, formatTime, formatDateRange } from '../components/GarageSaleCard'
import { downloadICS } from '../lib/calendar'
import toast from 'react-hot-toast'
import { useRoute } from '../context/RouteContext'

const CATEGORY_COLORS = {
  'Furniture': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'Electronics': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  'Sports': 'bg-green-500/10 text-green-600 dark:text-green-400',
  'Kids': 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  'Tools': 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  'Appliances': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  'Clothing': 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  'Books': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  'Other': 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
}

export default function GarageSaleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [sale, setSale] = useState(null)
  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showShare, setShowShare] = useState(false)
  const { addSaleToRoute, removeSaleFromRoute, isInRoute } = useRoute()

  useEffect(() => {
    fetchSale()
  }, [id])

  const fetchSale = async () => {
    setLoading(true)

    // Increment view count
    await supabase.rpc('increment_garage_sale_view', { sale_id: id })

    const { data, error } = await supabase
      .from('garage_sales')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      navigate('/garage-sales')
      return
    }

    setSale(data)

    // Fetch seller profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', data.seller_id)
      .single()

    setSeller(profile)
    setLoading(false)
  }

  const handleGetDirections = () => {
    const address = encodeURIComponent(`${sale.address}, ${sale.city}, ${sale.state} ${sale.zip_code}`)
    // Detect iOS vs other for maps app
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const url = isIOS
      ? `maps://maps.apple.com/?daddr=${address}`
      : `https://www.google.com/maps/dir/?api=1&destination=${address}`
    window.open(url, '_blank')
  }

  const handleShare = async () => {
    // If testing locally, generate a clean production URL for the share link
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168') || window.location.hostname.startsWith('127.0')
    const shareUrl = isLocal ? `https://culdesale.com/garage-sales/${sale.id}` : window.location.href

    const shareData = {
      title: sale.title,
      text: `Check out this garage sale: ${sale.title} at ${sale.address}, ${sale.city}`,
      url: shareUrl,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch { }
    } else {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#07090e]">
        <GarageSaleNavbar />
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-slate-200 dark:bg-white/[0.04] rounded-2xl" />
            <div className="h-8 bg-slate-200 dark:bg-white/[0.04] rounded w-3/4" />
            <div className="h-4 bg-slate-200 dark:bg-white/[0.04] rounded w-1/2" />
            <div className="h-48 bg-slate-200 dark:bg-white/[0.04] rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!sale) return null

  const status = getSaleStatus(sale.start_date, sale.end_date, sale.start_time, sale.end_time)
  const isOwner = user && user.id === sale.seller_id
  const inRoute = isInRoute(sale.id)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] text-slate-900 dark:text-slate-100">
      <GarageSaleNavbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Back button */}
        <button
          onClick={() => navigate('/garage-sales')}
          className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition mb-6 cursor-pointer"
        >
          ← Back to Garage Sales
        </button>

        {/* Hero */}
        <div className="rounded-2xl overflow-hidden mb-6 h-40 sm:h-56 bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 dark:from-emerald-500/10 dark:via-teal-500/10 dark:to-cyan-500/10 flex items-center justify-center border border-slate-200 dark:border-white/[0.06]">
          <span className="text-7xl opacity-30">🏷️</span>
        </div>

        {/* Title + Status */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{sale.title}</h1>
          <div className={`${status.color} px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1.5 shrink-0`}>
            {status.icon} {status.label}
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300 mb-2">
          <span className="text-lg mt-0.5">📍</span>
          <div>
            <div className="font-bold text-slate-800 dark:text-slate-200">{sale.neighborhood}</div>
            <div className="font-medium mt-0.5">{sale.address}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{sale.city}, {sale.state} {sale.zip_code}</div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-slate-600 dark:text-slate-300 font-medium mb-6">
          <span>📅 {formatDateRange(sale.start_date, sale.end_date)}</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span>🕐 {formatTime(sale.start_time)} – {formatTime(sale.end_time)}</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="flex items-center gap-1.5 text-slate-500" title="Total Views">👁️ {sale.view_count || 0}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={handleGetDirections}
            className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 hover:opacity-90 active:scale-95 transition-all cursor-pointer text-sm"
          >
            📍 Get Directions
          </button>
          <button
            onClick={() => { downloadICS(sale); toast.success('Calendar file downloaded!'); }}
            className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:opacity-90 active:scale-95 transition-all cursor-pointer text-sm"
          >
            📅 Add to Calendar
          </button>
          <button
            onClick={() => inRoute ? removeSaleFromRoute(sale.id) : addSaleToRoute(sale)}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-semibold shadow-lg active:scale-95 transition-all cursor-pointer text-sm ${
              inRoute 
                ? 'bg-rose-500 text-white shadow-rose-500/25 hover:bg-rose-600'
                : 'bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-orange-500/25 hover:opacity-90'
            }`}
          >
            {inRoute ? '✕ Remove from Route' : '🗺️ Add to Route'}
          </button>
          <button
            onClick={handleShare}
            className="px-6 py-3 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06] active:scale-95 transition-all cursor-pointer text-sm shadow-sm"
          >
            📤 Share
          </button>
          {isOwner && (
            <button
              onClick={async () => {
                await supabase.from('garage_sales').update({ status: 'cancelled' }).eq('id', sale.id)
                navigate('/garage-sales')
              }}
              className="px-6 py-3 bg-rose-500/10 border border-rose-500/25 rounded-xl font-semibold text-rose-500 hover:bg-rose-500/20 active:scale-95 transition-all cursor-pointer text-sm"
            >
              Cancel Sale
            </button>
          )}
        </div>

        {/* Description */}
        {sale.description && (
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 sm:p-6 mb-6 shadow-sm">
            <h2 className="font-bold text-base mb-3">📝 About This Sale</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{sale.description}</p>
          </div>
        )}

        {/* Categories */}
        {sale.categories && sale.categories.length > 0 && (
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 sm:p-6 mb-6 shadow-sm">
            <h2 className="font-bold text-base mb-3">📦 Items Available</h2>
            <div className="flex flex-wrap gap-2">
              {sale.categories.map(cat => (
                <span
                  key={cat}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${CATEGORY_COLORS[cat] || CATEGORY_COLORS['Other']}`}
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Map */}
        {sale.latitude && sale.longitude && (
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 sm:p-6 mb-6 shadow-sm">
            <h2 className="font-bold text-base mb-3">🗺️ Location</h2>
            <GarageSaleMap
              sales={[sale]}
              center={[sale.latitude, sale.longitude]}
              zoom={15}
              className="h-48 sm:h-72"
            />
          </div>
        )}

        {/* Seller Info */}
        {seller && (
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 sm:p-6 shadow-sm">
            <h2 className="font-bold text-base mb-3">👤 Hosted by</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-500 font-bold text-sm">
                {seller.username ? seller.username[0].toUpperCase() : '?'}
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">{seller.username || 'CulDeSale User'}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Member since {new Date(sale.created_at).getFullYear()}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
