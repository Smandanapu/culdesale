import { useNavigate } from 'react-router-dom'

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

export default function GarageSaleCard({ sale, distance }) {
  const navigate = useNavigate()
  const status = getSaleStatus(sale.start_date, sale.end_date, sale.start_time, sale.end_time)
  const mainCat = sale.categories?.[0] || 'Other'
  const style = CATEGORY_STYLES[mainCat] || CATEGORY_STYLES['Other']

  return (
    <div
      onClick={() => navigate(`/garage-sales/${sale.id}`)}
      className="group bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-white/[0.12] transition-all duration-300 cursor-pointer hover:-translate-y-1 relative"
    >
      {/* Dynamic Icon */}
      <div className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ${style.bg} flex items-center justify-center border border-white/50 dark:border-white/5`}>
        <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform duration-300">{style.emoji}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {sale.title}
          </h3>
          <div className={`shrink-0 ${status.color} px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5`}>
            <span>{status.icon}</span>
            <span className="hidden sm:inline">{status.label}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-2.5">
          <span>📍</span>
          <span className="line-clamp-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{sale.neighborhood ? `${sale.neighborhood} • ` : ''}</span>
            {sale.city}, {sale.state}
            {distance != null && <span className="ml-1.5 px-1.5 py-0.5 bg-slate-100 dark:bg-white/[0.04] rounded-md font-medium text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">{distance < 1 ? '<1' : distance.toFixed(1)} mi</span>}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-3 font-medium">
          <span className="flex items-center gap-1.5">📅 {formatDateRange(sale.start_date, sale.end_date)}</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="flex items-center gap-1.5">🕐 {formatTime(sale.start_time)} – {formatTime(sale.end_time)}</span>
        </div>

        {/* Categories */}
        {sale.categories && sale.categories.length > 0 && (
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
        )}
      </div>
    </div>
  )
}

export { getSaleStatus, formatTime, formatDate, formatDateRange, CATEGORY_STYLES }
