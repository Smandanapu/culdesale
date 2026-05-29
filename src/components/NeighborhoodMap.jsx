import { MapContainer, TileLayer, Circle } from 'react-leaflet'

export default function NeighborhoodMap({ latitude, longitude }) {
  if (!latitude || !longitude) return null

  // 0.5 miles is approx 800 meters
  const RADIUS_METERS = 800
  const position = [latitude, longitude]

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-white/[0.04]">
      {/* 
        We disable zoomControl, dragging, doubleClickZoom, etc. to make it feel like a sleek, read-only widget.
      */}
      <MapContainer 
        center={position} 
        zoom={14} 
        zoomControl={false}
        dragging={false}
        doubleClickZoom={false}
        scrollWheelZoom={false}
        touchZoom={false}
        className="w-full h-full absolute inset-0 z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <Circle 
          center={position} 
          radius={RADIUS_METERS} 
          pathOptions={{ 
            color: '#f97316',      // orange-500
            fillColor: '#f97316', 
            fillOpacity: 0.2,
            weight: 2,
            dashArray: '4 4' // Dashed border for a radar/zone effect
          }} 
        />
      </MapContainer>
      
      {/* Overlay to catch clicks and prevent map interaction entirely while providing a sleek gradient vignette */}
      <div className="absolute inset-0 z-10 pointer-events-auto bg-gradient-to-t from-white/20 dark:from-black/40 via-transparent to-transparent"></div>
    </div>
  )
}
