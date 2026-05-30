// Geocode utility using free Nominatim (OpenStreetMap) API
// No API key required

export async function geocodeAddress(address, city, state, zip) {
  const query = [address, city, state, zip].filter(Boolean).join(', ')
  const fallbackQuery = [city, state, zip].filter(Boolean).join(', ')
  
  try {
    let response = await fetch(
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
    
    let data = await response.json()
    
    // If strict address fails, fallback to city/state/zip
    if (!data || data.length === 0) {
      console.warn(`Geocoding failed for strict address: ${query}. Retrying with fallback: ${fallbackQuery}`)
      response = await fetch(
        `https://nominatim.openstreetmap.org/search?` + 
        new URLSearchParams({
          q: fallbackQuery,
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
      data = await response.json()
    }
    
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
