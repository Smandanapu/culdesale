import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import GarageSaleNavbar from '../components/GarageSaleNavbar'
import toast from 'react-hot-toast'
import GarageSaleMap from '../components/GarageSaleMap'
import { geocodeAddress } from '../lib/geocode'

const CATEGORIES = ['Furniture', 'Electronics', 'Sports', 'Kids', 'Tools', 'Appliances', 'Clothing', 'Books', 'Other']

export default function CreateGarageSale() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeResult, setGeocodeResult] = useState(null)
  const [modelFile, setModelFile] = useState(null)
  const [uploadingModel, setUploadingModel] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    start_date: '',
    end_date: '',
    start_time: '08:00',
    end_time: '14:00',
    categories: [],
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const toggleCategory = (cat) => {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat]
    }))
  }

  // Geocode address on blur
  const handleGeocode = async () => {
    if (!form.address || !form.city) return
    setGeocoding(true)
    const result = await geocodeAddress(form.address, form.city, form.state, form.zip_code)
    setGeocodeResult(result)
    setGeocoding(false)
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) return setError('Please enter a title for your garage sale.')
    if (!form.address.trim()) return setError('Please enter the street address.')
    if (!form.neighborhood.trim()) return setError('Please enter your neighborhood.')
    if (!form.city.trim()) return setError('Please enter the city.')
    if (!form.state.trim()) return setError('Please enter the state.')
    if (!form.zip_code.trim()) return setError('Please enter the zip code.')
    if (!form.start_date) return setError('Please select a start date.')
    if (!form.end_date) return setError('Please select an end date.')

    setLoading(true)

    // Geocode if not already done
    let coords = geocodeResult
    if (!coords) {
      coords = await geocodeAddress(form.address, form.city, form.state, form.zip_code)
    }

    let uploadedModelUrl = null
    if (modelFile) {
      setUploadingModel(true)
      const fileExt = modelFile.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('garage_sale_models')
        .upload(fileName, modelFile)
        
      if (uploadError) {
        toast.error('Failed to upload 3D model')
        setLoading(false)
        setUploadingModel(false)
        return
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('garage_sale_models')
        .getPublicUrl(fileName)
        
      uploadedModelUrl = publicUrlData.publicUrl
      setUploadingModel(false)
    }

    const { data, error: insertError } = await supabase
      .from('garage_sales')
      .insert({
        seller_id: user.id,
        title: form.title.trim(),
        description: form.description.trim(),
        address: form.address.trim(),
        neighborhood: form.neighborhood.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zip_code: form.zip_code.trim(),
        latitude: coords?.lat || null,
        longitude: coords?.lng || null,
        start_date: form.start_date,
        end_date: form.end_date,
        start_time: form.start_time,
        end_time: form.end_time,
        categories: form.categories,
        status: 'upcoming',
        model_url: uploadedModelUrl,
      })
      .select()
      .single()

    if (insertError) {
      toast.error(insertError.message)
      setError(insertError.message)
      setLoading(false)
      return
    }

    toast.success('Garage sale posted successfully! 🎉')
    navigate(`/garage-sales/${data.id}`)
  }

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] text-slate-900 dark:text-slate-100">
      <GarageSaleNavbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Post a Garage Sale</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Let your neighbors know about your upcoming sale!
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 sm:p-6 shadow-sm">
            <h2 className="font-bold text-base mb-4 flex items-center gap-2">🏷️ Sale Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="e.g. Big Spring Cleanout!"
                  required
                  className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="What kinds of items will you have? Any special deals?"
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 sm:p-6 shadow-sm">
            <h2 className="font-bold text-base mb-4 flex items-center gap-2">📍 Location</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">Street Address *</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={e => set('address', e.target.value)}
                    onBlur={handleGeocode}
                    placeholder="123 Oak Street"
                    required
                    className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">Neighborhood *</label>
                  <input
                    type="text"
                    value={form.neighborhood}
                    onChange={e => set('neighborhood', e.target.value)}
                    placeholder="e.g. Harvest"
                    required
                    className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">City *</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={e => set('city', e.target.value)}
                    onBlur={handleGeocode}
                    placeholder="Dallas"
                    required
                    className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">State *</label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={e => set('state', e.target.value)}
                    placeholder="TX"
                    maxLength={2}
                    required
                    className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all uppercase"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">Zip Code *</label>
                  <input
                    type="text"
                    value={form.zip_code}
                    onChange={e => set('zip_code', e.target.value)}
                    placeholder="75001"
                    maxLength={10}
                    required
                    className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Geocode Status */}
              {geocoding && (
                <div className="text-xs text-emerald-500 font-medium animate-pulse">📍 Locating address on map...</div>
              )}
              {geocodeResult && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✅ Address found and pinned on map</div>
              )}

              {/* Live Map Preview */}
              {geocodeResult && (
                <GarageSaleMap
                  sales={[{
                    id: 'preview',
                    title: form.title || 'Your Garage Sale',
                    address: form.address,
                    city: form.city,
                    start_date: form.start_date || new Date().toISOString().split('T')[0],
                    end_date: form.end_date || new Date().toISOString().split('T')[0],
                    start_time: form.start_time,
                    end_time: form.end_time,
                    latitude: geocodeResult.lat,
                    longitude: geocodeResult.lng,
                  }]}
                  center={[geocodeResult.lat, geocodeResult.lng]}
                  zoom={15}
                  className="h-48 sm:h-64"
                />
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 sm:p-6 shadow-sm">
            <h2 className="font-bold text-base mb-4 flex items-center gap-2">📅 Date & Time</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">Start Date *</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={e => {
                    set('start_date', e.target.value)
                    if (!form.end_date || form.end_date < e.target.value) {
                      set('end_date', e.target.value)
                    }
                  }}
                  min={today}
                  required
                  className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">End Date *</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={e => set('end_date', e.target.value)}
                  min={form.start_date || today}
                  required
                  className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">Daily Start Time</label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={e => set('start_time', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">Daily End Time</label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={e => set('end_time', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* 3D Walkthrough */}
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 sm:p-6 shadow-sm">
            <h2 className="font-bold text-base mb-4 flex items-center gap-2">🕹️ Virtual 3D Walkthrough <span className="text-xs font-normal bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full ml-2">WOW Factor</span></h2>
            
            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4 mb-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              <strong>Stand out from the crowd!</strong> You can upload a 3D scan of your garage sale so buyers can virtually explore your items before driving over. 
              <br/><br/>
              To create a scan, download a free app like <strong>Polycam</strong> or <strong>Luma AI</strong> on your phone, walk around your tables, and export the file as a <strong>.glb</strong> or <strong>.gltf</strong>.
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">Upload 3D Model File (.glb, .gltf) - Optional</label>
              <input
                type="file"
                accept=".glb,.gltf"
                onChange={e => setModelFile(e.target.files[0])}
                className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 dark:file:bg-emerald-500/10 file:text-emerald-600 dark:file:text-emerald-400 hover:file:bg-emerald-100 dark:hover:file:bg-emerald-500/20 transition-all cursor-pointer"
              />
              {modelFile && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">Ready to upload: {modelFile.name}</p>}
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 sm:p-6 shadow-sm">
            <h2 className="font-bold text-base mb-4 flex items-center gap-2">📦 What are you selling?</h2>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer active:scale-95 ${
                    form.categories.includes(cat)
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>



          <button
            type="submit"
            disabled={loading || uploadingModel}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-base rounded-2xl shadow-xl shadow-emerald-500/25 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {uploadingModel ? '⏳ Uploading 3D Model...' : loading ? '⏳ Creating...' : '🏷️ Post Garage Sale'}
          </button>
        </form>
      </div>
    </div>
  )
}
