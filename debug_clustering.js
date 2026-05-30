import { createClient } from '@supabase/supabase-js'
import { detectMegaSales } from './src/features/garage-sales/lib/clustering.js'


const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function run() {
  const { data, error } = await supabase.from('garage_sales').select('*')
  console.log(`Fetched ${data?.length || 0} sales. Error:`, error)
  if (!data) return

  data.forEach(s => {
    console.log(`Sale ${s.id}: startDate=${s.start_date}, lat=${s.latitude}, lng=${s.longitude}`)
  })

  const clusters = detectMegaSales(data)
  console.log('Detected clusters:', JSON.stringify(clusters, null, 2))
}

run()
