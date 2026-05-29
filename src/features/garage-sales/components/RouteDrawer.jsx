import { useRoute } from '../context/RouteContext'
import { generateMultiStopUrl } from '../lib/routing'
import { useState, useEffect } from 'react'

export default function RouteDrawer({ isOpen, onClose }) {
  const { route, removeSaleFromRoute, clearRoute, reorderRoute } = useRoute()
  const [userLocation, setUserLocation] = useState(null)

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      )
    }
  }, [])

  if (!isOpen) return null

  const handleStartDriving = () => {
    const url = generateMultiStopUrl(route, userLocation)
    if (url) {
      window.open(url, '_blank')
    }
  }

  const handleMoveUp = (index) => {
    if (index > 0) reorderRoute(index, index - 1)
  }

  const handleMoveDown = (index) => {
    if (index < route.length - 1) reorderRoute(index, index + 1)
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-[#07090e] border-l border-slate-200 dark:border-white/[0.08] shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-white/[0.08] flex justify-between items-center bg-slate-50 dark:bg-white/[0.02]">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🗺️</span> My Route
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {route.length} {route.length === 1 ? 'stop' : 'stops'} selected
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/[0.12] transition"
          >
            ✕
          </button>
        </div>

        {/* Stops List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {route.length === 0 ? (
            <div className="text-center py-20 text-slate-500 dark:text-slate-400">
              <div className="text-5xl opacity-30 mb-4">🚗</div>
              <p className="font-medium">Your route is empty!</p>
              <p className="text-sm mt-1">Find garage sales on the map and add them to your route.</p>
            </div>
          ) : (
            route.map((sale, index) => (
              <div 
                key={sale.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#151821] shadow-sm flex items-start gap-3 relative group"
              >
                <div className="flex flex-col items-center gap-1 mt-1">
                  <button onClick={() => handleMoveUp(index)} disabled={index === 0} className="text-slate-400 hover:text-emerald-500 disabled:opacity-30">▲</button>
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold border border-slate-200 dark:border-white/[0.08]">
                    {index + 1}
                  </div>
                  <button onClick={() => handleMoveDown(index)} disabled={index === route.length - 1} className="text-slate-400 hover:text-emerald-500 disabled:opacity-30">▼</button>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-white truncate">{sale.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{sale.address}, {sale.city}</p>
                </div>

                <button 
                  onClick={() => removeSaleFromRoute(sale.id)}
                  className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                  title="Remove from Route"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {route.length > 0 && (
          <div className="p-5 border-t border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#07090e] space-y-3">
            <button
              onClick={handleStartDriving}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all text-lg flex items-center justify-center gap-2"
            >
              <span>🚗</span> Start Driving
            </button>
            <button
              onClick={clearRoute}
              className="w-full py-2.5 text-sm font-semibold text-slate-500 hover:text-rose-500 transition-colors"
            >
              Clear Route
            </button>
          </div>
        )}

      </div>
    </>
  )
}
