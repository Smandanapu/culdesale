import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏘️</span>
          <span className="text-xl font-bold tracking-tight">CulDeSale</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition"
          >
            Sign in
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition font-medium"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex flex-col items-center text-center px-6 py-24">
        <div className="text-6xl mb-6">🏘️</div>
        <h1 className="text-5xl font-extrabold leading-tight mb-4 max-w-xl">
          Sell to your neighbors.<br />
          <span className="text-orange-500">Not strangers.</span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-md mb-10 leading-relaxed">
          List your household items, let your community bid, and meet at the end of the block. Hyperlocal. Trusted. Free.
        </p>
        <button
          onClick={() => navigate('/register')}
          className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold rounded-xl transition"
        >
          Start Selling Free →
        </button>
        <p className="text-zinc-600 text-sm mt-4">No credit card. Always free.</p>
      </div>

      {/* How It Works */}
      <div className="px-6 py-16 border-t border-zinc-800">
        <h2 className="text-center text-2xl font-bold mb-12">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { icon: "📸", step: "1", title: "List your item", desc: "Take a photo, set a starting price and auction end date. Done in 60 seconds." },
            { icon: "⚡", step: "2", title: "Neighbors bid", desc: "Your community places live bids. Price goes up automatically. No haggling." },
            { icon: "🤝", step: "3", title: "Meet and handoff", desc: "Winner pays via Venmo, you meet at the clubhouse or porch. Simple." },
          ].map(item => (
            <div key={item.step} className="flex flex-col items-center text-center p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
              <div className="text-4xl mb-4">{item.icon}</div>
              <div className="text-xs text-orange-500 font-bold mb-2 tracking-widest">STEP {item.step}</div>
              <h3 className="text-lg font-bold mb-2">{item.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="px-6 py-16 border-t border-zinc-800 bg-zinc-900">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: "🔒", label: "Neighbors only" },
            { icon: "⚡", label: "Live bidding" },
            { icon: "💬", label: "Private chat" },
            { icon: "🎁", label: "Free stuff tab" },
          ].map(f => (
            <div key={f.label} className="flex flex-col items-center gap-2">
              <div className="text-3xl">{f.icon}</div>
              <div className="text-sm text-zinc-400">{f.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 py-24 text-center border-t border-zinc-800">
        <h2 className="text-3xl font-bold mb-4">Ready to clear out your garage?</h2>
        <p className="text-zinc-400 mb-8">Join your neighbors on CulDeSale today.</p>
        <button
          onClick={() => navigate('/register')}
          className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold rounded-xl transition"
        >
          Join Free →
        </button>
      </div>

      {/* Footer */}
      <div className="px-6 py-6 border-t border-zinc-800 text-center text-zinc-600 text-sm">
        © 2025 CulDeSale · Built for neighborhoods
      </div>

    </div>
  )
}