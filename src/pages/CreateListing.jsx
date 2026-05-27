import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'

const CATEGORIES = ['Furniture', 'Electronics', 'Sports', 'Kids', 'Tools', 'Appliances', 'Clothing', 'Books', 'Other']
const DURATIONS = [
  { label: '1 day', hours: 24 },
  { label: '3 days', hours: 72 },
  { label: '7 days', hours: 168 },
]
const MEETUP_TYPES = ['Porch Pickup', 'Clubhouse', 'Parking Lot', 'Mailroom']

export default function CreateListing() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    photos: [],
    starting_price: '',
    buy_now_price: '',
    is_free: false,
    duration: DURATIONS[1],
    meetup_type: MEETUP_TYPES[0],
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handlePhotos = async (e) => {
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

  const removePhoto = (index) => {
    set('photos', form.photos.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    const endsAt = new Date()
    endsAt.setHours(endsAt.getHours() + form.duration.hours)

    const { error } = await supabase.from('listings').insert({
      seller_id: user.id,
      title: form.title,
      description: form.description,
      category: form.category,
      photos: form.photos,
      starting_price: form.is_free ? 0 : parseFloat(form.starting_price) || 0,
      current_price: form.is_free ? 0 : parseFloat(form.starting_price) || 0,
      buy_now_price: form.buy_now_price ? parseFloat(form.buy_now_price) : null,
      is_free: form.is_free,
      meetup_type: form.meetup_type,
      ends_at: endsAt.toISOString(),
      status: 'active',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    navigate('/feed')
  }

  const canNext1 = form.title && form.category
  const canNext2 = form.is_free || form.starting_price

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">List an Item</h1>
          <span className="text-sm text-zinc-500">Step {step} of 3</span>
        </div>

        <div className="w-full bg-zinc-800 rounded-full h-1 mb-8">
          <div
            className="bg-orange-500 h-1 rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="text-lg font-semibold mb-1">Item Details</div>

            {/* Photo Upload */}
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">
                Photos ({form.photos.length}/5)
              </label>

              {/* Photo Grid */}
              {form.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {form.photos.map((url, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={url}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {form.photos.length < 5 && (
                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-orange-500 transition">
                  {uploading ? (
                    <span className="text-zinc-400 text-sm">Uploading...</span>
                  ) : (
                    <>
                      <span className="text-2xl mb-1">📷</span>
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
                    onChange={handlePhotos}
                  />
                </label>
              )}
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Title</label>
              <input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="e.g. IKEA desk lamp"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Description</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Condition, age, dimensions, anything relevant..."
                rows={3}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition resize-none"
              />
            </div>

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
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="text-lg font-semibold mb-1">Pricing & Duration</div>

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

            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Auction Duration</label>
              <div className="flex gap-3">
                {DURATIONS.map(d => (
                  <button
                    key={d.label}
                    onClick={() => set('duration', d)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition border ${
                      form.duration.label === d.label
                        ? 'bg-orange-500/10 border-orange-500 text-orange-500'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >{d.label}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div className="text-lg font-semibold mb-1">Meetup Preference</div>

            {MEETUP_TYPES.map(m => (
              <div
                key={m}
                onClick={() => set('meetup_type', m)}
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition ${
                  form.meetup_type === m
                    ? 'bg-orange-500/10 border-orange-500'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                }`}
              >
                <span className="text-2xl">
                  {m === 'Porch Pickup' ? '🏠' : m === 'Clubhouse' ? '🏢' : m === 'Parking Lot' ? '🅿️' : '📬'}
                </span>
                <div>
                  <div className={`font-medium ${form.meetup_type === m ? 'text-orange-500' : ''}`}>{m}</div>
                </div>
              </div>
            ))}

            <div className="mt-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="text-sm font-semibold mb-3 text-zinc-300">Review</div>
              {[
                ['Item', form.title],
                ['Category', form.category],
                ['Photos', `${form.photos.length} uploaded`],
                ['Price', form.is_free ? 'Free' : `$${form.starting_price}`],
                ['Duration', form.duration.label],
                ['Meetup', form.meetup_type],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 text-sm border-b border-zinc-800 last:border-0">
                  <span className="text-zinc-500">{k}</span>
                  <span className="text-white">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition"
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 ? !canNext1 : !canNext2}
              className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-medium transition"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-xl font-medium transition"
            >
              {loading ? 'Publishing...' : 'Go Live!'}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
