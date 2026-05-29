import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [listings, setListings] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEarnings: 0,
    activeCount: 0,
    soldCount: 0,
    totalViews: 0,
    conversionRate: 0,
    averageRating: 0,
  })
  const [categoryStats, setCategoryStats] = useState([])

  const fetchDashboardData = useCallback(async () => {
    if (!user) return
    setLoading(true)

    // 1. Fetch all seller listings
    const { data: listData, error: listError } = await supabase
      .from('listings')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })

    if (listError) {
      console.error('Error fetching listings:', listError)
    }

    // 2. Fetch all reviews received by the seller
    const { data: revData, error: revError } = await supabase
      .from('reviews')
      .select('*, profiles!reviews_reviewer_id_fkey(username)')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })

    if (revError) {
      console.error('Error fetching reviews:', revError)
    }

    const currentListings = listData || []
    const currentReviews = revData || []

    setListings(currentListings)
    setReviews(currentReviews)

    // 3. Compute Stats
    let totalEarnings = 0
    let activeCount = 0
    let soldCount = 0
    let totalViews = 0

    const categoriesMap = {}

    currentListings.forEach(item => {
      totalViews += item.views_count || 0
      
      if (item.status === 'sold') {
        soldCount++
        totalEarnings += item.current_price || 0
      } else if (item.status === 'active' || item.status === 'reserved') {
        activeCount++
      }

      // Track category stats
      if (!categoriesMap[item.category]) {
        categoriesMap[item.category] = { count: 0, sold: 0, earnings: 0 }
      }
      categoriesMap[item.category].count++
      if (item.status === 'sold') {
        categoriesMap[item.category].sold++
        categoriesMap[item.category].earnings += item.current_price || 0
      }
    })

    const totalCount = currentListings.length
    const conversionRate = totalCount > 0 ? ((soldCount / totalCount) * 100).toFixed(0) : 0
    const averageRating = currentReviews.length > 0
      ? (currentReviews.reduce((sum, r) => sum + r.rating, 0) / currentReviews.length).toFixed(1)
      : 0

    setStats({
      totalEarnings: totalEarnings.toFixed(2),
      activeCount,
      soldCount,
      totalViews,
      conversionRate,
      averageRating,
    })

    // Process category stats list
    const processedCategories = Object.keys(categoriesMap).map(cat => ({
      name: cat,
      count: categoriesMap[cat].count,
      sold: categoriesMap[cat].sold,
      earnings: categoriesMap[cat].earnings.toFixed(2),
      percentage: totalCount > 0 ? ((categoriesMap[cat].count / totalCount) * 100).toFixed(0) : 0
    })).sort((a, b) => b.count - a.count)

    setCategoryStats(processedCategories)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] bg-grid-pattern text-slate-900 dark:text-slate-100 relative overflow-hidden pb-12">
      {/* Floating Ambient Glow Orbs */}
      <div className="absolute top-[10%] left-[-15%] w-[600px] h-[600px] rounded-full bg-orange-600/10 blur-[130px] pointer-events-none animate-float-slow z-0" />
      <div className="absolute top-[50%] right-[-15%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none animate-float-slower z-0" />

      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Seller Dashboard
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Track your earnings, listings reach, conversions, and neighborhood reputation.
            </p>
          </div>
          <button
            onClick={() => navigate('/create')}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 text-slate-900 dark:text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/25 active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <span>✨</span> Create New Listing
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-500 dark:text-slate-400 gap-3">
            <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
            <span className="text-sm font-medium tracking-wide">Assembling your analytics...</span>
          </div>
        ) : (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              
              <div className="bg-white dark:bg-white/[0.015] border border-slate-200 dark:border-white/[0.04] rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-orange-500/20 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-xl group-hover:bg-orange-500/10 transition-all pointer-events-none" />
                <div className="text-2xl mb-2">💰</div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Earnings</div>
                <div className="text-2xl font-black text-orange-400 mt-1">${stats.totalEarnings}</div>
              </div>

              <div className="bg-white dark:bg-white/[0.015] border border-slate-200 dark:border-white/[0.04] rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-orange-500/20 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-all pointer-events-none" />
                <div className="text-2xl mb-2">👁️</div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Listing Views</div>
                <div className="text-2xl font-black text-indigo-400 mt-1">{stats.totalViews}</div>
              </div>

              <div className="bg-white dark:bg-white/[0.015] border border-slate-200 dark:border-white/[0.04] rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-orange-500/20 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
                <div className="text-2xl mb-2">📈</div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Conversion Rate</div>
                <div className="text-2xl font-black text-emerald-400 mt-1">{stats.conversionRate}%</div>
              </div>

              <div className="bg-white dark:bg-white/[0.015] border border-slate-200 dark:border-white/[0.04] rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-orange-500/20 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all pointer-events-none" />
                <div className="text-2xl mb-2">⭐</div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reputation</div>
                <div className="text-2xl font-black text-amber-400 mt-1">
                  {stats.averageRating > 0 ? `★ ${stats.averageRating}` : 'N/A'}
                </div>
              </div>

              <div className="bg-white dark:bg-white/[0.015] border border-slate-200 dark:border-white/[0.04] rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-orange-500/20 transition-all duration-300 col-span-2 lg:col-span-1">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all pointer-events-none" />
                <div className="text-2xl mb-2">📦</div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Items</div>
                <div className="text-2xl font-black text-blue-400 mt-1">{stats.activeCount} <span className="text-xs font-normal text-slate-500">/ {listings.length} total</span></div>
              </div>

            </div>

            {/* Visual Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              
              {/* Category Performance */}
              <div className="bg-white dark:bg-white/[0.015] border border-slate-200 dark:border-white/[0.04] rounded-2xl p-6 backdrop-blur-md lg:col-span-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Category Distribution & Sales</h3>
                {categoryStats.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
                    No listing distribution data available.
                  </div>
                ) : (
                  <div className="flex flex-col gap-5">
                    {categoryStats.map(cat => (
                      <div key={cat.name} className="group">
                        <div className="flex justify-between items-center text-sm mb-1.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{cat.name}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {cat.count} listings ({cat.sold} sold) · <strong className="text-orange-400">${cat.earnings}</strong>
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-white/[0.04] h-2.5 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${cat.percentage}%` }}
                            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500 group-hover:brightness-110" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Reviews Feed */}
              <div className="bg-white dark:bg-white/[0.015] border border-slate-200 dark:border-white/[0.04] rounded-2xl p-6 backdrop-blur-md">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Buyer Feedback</h3>
                {reviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 dark:text-slate-400 gap-2">
                    <span className="text-3xl">💬</span>
                    <span className="text-sm font-semibold">No feedback yet</span>
                    <span className="text-xs">Once buyers rate your sold items, comments appear here.</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {reviews.slice(0, 3).map(rev => (
                      <div key={rev.id} className="bg-white dark:bg-white/[0.01] border border-slate-100 dark:border-white/[0.04] rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-slate-400">@{rev.profiles?.username || 'neighbor'}</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <span key={star} className={`text-xs ${star <= rev.rating ? 'text-amber-400' : 'text-slate-600'}`}>★</span>
                            ))}
                          </div>
                        </div>
                        {rev.comment && <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">{rev.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Listings Manager Table */}
            <div className="bg-white dark:bg-white/[0.015] border border-slate-200 dark:border-white/[0.04] rounded-2xl overflow-hidden backdrop-blur-md">
              <div className="px-6 py-5 border-b border-slate-200 dark:border-white/[0.04] flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active & Past Listings</h3>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] px-2.5 py-1 rounded-md">
                  {listings.length} listings listed
                </span>
              </div>

              {listings.length === 0 ? (
                <div className="text-center py-20 text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-3">
                  <span className="text-4xl">📦</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">You haven't listed anything yet</span>
                  <span className="text-xs max-w-xs leading-relaxed">List furniture, electronics, tools, or items in your neighborhood to start seeing analytics.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/[0.04] bg-slate-100/50 dark:bg-white/[0.005] text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">
                        <th className="px-6 py-4">Item Details</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4">Reach</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/[0.03]">
                      {listings.map(item => (
                        <tr key={item.id} className="hover:bg-slate-100/30 dark:hover:bg-white/[0.005] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {item.photos && item.photos[0] ? (
                                <img
                                  src={item.photos[0]}
                                  alt={item.title}
                                  className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-white/[0.06]"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center text-lg">📦</div>
                              )}
                              <div>
                                <div className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">{item.title}</div>
                                <div className="text-[10px] text-indigo-400 font-semibold uppercase mt-0.5">{item.category}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              item.status === 'sold'
                                ? 'bg-zinc-500/10 border border-zinc-500/20 text-zinc-400'
                                : item.status === 'reserved'
                                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-sm text-orange-400">
                              {item.is_free ? 'Free' : `$${item.current_price || item.starting_price}`}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                              <span title="Listing Views">👁️ <strong className="text-slate-700 dark:text-slate-200">{item.views_count || 0}</strong></span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => navigate('/listing/' + item.id)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-all active:scale-95 cursor-pointer border border-slate-200 dark:border-white/[0.06]"
                              >
                                View
                              </button>
                              {item.status !== 'sold' && (
                                <button
                                  onClick={() => navigate('/edit/' + item.id)}
                                  className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 text-slate-900 dark:text-white text-xs font-bold rounded-lg transition-all active:scale-95 cursor-pointer shadow-md shadow-orange-500/15"
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
