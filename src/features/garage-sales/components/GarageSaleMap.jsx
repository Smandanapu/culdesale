import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import { formatTime, formatDateRange, getSaleStatus } from './GarageSaleCard'

// Custom marker icon
const garageIcon = L.divIcon({
  className: 'garage-sale-marker',
  html: `<div style="
    background: linear-gradient(135deg, #10b981, #14b8a6);
    width: 36px;
    height: 36px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    border: 2px solid white;
  ">
    <span style="transform: rotate(45deg); font-size: 16px;">🏷️</span>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
})

const activeIcon = L.divIcon({
  className: 'garage-sale-marker-active',
  html: `<div style="
    background: linear-gradient(135deg, #f59e0b, #ef4444);
    width: 40px;
    height: 40px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(245, 158, 11, 0.5);
    border: 2px solid white;
    animation: pulse 2s ease-in-out infinite;
  ">
    <span style="transform: rotate(45deg); font-size: 18px;">🔥</span>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
})

export default function GarageSaleMap({ sales, center, zoom = 12, className = '' }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const navigate = useNavigate()

  useEffect(() => {
    if (!mapRef.current) return
    if (mapInstanceRef.current) return // already initialized

    const map = L.map(mapRef.current, {
      center: center || [39.8283, -98.5795], // center of US
      zoom: center ? zoom : 4,
      scrollWheelZoom: true,
      zoomControl: false,
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Update markers when sales change
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Clear old markers
    markersRef.current.forEach(m => map.removeLayer(m))
    markersRef.current = []

    const validSales = sales.filter(s => s.latitude && s.longitude)

    validSales.forEach(sale => {
      const status = getSaleStatus(sale.start_date, sale.end_date, sale.start_time, sale.end_time)
      const isHappeningNow = status.label === 'Happening Now!'
      const icon = isHappeningNow ? activeIcon : garageIcon

      const marker = L.marker([sale.latitude, sale.longitude], { icon })
        .addTo(map)

      const popupContent = `
        <div style="min-width: 200px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #1e293b;">${sale.title}</div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">📍 ${sale.address}, ${sale.city}</div>
          <div style="font-size: 12px; color: #334155; margin-bottom: 8px;">
            📅 ${formatDateRange(sale.start_date, sale.end_date)} · 🕐 ${formatTime(sale.start_time)} – ${formatTime(sale.end_time)}
          </div>
          <div style="
            display: inline-block;
            padding: 2px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            ${isHappeningNow
              ? 'background: #d1fae5; color: #059669;'
              : 'background: #dbeafe; color: #2563eb;'
            }
          ">${status.icon} ${status.label}</div>
          <div style="margin-top: 10px;">
            <a href="/garage-sales/${sale.id}" style="
              display: inline-block;
              padding: 6px 14px;
              background: linear-gradient(135deg, #10b981, #14b8a6);
              color: white;
              border-radius: 8px;
              font-size: 12px;
              font-weight: 600;
              text-decoration: none;
              cursor: pointer;
            ">View Details →</a>
          </div>
        </div>
      `

      marker.bindPopup(popupContent, {
        closeButton: true,
        className: 'garage-sale-popup',
      })

      markersRef.current.push(marker)
    })

    // Fit bounds to all markers
    if (validSales.length > 0 && !center) {
      const bounds = L.latLngBounds(validSales.map(s => [s.latitude, s.longitude]))
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
    }
  }, [sales, center])

  // Update center when it changes
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !center) return
    map.setView(center, zoom)
  }, [center, zoom])

  return (
    <div
      ref={mapRef}
      className={`w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/[0.06] ${className}`}
      style={{ minHeight: '400px' }}
    />
  )
}
