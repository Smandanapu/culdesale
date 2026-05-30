import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'

const CATEGORIES = ['Furniture', 'Electronics', 'Sports', 'Kids', 'Tools', 'Appliances', 'Clothing', 'Books', 'Other']

export default function CreateWanted() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Furniture',
    budget: '',
    zip_code: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.description || !form.zip_code) {
      toast.error('Please fill in title, description, and zip code')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bounties')
        .insert({
          buyer_id: user.id,
          title: form.title,
          description: form.description,
          category: form.category,
          budget: form.budget ? parseFloat(form.budget) : null,
          zip_code: form.zip_code
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Wanted request posted!')
      navigate('/wanted/' + data.id)
    } catch (err) {
      console.error(err)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] text-slate-900 dark:text-slate-100">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          ← Back
        </button>

        <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🎯</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Post a Request</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
            Tell your neighbors what you are looking for and how much you are willing to pay.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">What are you looking for? *</label>
              <input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Mid-Century Modern Dining Table"
                className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Description / Requirements *</label>
                <span className={`text-[10px] font-bold tracking-wide ${form.description.length > 450 ? 'text-rose-400' : 'text-slate-500'}`}>
                  {form.description.length}/500
                </span>
              </div>
              <textarea
                value={form.description}
                onChange={e => { if (e.target.value.length <= 500) setForm({ ...form, description: e.target.value }) }}
                placeholder="Must be solid wood, max 72 inches long. Minor scratches are fine!"
                rows={4}
                className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">Category *</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">Budget ($) - Optional</label>
                <input
                  type="number"
                  value={form.budget}
                  onChange={e => setForm({ ...form, budget: e.target.value })}
                  placeholder="e.g. 150"
                  className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">Your ZIP Code *</label>
              <input
                type="text"
                pattern="[0-9]*"
                value={form.zip_code}
                onChange={e => {
                  const clean = e.target.value.replace(/\D/g, '').slice(0, 5)
                  setForm({ ...form, zip_code: clean })
                }}
                placeholder="e.g. 90210"
                className="w-full sm:w-1/2 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20"
              />
            </div>

            <div className="pt-4 mt-2 border-t border-slate-200 dark:border-white/[0.06]">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 text-slate-900 dark:text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-500/25 active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Posting...' : 'Post Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
