import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import GarageSaleNavbar from '../components/GarageSaleNavbar'
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
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    sale_date: '',
    start_time: '08:00',
    end_time: '14:00',
    categories: [],
    photos: [],
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

  // Photo upload
  const handlePhotos = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    const remaining = 5 - form.photos.length
    if (remaining <= 0) return
    setUploading(true)

    const newPhotos = []
    for (const file of files.slice(0, remaining)) {
      const ext = file.name.split('.').pop()
      const fileName = `garage-sales/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('listing-images')
          .getPublicUrl(fileName)
        newPhotos.push(urlData.publicUrl)
      }
    }

    set('photos', [...form.photos, ...newPhotos])
    setUploading(false)
  }

  const removePhoto = (index) => {
    set('photos', form.photos.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) return setError('Please enter a title for your garage sale.')
    if (!form.address.trim()) return setError('Please enter the street address.')
    if (!form.city.trim()) return setError('Please enter the city.')
    if (!form.sale_date) return setError('Please select a date.')

    setLoading(true)

    // Geocode if not already done
    let coords = geocodeResult
    if (!coords) {
      coords = await geocodeAddress(form.address, form.city, form.state, form.zip_code)
    }

    const { data, error: insertError } = await supabase
      .from('garage_sales')
      .insert({
        seller_id: user.id,
        title: form.title.trim(),
        description: form.description.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zip_code: form.zip_code.trim(),
        latitude: coords?.lat || null,
        longitude: coords?.lng || null,
        sale_date: form.sale_date,
        start_time: form.start_time,
        end_time: form.end_time,
        categories: form.categories,
        photos: form.photos,
        status: 'upcoming',
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2 sm:col-span-1">
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
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">State</label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={e => set('state', e.target.value)}
                    placeholder="TX"
                    maxLength={2}
                    className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all uppercase"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">Zip Code</label>
                  <input
                    type="text"
                    value={form.zip_code}
                    onChange={e => set('zip_code', e.target.value)}
                    placeholder="75001"
                    maxLength={10}
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
                    sale_date: form.sale_date || new Date().toISOString().split('T')[0],
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">Sale Date *</label>
                <input
                  type="date"
                  value={form.sale_date}
                  onChange={e => set('sale_date', e.target.value)}
                  min={today}
                  required
                  className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">Start Time</label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={e => set('start_time', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">End Time</label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={e => set('end_time', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>
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

          {/* Photos */}
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 sm:p-6 shadow-sm">
            <h2 className="font-bold text-base mb-1 flex items-center gap-2">📸 Preview Photos</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Optional — show visitors what to expect (up to 5 photos)</p>

            {form.photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
                {form.photos.map((url, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-white/[0.06]">
                    <img src={url} alt="" className="w-full h-20 sm:h-24 object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {form.photos.length < 5 && (
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-white/[0.08] rounded-xl py-6 cursor-pointer hover:border-emerald-500/50 transition-colors">
                <span className="text-slate-400 text-sm">{uploading ? '⏳ Uploading...' : '📁 Tap to add photos'}</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotos}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-base rounded-2xl shadow-xl shadow-emerald-500/25 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {loading ? '⏳ Creating...' : '🏷️ Post Garage Sale'}
          </button>
        </form>
      </div>
    </div>
  )
}
