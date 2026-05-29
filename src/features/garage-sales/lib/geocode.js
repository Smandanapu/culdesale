// Geocode utility using free Nominatim (OpenStreetMap) API
// No API key required

export async function geocodeAddress(address, city, state, zip) {
  const query = [address, city, state, zip].filter(Boolean).join(', ')
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` + 
      new URLSearchParams({
        q: query,
        format: 'json',
        limit: '1',
        countrycodes: 'us'
      }),
      {
        headers: {
          'User-Agent': 'CulDeSale-App/1.0'
        }
      }
    )
    
    const data = await response.json()
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        display_name: data[0].display_name
      }
    }
    
    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}
