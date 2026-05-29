import { useNavigate } from 'react-router-dom'

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

function getSaleStatus(saleDate, startTime, endTime) {
  const now = new Date()
  const saleDateObj = new Date(saleDate + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  saleDateObj.setHours(0, 0, 0, 0)

  if (saleDateObj > today) {
    const diffDays = Math.ceil((saleDateObj - today) / (1000 * 60 * 60 * 24))
    if (diffDays === 1) return { label: 'Tomorrow', color: 'bg-blue-500/10 text-blue-500', icon: '📅' }
    return { label: `In ${diffDays} days`, color: 'bg-blue-500/10 text-blue-500', icon: '📅' }
  }

  if (saleDateObj.getTime() === today.getTime()) {
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
    return { label: 'Ended Today', color: 'bg-slate-500/10 text-slate-500', icon: '⏹️' }
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

export default function GarageSaleCard({ sale, distance }) {
  const navigate = useNavigate()
  const status = getSaleStatus(sale.sale_date, sale.start_time, sale.end_time)
  const hasPhoto = sale.photos && sale.photos.length > 0

  return (
    <div
      onClick={() => navigate(`/garage-sales/${sale.id}`)}
      className="group bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-white/[0.12] transition-all duration-300 cursor-pointer hover:-translate-y-1"
    >
      {/* Photo or Gradient Placeholder */}
      <div className="relative h-36 sm:h-44 overflow-hidden">
        {hasPhoto ? (
          <img
            src={sale.photos[0]}
            alt={sale.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 dark:from-emerald-500/10 dark:via-teal-500/10 dark:to-cyan-500/10 flex items-center justify-center">
            <span className="text-5xl opacity-40">🏷️</span>
          </div>
        )}

        {/* Status Badge */}
        <div className={`absolute top-3 left-3 ${status.color} backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5`}>
          <span>{status.icon}</span>
          {status.label}
        </div>

        {/* Distance Badge */}
        {distance != null && (
          <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300">
            📍 {distance < 1 ? '<1' : distance.toFixed(1)} mi
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1 line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {sale.title}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span>📍</span>
          <span className="line-clamp-1">{sale.address}, {sale.city}{sale.state ? `, ${sale.state}` : ''}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 mb-3 font-medium">
          <span>📅 {formatDate(sale.sale_date)}</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span>🕐 {formatTime(sale.start_time)} – {formatTime(sale.end_time)}</span>
        </div>

        {/* Categories */}
        {sale.categories && sale.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {sale.categories.slice(0, 3).map(cat => (
              <span
                key={cat}
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${CATEGORY_COLORS[cat] || CATEGORY_COLORS['Other']}`}
              >
                {cat}
              </span>
            ))}
            {sale.categories.length > 3 && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-white/[0.04] text-slate-500">
                +{sale.categories.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export { getSaleStatus, formatTime, formatDate }
