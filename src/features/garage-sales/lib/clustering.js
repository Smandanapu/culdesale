// Haversine formula to get distance in miles between two coordinates
export function getDistanceMiles(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null
  const R = 3958.8 // Radius of Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function detectMegaSales(sales, minSize = 3, maxDistanceMiles = 0.5) {
  const megaSales = []

  // 1. Group by start_date
  const salesByDate = {}
  for (const sale of sales) {
    if (!sale.latitude || !sale.longitude || !sale.start_date) continue
    if (!salesByDate[sale.start_date]) salesByDate[sale.start_date] = []
    salesByDate[sale.start_date].push(sale)
  }

  // 2. Find connected components (clusters) per date
  for (const date in salesByDate) {
    const dailySales = salesByDate[date]
    if (dailySales.length < minSize) continue

    const visited = new Set()

    for (let i = 0; i < dailySales.length; i++) {
      if (visited.has(dailySales[i].id)) continue

      const cluster = [dailySales[i]]
      visited.add(dailySales[i].id)

      // BFS to find all connected sales within maxDistanceMiles
      const queue = [dailySales[i]]
      while (queue.length > 0) {
        const current = queue.shift()

        for (let j = 0; j < dailySales.length; j++) {
          const neighbor = dailySales[j]
          if (visited.has(neighbor.id)) continue

          const dist = getDistanceMiles(current.latitude, current.longitude, neighbor.latitude, neighbor.longitude)
          if (dist !== null && dist <= maxDistanceMiles) {
            visited.add(neighbor.id)
            cluster.push(neighbor)
            queue.push(neighbor)
          }
        }
      }

      // If cluster meets the threshold, it's a mega-sale!
      if (cluster.length >= minSize) {
        // Calculate the centroid of the cluster for map markers
        const sumLat = cluster.reduce((sum, s) => sum + s.latitude, 0)
        const sumLon = cluster.reduce((sum, s) => sum + s.longitude, 0)
        
        // Find most common neighborhood
        const neighborhoods = cluster.map(s => s.neighborhood).filter(Boolean)
        const neighborhoodCounts = neighborhoods.reduce((acc, curr) => {
          acc[curr] = (acc[curr] || 0) + 1
          return acc
        }, {})
        const topNeighborhood = Object.keys(neighborhoodCounts).sort((a,b) => neighborhoodCounts[b] - neighborhoodCounts[a])[0] || 'Unknown Area'

        megaSales.push({
          id: `mega-${date}-${i}`,
          date: date,
          centerLat: sumLat / cluster.length,
          centerLon: sumLon / cluster.length,
          saleIds: cluster.map(s => s.id),
          count: cluster.length,
          neighborhood: topNeighborhood
        })
      }
    }
  }

  return megaSales
}
