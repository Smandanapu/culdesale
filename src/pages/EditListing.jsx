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

    if (data.seller_id !== user.id) {
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
    if (!form.is_free && !form.starting_price) {
      setError('Starting price is required')
      return
    }

    setSaving(true)

    const { error } = await supabase
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
      })
      .eq('id', id)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    setSuccess('Listing updated successfully!')
    setSaving(false)

    setTimeout(() => navigate(`/listing/${id}`), 1000)
  }

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />
      <div className="flex items-center justify-center py-24 text-zinc-500">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(`/listing/${id}`)}
            className="text-zinc-400 hover:text-white transition"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold">Edit Listing</h1>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3 mb-6">
            {success}
          </div>
        )}

        <div className="flex flex-col gap-6">

          {/* Photos */}
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">
              Photos ({form.photos.length}/5)
            </label>

            {form.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {form.photos.map((url, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={url}
                      className="w-full h-28 object-cover rounded-xl"
                    />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-1.5 right-1.5 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition font-bold"
                    >
                      x
                    </button>
                    {i === 0 && (
                      <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                        Cover
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {form.photos.length < 5 && (
              <label className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-orange-500 transition">
                {uploading ? (
                  <span className="text-zinc-400 text-sm">Uploading...</span>
                ) : (
                  <>
                    <span className="text-xl mb-1">📷</span>
                    <span className="text-sm text-zinc-400">
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
            <label className="text-sm text-zinc-400 mb-1 block">Title</label>
            <input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. IKEA desk lamp"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Description</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Condition, age, dimensions..."
              rows={4}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => set('category', c)}
                  className={`px-3 py-1.5 rounded-full text-sm transition ${
                    form.category === c
                      ? 'bg-orange-500 text-white'
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                >{c}</button>
              ))}
            </div>
          </div>

          {/* Free Toggle */}
          <div
            onClick={() => set('is_free', !form.is_free)}
            className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
              form.is_free
                ? 'bg-blue-500/10 border-blue-500/40'
                : 'bg-zinc-900 border-zinc-800'
            }`}
          >
            <div>
              <div className="font-medium">List as Freebie</div>
              <div className="text-sm text-zinc-400">First to claim it gets it free</div>
            </div>
            <div className={`w-10 h-6 rounded-full relative transition-colors ${form.is_free ? 'bg-blue-500' : 'bg-zinc-700'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.is_free ? 'left-5' : 'left-1'}`} />
            </div>
          </div>

          {/* Pricing */}
          {!form.is_free && (
            <>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Starting Bid Price ($)</label>
                <input
                  type="number"
                  value={form.starting_price}
                  onChange={e => set('starting_price', e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Buy It Now Price (optional)</label>
                <input
                  type="number"
                  value={form.buy_now_price}
                  onChange={e => set('buy_now_price', e.target.value)}
                  placeholder="Leave blank to skip"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition"
                />
              </div>
            </>
          )}

          {/* Meetup */}
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Meetup Preference</label>
            <div className="flex flex-col gap-2">
              {MEETUP_TYPES.map(m => (
                <div
                  key={m}
                  onClick={() => set('meetup_type', m)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    form.meetup_type === m
                      ? 'bg-orange-500/10 border-orange-500'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <span className="text-xl">
                    {m === 'Porch Pickup' ? '🏠' : m === 'Clubhouse' ? '🏢' : m === 'Parking Lot' ? '🅿️' : '📬'}
                  </span>
                  <span className={`text-sm font-medium ${form.meetup_type === m ? 'text-orange-500' : ''}`}>
                    {m}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition text-base"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

        </div>
      </div>
    </div>
  )
}
