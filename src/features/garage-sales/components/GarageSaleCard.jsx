import { useNavigate } from 'react-router-dom'
import { useRoute } from '../context/RouteContext'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'
import toast from 'react-hot-toast'

const CATEGORY_STYLES = {
  'Furniture': { emoji: '🛋️', bg: 'bg-amber-100 dark:bg-amber-500/20', tag: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  'Electronics': { emoji: '💻', bg: 'bg-blue-100 dark:bg-blue-500/20', tag: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  'Sports': { emoji: '⚽', bg: 'bg-green-100 dark:bg-green-500/20', tag: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  'Kids': { emoji: '🧸', bg: 'bg-pink-100 dark:bg-pink-500/20', tag: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' },
  'Tools': { emoji: '🔨', bg: 'bg-slate-200 dark:bg-slate-500/20', tag: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' },
  'Appliances': { emoji: '🧊', bg: 'bg-purple-100 dark:bg-purple-500/20', tag: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  'Clothing': { emoji: '👕', bg: 'bg-rose-100 dark:bg-rose-500/20', tag: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
  'Books': { emoji: '📚', bg: 'bg-indigo-100 dark:bg-indigo-500/20', tag: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
  'Other': { emoji: '🏷️', bg: 'bg-gray-100 dark:bg-gray-500/20', tag: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' },
}

function getSaleStatus(startDate, endDate, startTime, endTime) {
  const now = new Date()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const startObj = new Date(startDate + 'T00:00:00')
  const endObj = new Date(endDate + 'T00:00:00')

  if (today < startObj) {
    const diffDays = Math.ceil((startObj - today) / (1000 * 60 * 60 * 24))
    if (diffDays === 1) return { label: 'Tomorrow', color: 'bg-blue-500/10 text-blue-500', icon: '📅' }
    return { label: `Starts in ${diffDays} days`, color: 'bg-blue-500/10 text-blue-500', icon: '📅' }
  }

  if (today >= startObj && today <= endObj) {
    const [startH, startM] = (startTime || '08:00').split(':').map(Number)
    const [endH, endM] = (endTime || '14:00').split(':').map(Number)
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    if (currentMinutes < startMinutes) {
      const diff = startMinutes - currentMinutes
      if (diff <= 60) return { label: `Starts in ${diff}m`, color: 'bg-amber-500/10 text-amber-500', icon: '⏰' }
      return { label: `Starts at ${formatTime(startTime)}`, color: 'bg-amber-500/10 text-amber-500', icon: '⏰' }
    }
    
    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
      return { label: 'Happening Now!', color: 'bg-emerald-500/10 text-emerald-500', icon: '🟢' }
    }
    
    // It's past the end time for today.
    if (today < endObj) {
       return { label: 'Resumes Tomorrow', color: 'bg-blue-500/10 text-blue-500', icon: '📅' }
    } else {
       return { label: 'Ended', color: 'bg-slate-500/10 text-slate-500', icon: '⏹️' }
    }
  }

  return { label: 'Past', color: 'bg-slate-500/10 text-slate-500', icon: '⏹️' }
}

function formatTime(time) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatDateRange(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return ''
  const start = new Date(startDateStr + 'T00:00:00')
  const end = new Date(endDateStr + 'T00:00:00')
  const options = { month: 'short', day: 'numeric' }
  
  if (startDateStr === endDateStr) {
    return start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }
  
  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`
}

export default function GarageSaleCard({ sale, distance, onSaleDeleted, isMegaSale }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addSaleToRoute, removeSaleFromRoute, isInRoute } = useRoute()
  const status = getSaleStatus(sale.start_date, sale.end_date, sale.start_time, sale.end_time)
  const mainCat = sale.categories?.[0] || 'Other'
  const style = CATEGORY_STYLES[mainCat] || CATEGORY_STYLES['Other']
  const inRoute = isInRoute(sale.id)
  const isOwner = user && user.id === sale.seller_id

  const handleRouteClick = (e) => {
    e.stopPropagation()
    if (inRoute) {
      removeSaleFromRoute(sale.id)
    } else {
      addSaleToRoute(sale)
    }
  }

  return (
    <div
      onClick={() => navigate(`/garage-sales/${sale.id}`)}
      className="group bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-3 sm:p-5 flex flex-row gap-3 sm:gap-5 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-white/[0.12] transition-all duration-300 cursor-pointer hover:-translate-y-1 relative"
    >
      {/* 3D Walkthrough Badge */}
      {sale.model_url && (
        <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-white/10 flex items-center gap-1 shadow-sm group-hover:scale-105 transition-transform">
          <span>3D</span>
        </div>
      )}

      {/* Mega Sale Badge */}
      {isMegaSale && (
        <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-lg shadow-orange-500/40 animate-pulse flex items-center gap-1">
          🔥 MEGA-SALE
        </div>
      )}

      {/* Dynamic Icon */}
      <div className={`shrink-0 w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl ${style.bg} flex items-center justify-center border border-white/50 dark:border-white/5`}>
        <span className="text-2xl sm:text-4xl group-hover:scale-110 transition-transform duration-300">{style.emoji}</span>
      </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center relative">
          
          {/* Owner Actions (Top Right) */}
          {isOwner && (
            <div className="absolute -top-1 -right-1 flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/edit-garage-sale/${sale.id}`)
                }}
                className="w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-500/20 flex items-center justify-center transition-colors shadow-sm border border-amber-200/50 dark:border-amber-500/20"
                title="Edit Sale"
              >
                ✏️
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation()
                  if (window.confirm('Are you sure you want to delete this garage sale?')) {
                    await supabase.from('garage_sales').delete().eq('id', sale.id)
                    toast.success('Sale deleted')
                    if (onSaleDeleted) onSaleDeleted(sale.id)
                  }
                }}
                className="w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 flex items-center justify-center transition-colors shadow-sm border border-rose-200/50 dark:border-rose-500/20"
                title="Delete Sale"
              >
                🗑️
              </button>
            </div>
          )}

          <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 sm:gap-3 mb-1.5 sm:mb-1 ${isOwner ? 'pr-16' : ''}`}>
          <h3 className="font-bold text-slate-900 dark:text-white text-[15px] sm:text-lg leading-tight line-clamp-2 sm:line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {sale.title}
          </h3>
          <div className={`shrink-0 self-start ${status.color} px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold flex items-center gap-1.5`}>
            <span>{status.icon}</span>
            <span>{status.label}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 mb-2">
          <span>📍</span>
          <span className="line-clamp-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{sale.neighborhood ? `${sale.neighborhood} • ` : ''}</span>
            {sale.city}, {sale.state}
            {distance != null && <span className="ml-1.5 px-1.5 py-0.5 bg-slate-100 dark:bg-white/[0.04] rounded-md font-medium text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">{distance < 1 ? '<1' : distance.toFixed(1)} mi</span>}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-1 text-[11px] sm:text-sm text-slate-600 dark:text-slate-300 mb-2.5 sm:mb-3 font-medium">
          <span className="flex items-center gap-1.5">📅 {formatDateRange(sale.start_date, sale.end_date)}</span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-600">|</span>
          <span className="flex items-center gap-1.5">🕐 {formatTime(sale.start_time)} – {formatTime(sale.end_time)}</span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-600">|</span>
          <span className="flex items-center gap-1 text-slate-500">👁️ {sale.view_count || 0}</span>
        </div>

        {/* Categories & Route Button */}
        <div className="flex items-center justify-between mt-1">
          {sale.categories && sale.categories.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {sale.categories.slice(0, 4).map(cat => (
                <span
                  key={cat}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${CATEGORY_STYLES[cat]?.tag || CATEGORY_STYLES['Other'].tag}`}
                >
                  {cat}
                </span>
              ))}
              {sale.categories.length > 4 && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-white/[0.04] text-slate-500">
                  +{sale.categories.length - 4}
                </span>
              )}
            </div>
          ) : <div />}
          
          <button
            onClick={handleRouteClick}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              inRoute 
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600' 
                : 'bg-slate-100 dark:bg-white/[0.04] text-slate-500 hover:text-emerald-600 hover:bg-slate-200 dark:hover:bg-white/[0.08]'
            }`}
            title={inRoute ? "Remove from Route" : "Add to Route"}
          >
            <span className="text-[14px]">{inRoute ? '✓' : '🗺️'}</span>
            <span className="hidden sm:inline">{inRoute ? 'In Route' : 'Add to Route'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export { getSaleStatus, formatTime, formatDate, formatDateRange, CATEGORY_STYLES }
