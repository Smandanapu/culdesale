import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

const CATEGORIES = ['Furniture', 'Electronics', 'Sports', 'Kids', 'Tools', 'Appliances', 'Clothing', 'Books', 'Other']
const DURATIONS = [
  { label: '1 day', hours: 24 },
  { label: '3 days', hours: 72 },
  { label: '7 days', hours: 168 },
]
const MEETUP_TYPES = ['Porch Pickup', 'Clubhouse', 'Parking Lot', 'Mailroom', 'Mutual Preference']

export default function CreateListing() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [aiStatus, setAiStatus] = useState(null)
  const worker = useRef(null)

  useEffect(() => {
    worker.current = new Worker(new URL('../lib/worker.js', import.meta.url), { type: 'module' })
    
    worker.current.addEventListener('message', (e) => {
      const { status, results } = e.data
      if (status === 'ready') setAiStatus('ready')
      else if (status === 'analyzing') setAiStatus('analyzing')
      else if (status === 'complete' && results && results.length > 0) {
        setAiStatus('complete')
        const bestMatch = results[0]
        setForm(f => ({
          ...f,
          category: bestMatch.label,
          title: f.title || `Automatic: ${bestMatch.label} Item`
        }))
        setTimeout(() => setAiStatus(null), 3000)
      }
    })

    worker.current.postMessage({ type: 'load' })

    return () => worker.current?.terminate()
  }, [])

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

    if (worker.current && !form.category) {
      const reader = new FileReader()
      reader.onload = (e) => {
        worker.current.postMessage({
          type: 'analyze',
          image: e.target.result,
          categories: CATEGORIES
        })
      }
      reader.readAsDataURL(files[0])
    }

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
    <div className="min-h-screen bg-[#07090e] bg-grid-pattern text-slate-100 relative overflow-hidden">
      {/* Floating Ambient Glow Orbs */}
      <div className="absolute top-[5%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none animate-float-slow z-0" />
      <div className="absolute bottom-[5%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none animate-float-slower z-0" />

      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-8 relative z-10">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">List an Item</h1>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-md">Step {step} of 3</span>
        </div>

        <div className="w-full bg-white/[0.04] border border-white/[0.06] rounded-full h-1.5 mb-8 overflow-hidden backdrop-blur-md">
          <div
            className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <div className="card-gradient-border bg-white/[0.015] backdrop-blur-md border border-white/[0.04] rounded-2xl p-6 shadow-2xl">
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between mb-1">
                <div className="text-lg font-bold text-white">Item Details</div>
                {aiStatus === 'analyzing' && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full">
                    <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest animate-pulse">AI Analyzing...</span>
                  </div>
                )}
                {aiStatus === 'complete' && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <span className="text-xs">✨</span>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Auto-Filled</span>
                  </div>
                )}
              </div>

              {/* Photo Upload */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                  Photos ({form.photos.length}/5)
                </label>

                {/* Photo Grid */}
                {form.photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2.5 mb-3">
                    {form.photos.map((url, i) => (
                      <div key={i} className="relative group rounded-xl overflow-hidden aspect-video border border-white/[0.06]">
                        <img
                          src={url}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removePhoto(i)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold shadow-md cursor-pointer"
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {form.photos.length < 5 && (
                  <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-white/[0.08] hover:border-orange-500/60 rounded-xl cursor-pointer hover:bg-white/[0.02] transition-all duration-300">
                    {uploading ? (
                      <span className="text-slate-400 text-sm font-medium animate-pulse">Uploading...</span>
                    ) : (
                      <>
                        <span className="text-2xl mb-1">📷</span>
                        <span className="text-sm font-semibold text-slate-400">
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
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">Title</label>
                <input
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="e.g. IKEA desk lamp"
                  className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:bg-white/[0.04] focus:ring-1 focus:ring-orange-500/20 transition-all duration-300 shadow-inner"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Condition, age, dimensions, anything relevant..."
                  rows={3}
                  className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:bg-white/[0.04] focus:ring-1 focus:ring-orange-500/20 transition-all duration-300 shadow-inner resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c}
                      onClick={() => set('category', c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                        form.category === c
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/10'
                          : 'bg-white/[0.02] border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >{c}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div className="text-lg font-bold text-white mb-1">Pricing & Duration</div>

              <div
                onClick={() => set('is_free', !form.is_free)}
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                  form.is_free
                    ? 'bg-blue-500/10 border-blue-500/25 text-white'
                    : 'bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.02]'
                }`}
              >
                <div>
                  <div className="font-semibold text-sm">List as Freebie</div>
                  <div className="text-xs text-slate-400 mt-0.5">First to claim it gets it free</div>
                </div>
                <div className={`w-10 h-6 rounded-full relative transition-colors duration-200 ${form.is_free ? 'bg-blue-500' : 'bg-white/[0.08]'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ${form.is_free ? 'left-5' : 'left-1'}`} />
                </div>
              </div>

              {!form.is_free && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">Starting Bid Price ($)</label>
                    <input
                      type="number"
                      value={form.starting_price}
                      onChange={e => set('starting_price', e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:bg-white/[0.04] focus:ring-1 focus:ring-orange-500/20 transition-all duration-300 shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">Buy It Now Price (optional)</label>
                    <input
                      type="number"
                      value={form.buy_now_price}
                      onChange={e => set('buy_now_price', e.target.value)}
                      placeholder="Leave blank to skip"
                      className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:bg-white/[0.04] focus:ring-1 focus:ring-orange-500/20 transition-all duration-300 shadow-inner"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">Auction Duration</label>
                <div className="flex gap-3">
                  {DURATIONS.map(d => (
                    <button
                      key={d.label}
                      onClick={() => set('duration', d)}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-200 border cursor-pointer ${
                        form.duration.label === d.label
                          ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >{d.label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div className="text-lg font-bold text-white mb-1">Meetup Preference</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {MEETUP_TYPES.map(m => (
                  <div
                    key={m}
                    onClick={() => set('meetup_type', m)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                      form.meetup_type === m
                        ? 'bg-orange-500/10 border-orange-500/60 text-white'
                        : 'bg-white/[0.015] border-white/[0.04] hover:bg-white/[0.025] hover:border-white/[0.1]'
                    }`}
                  >
                    <span className="text-2xl">
                      {m === 'Porch Pickup' ? '🏠' : m === 'Clubhouse' ? '🏢' : m === 'Parking Lot' ? '🅿️' : m === 'Mailroom' ? '📬' : '👥'}
                    </span>
                    <span className={`text-xs font-bold ${form.meetup_type === m ? 'text-orange-400' : 'text-slate-300'}`}>{m}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 bg-white/[0.01] border border-white/[0.04] rounded-xl p-4">
                <div className="text-sm font-bold mb-3 text-white">Review Summary</div>
                <div className="flex flex-col gap-2.5">
                  {[
                    ['Item Name', form.title],
                    ['Category', form.category],
                    ['Photos', `${form.photos.length} uploaded`],
                    ['Pricing', form.is_free ? 'Freebie' : `$${form.starting_price}`],
                    ['Auction Length', form.duration.label],
                    ['Meetup Preference', form.meetup_type],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-1 text-xs border-b border-white/[0.04] last:border-0">
                      <span className="text-slate-500 font-semibold">{k}</span>
                      <span className="text-slate-200 font-bold">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8 border-t border-white/[0.04] pt-6">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 py-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] text-white rounded-xl font-bold transition-all active:scale-[0.98] cursor-pointer"
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 1 ? !canNext1 : !canNext2}
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-orange-500/25"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 disabled:opacity-40 text-white rounded-xl font-bold transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-orange-500/25"
              >
                {loading ? 'Publishing...' : 'Go Live!'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
