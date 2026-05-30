import { createClient } from '@supabase/supabase-js'


const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function run() {
  const { data, error } = await supabase.from('garage_sales').select('*')
  if (!data) return

  for (const s of data) {
    const query = [s.address, s.city, s.state, s.zip_code].filter(Boolean).join(', ')
    console.log(`Sale ID: ${s.id}`)
    console.log(`Address used: ${query}`)
    
    // Test nominatim
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
    const json = await response.json()
    if (json && json.length > 0) {
      console.log(`Geocoded to: ${json[0].lat}, ${json[0].lon}`)
    } else {
      console.log(`Geocoding FAILED for this address.`)
    }
    console.log('---')
  }
}

run()
