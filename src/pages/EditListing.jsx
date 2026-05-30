import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

const CATEGORIES = ['Furniture', 'Electronics', 'Sports', 'Kids', 'Tools', 'Appliances', 'Clothing', 'Books', 'Other']
const MEETUP_TYPES = ['Porch Pickup', 'Clubhouse', 'Parking Lot', 'Mailroom', 'Mutual Preference']

export default function EditListing() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    photos: [],
    starting_price: '',
    buy_now_price: '',
    is_free: false,
    meetup_type: '',
    zip_code: '',
    dim_length: '',
    dim_width: '',
    dim_height: '',
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  useEffect(() => {
    fetchListing()
  }, [id])

  const fetchListing = async () => {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      navigate('/feed')
      return
    }

    const isFirefighter = user?.email === 'satish.dfw@gmail.com'
    if (data.seller_id !== user.id && !isFirefighter) {
      navigate('/feed')
      return
    }

    setForm({
      title: data.title || '',
      description: data.description || '',
      category: data.category || '',
      photos: data.photos || [],
      starting_price: data.starting_price || '',
      buy_now_price: data.buy_now_price || '',
      is_free: data.is_free || false,
      meetup_type: data.meetup_type || MEETUP_TYPES[0],
      zip_code: data.zip_code || '',
      dim_length: data.dim_length || '',
      dim_width: data.dim_width || '',
      dim_height: data.dim_height || '',
    })
    setLoading(false)
  }

  const handleAddPhotos = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    const remaining = 5 - form.photos.length
    if (remaining <= 0) return
    setUploading(true)

    const urls = []
    for (const file of files.slice(0, remaining)) {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage
        .from('listing-photos')
        .upload(path, file)

      if (!error) {
        const { data } = supabase.storage
          .from('listing-photos')
          .getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }

    set('photos', [...form.photos, ...urls])
    setUploading(false)
  }

  const removePhoto = async (index) => {
    const confirmed = window.confirm('Remove this photo?')
    if (!confirmed) return
    const updated = form.photos.filter((_, i) => i !== index)
    set('photos', updated)
  }

  const handleSave = async () => {
    setError('')
    setSuccess('')

    if (!form.title) {
      setError('Title is required')
      return
    }
    if (!form.category) {
      setError('Category is required')
      return
    }
    if (form.photos.length === 0) {
      setError('At least 1 photo is required')
      return
    }
    if (!form.is_free && !form.starting_price) {
      setError('Starting price is required')
      return
    }
    if (!form.zip_code || form.zip_code.length !== 5) {
      setError('A valid 5-digit ZIP code is required')
      return
    }

    setSaving(true)

    let lat = null
    let lon = null
    try {
      if (form.zip_code && form.zip_code.length === 5) {
        const res = await fetch(`https://api.zippopotam.us/us/${form.zip_code}`)
        if (res.ok) {
          const data = await res.json()
          if (data.places && data.places.length > 0) {
            lat = parseFloat(data.places[0].latitude)
            lon = parseFloat(data.places[0].longitude)
          }
        }
      }
    } catch (e) {
      console.error("ZIP lookup failed, inserting without coordinates", e)
    }

    const { error: updateError } = await supabase
      .from('listings')
      .update({
        title: form.title,
        description: form.description,
        category: form.category,
        photos: form.photos,
        starting_price: form.is_free ? 0 : parseFloat(form.starting_price) || 0,
        buy_now_price: form.buy_now_price ? parseFloat(form.buy_now_price) : null,
        is_free: form.is_free,
        meetup_type: form.meetup_type,
        zip_code: form.zip_code,
        latitude: lat,
        longitude: lon,
        dim_length: form.dim_length ? parseFloat(form.dim_length) : null,
        dim_width: form.dim_width ? parseFloat(form.dim_width) : null,
        dim_height: form.dim_height ? parseFloat(form.dim_height) : null,
      })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setSuccess('Listing updated successfully!')
    setSaving(false)

    setTimeout(() => navigate(`/listing/${id}`), 1000)
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] bg-grid-pattern text-slate-900 dark:text-slate-100 relative overflow-hidden">
      <Navbar />
      <div className="flex flex-col items-center justify-center py-32 text-slate-500 dark:text-slate-400 gap-3 relative z-10">
        <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
        <span className="text-sm font-medium tracking-wide">Loading listing details...</span>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] bg-grid-pattern text-slate-900 dark:text-slate-100 relative overflow-hidden">
      {/* Floating Ambient Glow Orbs */}
      <div className="absolute top-[5%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none animate-float-slow z-0" />
      <div className="absolute bottom-[5%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none animate-float-slower z-0" />

      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-8 relative z-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(`/listing/${id}`)}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-all hover:-translate-x-1 cursor-pointer font-bold text-lg"
          >
            ←
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Edit Listing</h1>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm rounded-xl px-4 py-3 mb-6">
            {success}
          </div>
        )}

        <div className="card-gradient-border bg-white dark:bg-white/[0.015] backdrop-blur-md border border-slate-200 dark:border-white/[0.04] rounded-2xl p-6 shadow-2xl flex flex-col gap-6">

          {/* Photos */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">
              Photos ({form.photos.length}/5) <span className="text-rose-400 ml-1 lowercase">*at least 1 required</span>
            </label>

            {form.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 mb-3">
                {form.photos.map((url, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden aspect-video border border-slate-200 dark:border-white/[0.06]">
                    <img
                      src={url}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-rose-500 hover:bg-rose-600 text-slate-900 dark:text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold shadow-md cursor-pointer"
                    >
                      x
                    </button>
                    {i === 0 && (
                      <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-slate-900 dark:text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Cover
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {form.photos.length < 5 && (
              <label className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-slate-200 dark:border-white/[0.08] hover:border-orange-500/60 rounded-xl cursor-pointer hover:bg-white dark:bg-white/[0.02] transition-all duration-300">
                {uploading ? (
                  <span className="text-slate-500 dark:text-slate-400 text-sm font-medium animate-pulse">Uploading...</span>
                ) : (
                  <>
                    <span className="text-xl mb-1">📷</span>
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Add photos ({5 - form.photos.length} remaining)
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleAddPhotos}
                />
              </label>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">Title</label>
            <input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. IKEA desk lamp"
              className="w-full bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:bg-white dark:focus:bg-white/[0.04] focus:ring-1 focus:ring-orange-500/20 transition-all duration-300 shadow-inner"
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Description</label>
              <span className={`text-[10px] font-bold tracking-wide ${form.description.length > 450 ? 'text-rose-400' : 'text-slate-500'}`}>
                {form.description.length}/500
              </span>
            </div>
            <textarea
              value={form.description}
              onChange={e => { if (e.target.value.length <= 500) set('description', e.target.value) }}
              placeholder="Condition, age, dimensions..."
              rows={4}
              maxLength={500}
              className="w-full bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:bg-white dark:focus:bg-white/[0.04] focus:ring-1 focus:ring-orange-500/20 transition-all duration-300 shadow-inner resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => set('category', c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    form.category === c
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-900 dark:text-white shadow-md shadow-orange-500/10'
                      : 'bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-white/[0.05]'
                  }`}
                >{c}</button>
              ))}
            </div>
          </div>

          {/* Dimensions */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">Dimensions (inches) - Optional</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={form.dim_length}
                onChange={e => set('dim_length', e.target.value)}
                placeholder="Length"
                className="w-full bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20"
              />
              <input
                type="number"
                value={form.dim_width}
                onChange={e => set('dim_width', e.target.value)}
                placeholder="Width"
                className="w-full bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20"
              />
              <input
                type="number"
                value={form.dim_height}
                onChange={e => set('dim_height', e.target.value)}
                placeholder="Height"
                className="w-full bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20"
              />
            </div>
          </div>

          {/* Free Toggle */}
          <div
            onClick={() => set('is_free', !form.is_free)}
            className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
              form.is_free
                ? 'bg-blue-500/10 border-blue-500/25 text-slate-900 dark:text-white'
                : 'bg-white/[0.01] border-slate-200 dark:border-white/[0.04] hover:bg-white dark:bg-white/[0.02]'
            }`}
          >
            <div>
              <div className="font-semibold text-sm">List as Freebie</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">First to claim it gets it free</div>
            </div>
            <div className={`w-10 h-6 rounded-full relative transition-colors duration-200 ${form.is_free ? 'bg-blue-500' : 'bg-white/[0.08]'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ${form.is_free ? 'left-5' : 'left-1'}`} />
            </div>
          </div>

          {/* Pricing */}
          {!form.is_free && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">Starting Bid Price ($)</label>
                <input
                  type="number"
                  value={form.starting_price}
                  onChange={e => set('starting_price', e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:bg-white dark:focus:bg-white/[0.04] focus:ring-1 focus:ring-orange-500/20 transition-all duration-300 shadow-inner"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">Buy It Now Price (optional)</label>
                <input
                  type="number"
                  value={form.buy_now_price}
                  onChange={e => set('buy_now_price', e.target.value)}
                  placeholder="Leave blank to skip"
                  className="w-full bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:bg-white dark:focus:bg-white/[0.04] focus:ring-1 focus:ring-orange-500/20 transition-all duration-300 shadow-inner"
                />
              </div>
            </div>
          )}

          {/* Meetup */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">Meetup Preference</label>
            <div className="grid grid-cols-1 gap-2.5">
              {MEETUP_TYPES.map(m => (
                <div
                  key={m}
                  onClick={() => set('meetup_type', m)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                    form.meetup_type === m
                      ? 'bg-orange-500/10 border-orange-500/60 text-slate-900 dark:text-white'
                      : 'bg-white dark:bg-white/[0.015] border-slate-200 dark:border-white/[0.04] hover:bg-white/[0.025] hover:border-white/[0.1]'
                  }`}
                >
                  <span className="text-2xl">
                    {m === 'Porch Pickup' ? '🏠' : m === 'Clubhouse' ? '🏢' : m === 'Parking Lot' ? '🅿️' : m === 'Mailroom' ? '📬' : '👥'}
                  </span>
                  <span className={`text-xs font-bold ${form.meetup_type === m ? 'text-orange-400' : 'text-slate-600 dark:text-slate-300'}`}>
                    {m}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ZIP Code */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
              ZIP Code <span className="text-rose-400 font-bold">*</span>
            </label>
            <input
              type="text"
              pattern="[0-9]*"
              value={form.zip_code}
              onChange={e => {
                const clean = e.target.value.replace(/\D/g, '').slice(0, 5)
                set('zip_code', clean)
              }}
              placeholder="e.g. 90210"
              className="w-full bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:bg-white dark:focus:bg-white/[0.04] focus:ring-1 focus:ring-orange-500/20 transition-all duration-300 shadow-inner"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 dark:text-white font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-orange-500/25"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

        </div>
      </div>
    </div>
  )
}
