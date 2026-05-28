import { useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

const initialBids = [
  { id: 1, name: "Sophia K.", sector: "Oak St", amount: 45, time: "2m ago", avatar: "S", color: "bg-indigo-500" },
  { id: 2, name: "Marcus Y.", sector: "Pine Rd", amount: 40, time: "5m ago", avatar: "M", color: "bg-amber-500" },
  { id: 3, name: "Emma G.", sector: "Clubhouse", amount: 35, time: "8m ago", avatar: "E", color: "bg-emerald-500" },
]

const potentialBidders = [
  { name: "Liam W.", sector: "Maple Ave", increment: 5, avatar: "L", color: "bg-sky-500" },
  { name: "Olivia P.", sector: "Oak St", increment: 5, avatar: "O", color: "bg-purple-500" },
  { name: "Noah D.", sector: "Hillside", increment: 10, avatar: "N", color: "bg-pink-500" },
  { name: "Ava T.", sector: "Clubhouse", increment: 5, avatar: "A", color: "bg-rose-500" },
  { name: "Ethan R.", sector: "Pine Rd", increment: 5, avatar: "E", color: "bg-teal-500" },
]

const demoItems = [
  { image: "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=600&q=80", title: "1970s Vintage Rangefinder", seller: "Jane D.", start: "$10.00" },
  { image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80", title: "Mid-Century Modern Sofa", seller: "Tom R.", start: "$75.00" },
  { image: "https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&w=600&q=80", title: "Mountain Bike — 21 Speed", seller: "Carlos M.", start: "$40.00" },
  { image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=600&q=80", title: "PS5 Controller Bundle", seller: "Priya S.", start: "$25.00" },
  { image: "https://images.unsplash.com/photo-1564466809058-bf4114d55352?auto=format&fit=crop&w=600&q=80", title: "Vintage Record Player", seller: "Mike L.", start: "$30.00" },
]

export default function Landing() {
  const navigate = useNavigate()
  
  const [bids, setBids] = useState(initialBids)
  const [currentBid, setCurrentBid] = useState(45)
  const [secondsLeft, setSecondsLeft] = useState(8085)
  const [flashType, setFlashType] = useState(null)
  const [bidTrigger, setBidTrigger] = useState(false)
  const [demoIndex, setDemoIndex] = useState(0)
  const [demoFade, setDemoFade] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) return 86399
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Rotate demo items every 10 seconds
  useEffect(() => {
    const rotator = setInterval(() => {
      setDemoFade(false)
      setTimeout(() => {
        setDemoIndex(prev => (prev + 1) % demoItems.length)
        setDemoFade(true)
      }, 400)
    }, 10000)
    return () => clearInterval(rotator)
  }, [])

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.4 && flashType !== 'user') {
        placeMockBid()
      }
    }, 8000)
    return () => clearInterval(interval)
  }, [currentBid, flashType])

  const placeMockBid = () => {
    const bidder = potentialBidders[Math.floor(Math.random() * potentialBidders.length)]
    const newAmount = currentBid + bidder.increment
    setCurrentBid(newAmount)
    setBids((prev) => [
      {
        id: Date.now(),
        name: bidder.name,
        sector: bidder.sector,
        amount: newAmount,
        time: "Just now",
        avatar: bidder.avatar,
        color: bidder.color,
      },
      ...prev.slice(0, 2),
    ])
    setFlashType('neighbor')
    setBidTrigger(true)
    setTimeout(() => {
      setFlashType(null)
      setBidTrigger(false)
    }, 1200)
  }

  const handleUserBid = () => {
    const newAmount = currentBid + 5
    setCurrentBid(newAmount)
    setBids((prev) => [
      {
        id: Date.now(),
        name: "You",
        sector: "Your Curb",
        amount: newAmount,
        time: "Just now",
        avatar: "Y",
        color: "bg-emerald-500",
      },
      ...prev.slice(0, 2),
    ])
    setFlashType('user')
    setBidTrigger(true)
    setTimeout(() => {
      setFlashType(null)
      setBidTrigger(false)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 overflow-x-hidden relative font-sans">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[550px] h-[550px] rounded-full bg-orange-500/[0.07] blur-[120px] animate-float-slow" />
        <div className="absolute top-[25%] -right-[15%] w-[600px] h-[600px] rounded-full bg-indigo-500/[0.07] blur-[130px] animate-float-slower" />
        <div className="absolute bottom-[10%] -left-[15%] w-[500px] h-[500px] rounded-full bg-amber-500/[0.05] blur-[110px] animate-float-slow" />
      </div>

      <div className="absolute top-0 left-0 right-0 h-[750px] bg-grid-pattern opacity-40 pointer-events-none z-0" />

      <nav className="sticky top-0 z-50 bg-[#07090e]/75 backdrop-blur-md border-b border-white/[0.06] px-6 py-4 flex items-center justify-between relative">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
          <span className="text-2xl transform group-hover:scale-110 transition duration-300">🏘️</span>
          <span className="text-xl font-bold tracking-tight animate-text-shimmer bg-gradient-to-r from-orange-400 via-rose-400 to-indigo-400 bg-clip-text text-transparent">
            CulDeSale
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <a href="#safety" className="hidden sm:block px-4 py-2 text-sm text-slate-400 hover:text-white transition duration-200 font-medium cursor-pointer">Safety</a>
          <button onClick={() => navigate('/login')} className="px-3 sm:px-4 py-2 text-sm text-slate-400 hover:text-white transition duration-200 font-medium cursor-pointer">Sign in</button>
          <button onClick={() => navigate('/register')} className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl transition duration-300 font-semibold shadow-md shadow-orange-500/10 hover:shadow-lg hover:shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer">Get Started</button>
        </div>
      </nav>

      {/* Live Activity Marquee Ticker */}
      <div className="relative z-40 border-b border-white/[0.04] bg-[#07090e]/50 backdrop-blur-sm py-3.5 overflow-hidden w-full select-none">
        <div className="flex animate-marquee gap-16 whitespace-nowrap">
          {/* First loop of items */}
          <div className="flex gap-16 text-xs text-slate-400 font-semibold tracking-wide shrink-0">
            <span>🛋️ Velvet Sectional sold for $180 in Sector B-3</span>
            <span className="text-white/[0.1]">·</span>
            <span>🚲 Specialized Cruiser Bike has 4 active bids in Sector C</span>
            <span className="text-white/[0.1]">·</span>
            <span>📦 Tool Set claimed for Free in Oak Ridge</span>
            <span className="text-white/[0.1]">·</span>
            <span>🎸 Fender Stratocaster has 9 active bids in Sector A-2</span>
            <span className="text-white/[0.1]">·</span>
            <span>🪑 Oak Dining Table sold for $95 in Sector D</span>
            <span className="text-white/[0.1]">·</span>
            <span>💻 4K Ultra Monitor sold for $140 in Sector B-12</span>
            <span className="text-white/[0.1]">·</span>
            <span>🧸 Kids Play Kitchen claimed for Free on Elm St</span>
          </div>
          {/* Second loop of items to ensure seamless animation */}
          <div className="flex gap-16 text-xs text-slate-400 font-semibold tracking-wide shrink-0" aria-hidden="true">
            <span>🛋️ Velvet Sectional sold for $180 in Sector B-3</span>
            <span className="text-white/[0.1]">·</span>
            <span>🚲 Specialized Cruiser Bike has 4 active bids in Sector C</span>
            <span className="text-white/[0.1]">·</span>
            <span>📦 Tool Set claimed for Free in Oak Ridge</span>
            <span className="text-white/[0.1]">·</span>
            <span>🎸 Fender Stratocaster has 9 active bids in Sector A-2</span>
            <span className="text-white/[0.1]">·</span>
            <span>🪑 Oak Dining Table sold for $95 in Sector D</span>
            <span className="text-white/[0.1]">·</span>
            <span>💻 4K Ultra Monitor sold for $140 in Sector B-12</span>
            <span className="text-white/[0.1]">·</span>
            <span>🧸 Kids Play Kitchen claimed for Free on Elm St</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-6 py-24 md:py-32 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-bold tracking-wider text-orange-400 uppercase mb-8 hover:bg-orange-500/15 transition duration-300">
              ⚡ The 24/7 Neighborhood Marketplace
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 text-white">
              The neighborhood <br className="hidden md:inline" /> garage sale.<br />
              <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-rose-500 bg-clip-text text-transparent drop-shadow-sm">
                Available 24/7.
              </span>
            </h1>
            <p className="text-slate-400 text-base md:text-lg max-w-xl mb-10 leading-relaxed font-normal">
              No shipping, no hassles, just fast local buyers. List your household items, let your community bid, and meet at the end of the block.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <button onClick={() => navigate('/register')} className="w-full sm:w-auto px-8 py-4.5 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white text-lg font-bold rounded-2xl shadow-xl shadow-orange-500/15 hover:shadow-2xl hover:shadow-orange-500/30 hover:scale-[1.03] active:scale-[0.98] transition duration-300 cursor-pointer text-center">Start Selling Free →</button>
              <button onClick={() => navigate('/login')} className="w-full sm:w-auto px-8 py-4.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-white text-lg font-bold rounded-2xl transition duration-300 text-center cursor-pointer">Browse Feed</button>
            </div>
            <p className="text-slate-500 text-xs font-semibold tracking-wide flex items-center gap-2 mt-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              No credit card required · Always free for neighbors
            </p>
          </div>
          <div className="lg:col-span-5 w-full max-w-md mx-auto relative z-20">
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 to-indigo-500/5 blur-3xl -z-10 rounded-3xl" />
            <div className={`relative rounded-3xl backdrop-blur-xl border p-3 sm:p-6 transition-all duration-300 shadow-2xl ${
              flashType === 'user' ? 'border-emerald-500/40 bg-emerald-950/[0.03] shadow-emerald-500/10 scale-[1.01]' 
              : flashType === 'neighbor' ? 'border-orange-500/40 bg-orange-950/[0.02] shadow-orange-500/10 scale-[1.01]' 
              : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.12]'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  </span>
                  <span className="text-xs font-extrabold tracking-wider text-rose-400 uppercase">Live Auction</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] font-bold text-slate-400">📍 Sector B-12</span>
              </div>
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] mb-4 bg-zinc-900 border border-white/[0.06]">
                <img src={demoItems[demoIndex].image} alt={demoItems[demoIndex].title} className={`w-full h-full object-cover hover:scale-105 transition-all duration-500 ${demoFade ? 'opacity-90' : 'opacity-0'}`} />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#07090e]/85 backdrop-blur-md border border-white/[0.08]">
                  <div>
                    <h4 className={`text-xs font-bold text-white leading-tight transition-opacity duration-300 ${demoFade ? 'opacity-100' : 'opacity-0'}`}>{demoItems[demoIndex].title}</h4>
                    <p className={`text-[10px] text-slate-400 leading-tight transition-opacity duration-300 ${demoFade ? 'opacity-100' : 'opacity-0'}`}>Offered by neighbor {demoItems[demoIndex].seller}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Start</p>
                    <p className={`text-xs font-bold text-slate-300 transition-opacity duration-300 ${demoFade ? 'opacity-100' : 'opacity-0'}`}>{demoItems[demoIndex].start}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] mb-5">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Current Bid</p>
                  <div className={`text-3xl font-extrabold leading-none transition-all duration-300 ${flashType === 'user' ? 'text-emerald-400' : flashType === 'neighbor' ? 'text-orange-400' : 'text-white'}`}>${currentBid}.00</div>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Ends In</p>
                  <div className="text-xl font-extrabold text-amber-400 font-mono tracking-tight mt-0.5">{formatTime(secondsLeft)}</div>
                </div>
              </div>
              <div className="mb-5">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Active Bidding History</p>
                <div className="space-y-2 max-h-[140px] overflow-hidden">
                  {bids.map((bid, i) => (
                    <div key={bid.id} className={`flex items-center justify-between p-2 rounded-xl border transition-all duration-300 ${i === 0 ? bid.name === 'You' ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-orange-950/15 border-orange-500/20' : 'bg-white/[0.01] border-white/[0.04]'} ${i === 0 && bidTrigger ? 'scale-[1.01]' : ''}`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${bid.color}`}>{bid.avatar}</div>
                        <div>
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            {bid.name}
                            {bid.name === 'You' && <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1 py-0.5 rounded font-extrabold uppercase">High Bid</span>}
                          </p>
                          <p className="text-[9px] text-slate-500">{bid.sector}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-extrabold ${i === 0 ? 'text-white' : 'text-slate-400'}`}>${bid.amount}.00</p>
                        <p className="text-[9px] text-slate-500">{bid.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={handleUserBid} className="w-full py-3.5 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold rounded-2xl shadow-lg shadow-orange-500/10 hover:shadow-xl hover:shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 group text-sm">
                <span>Place Quick Bid (+$5)</span>
                <span className="text-xs px-2 py-0.5 rounded-lg bg-white/20 font-bold group-hover:scale-105 transition-transform duration-200">${currentBid + 5}</span>
              </button>
              <p className="text-[10px] text-center text-slate-500 font-semibold mt-2.5">👋 Try it! Place a demo bid and watch neighbors respond.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-24 border-t border-white/[0.06] relative z-10 max-w-6xl mx-auto">
        <h2 className="text-center text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
          Simple in <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">3 Easy Steps</span>
        </h2>
        <p className="text-center text-slate-400 text-sm md:text-base max-w-md mx-auto mb-16">
          CulDeSale makes buying and selling within your neighborhood automated and hassle-free.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { icon: "📸", step: "01", title: "List your item", desc: "Take a photo, set a starting price and auction end date. Done in under 60 seconds." },
            { icon: "⚡", step: "02", title: "Neighbors bid", desc: "Your community places live bids. The price rises automatically. No haggling or lowballs." },
            { icon: "🤝", step: "03", title: "Meet and handoff", desc: "Winner pays instantly via Venmo or Cash. Meet at the curb, porch, or clubhouse. Safe and simple." },
          ].map(item => (
            <div 
              key={item.step} 
              className="card-gradient-border group relative flex flex-col items-center text-center p-8 rounded-3xl bg-white/[0.012] backdrop-blur-md transition-all duration-300 hover:bg-white/[0.03] hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-500/5 cursor-default"
            >
              <div className="absolute top-8 w-16 h-16 rounded-full bg-orange-500/0 group-hover:bg-orange-500/10 blur-xl transition-all duration-500" />
              <div className="text-5xl mb-6 relative z-10 transform group-hover:scale-110 duration-300">{item.icon}</div>
              <div className="text-xs text-orange-400 font-extrabold mb-3 tracking-widest uppercase relative z-10">STEP {item.step}</div>
              <h3 className="text-xl font-bold mb-2 text-white relative z-10">{item.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed relative z-10">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 py-20 border-t border-b border-white/[0.06] bg-white/[0.01] backdrop-blur-md relative z-10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
          {[
            { icon: "🔒", label: "Neighbors Only", desc: "Verified local community" },
            { icon: "⚡", label: "Live Bidding", desc: "True automatic value" },
            { icon: "💬", label: "Private Chat", desc: "Secure direct messaging" },
            { icon: "🎁", label: "Free Stuff Tab", desc: "Declutter and give back" },
          ].map(f => (
            <div key={f.label} className="flex flex-col items-center gap-1 sm:gap-2 group cursor-default">
              <div className="text-3xl sm:text-4xl mb-1 sm:mb-2 transform group-hover:scale-115 transition duration-300">{f.icon}</div>
              <div className="text-sm sm:text-base font-bold text-white tracking-tight">{f.label}</div>
              <div className="text-[10px] sm:text-xs text-slate-500 font-medium">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div id="safety" className="px-6 py-24 border-b border-white/[0.06] relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold tracking-wider text-emerald-400 uppercase mb-4">
            🛡️ Trust & Safety
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-white">
            Your Safety is our <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Top Priority</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
            CulDeSale is built exclusively for neighbors. We maintain a secure environment by following these core principles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: "🚫", title: "No Online Payments", desc: "We never ask for credit cards or process payments in-app. All transactions are handled in-person via cash or Venmo to eliminate digital payment scams." },
            { icon: "🕵️", title: "Scam Due Diligence", desc: "Always verify the item in person before handing over money. If a deal seems too good to be true, or a buyer asks to ship an item, report them immediately." },
            { icon: "📍", title: "Public Meetups", desc: "Always arrange meetups in well-lit, crowded public places like the community clubhouse, local coffee shops, or designated safe exchange zones at police stations." },
            { icon: "⚖️", title: "Legal & Liability", desc: "Users must be 18+ and reside in the local community. By using CulDeSale, you agree to our Terms of Service. Report suspicious behavior to local authorities." }
          ].map((item, i) => (
            <div key={i} className="card-gradient-border group relative flex flex-col p-6 rounded-3xl bg-white/[0.015] backdrop-blur-md transition-all duration-300 hover:bg-white/[0.03] hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="text-3xl mb-4 relative z-10">{item.icon}</div>
              <h3 className="text-lg font-bold mb-2 text-white relative z-10">{item.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed relative z-10">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 py-24 text-center relative z-10 max-w-4xl mx-auto overflow-hidden rounded-3xl my-16 border border-white/[0.06] bg-white/[0.01] backdrop-blur-sm shadow-2xl">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-orange-500/5 blur-[80px] pointer-events-none" />
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 relative z-10">
          Ready to clear out your <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">garage?</span>
        </h2>
        <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto mb-10 relative z-10">
          Join your neighborhood on CulDeSale today. Start decluttering and bidding.
        </p>
        <button onClick={() => navigate('/register')} className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-lg font-bold rounded-2xl shadow-lg shadow-orange-500/10 hover:shadow-xl hover:shadow-orange-500/25 hover:scale-[1.03] active:scale-[0.98] transition duration-300 relative z-10 cursor-pointer">Join Free →</button>
      </div>

      <div className="px-6 py-8 border-t border-white/[0.04] relative z-10 flex flex-col md:flex-row items-center justify-between max-w-6xl mx-auto gap-4 text-slate-500 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏘️</span>
          <span className="font-semibold text-white tracking-tight">CulDeSale</span>
        </div>
        <div>© 2026 CulDeSale · Built for connected neighborhoods</div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-medium">
          <Link to="/privacy" className="hover:text-white transition duration-200">Privacy Policy</Link>
          <span className="hidden sm:inline">·</span>
          <Link to="/terms" className="hover:text-white transition duration-200">Terms of Service</Link>
          <span className="hidden sm:inline">·</span>
          <Link to="/contact" className="hover:text-white transition duration-200">Contact</Link>
        </div>
      </div>
    </div>
  )
}