import { createClient } from '@supabase/supabase-js'


const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function run() {
  const { data: sales } = await supabase.from('garage_sales').select('*').is('latitude', null)
  if (!sales) return

  for (const s of sales) {
    const fallbackQuery = [s.city, s.state, s.zip_code].filter(Boolean).join(', ')
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` + 
      new URLSearchParams({ q: fallbackQuery, format: 'json', limit: '1', countrycodes: 'us' }),
      { headers: { 'User-Agent': 'CulDeSale-App/1.0' } }
    )
    const json = await response.json()
    
    if (json && json.length > 0) {
      const lat = parseFloat(json[0].lat)
      const lon = parseFloat(json[0].lon)
      console.log(`Backfilling sale ${s.id} with ${lat}, ${lon}`)
      await supabase.from('garage_sales').update({ latitude: lat, longitude: lon }).eq('id', s.id)
    }
  }
  console.log('Done')
}
run()
