import Navbar from '../components/Navbar'

export default function Contact() {
  return (
    <div className="min-h-screen bg-[#07090e] bg-grid-pattern text-slate-100 flex flex-col relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none animate-float-slow z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none animate-float-slower z-0" />
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="card-gradient-border bg-white/[0.015] backdrop-blur-md border border-white/[0.04] rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight mb-4 text-white">Contact Us</h2>
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">For any inquiries, feedback, or support, reach out to us at:</p>
          <a href="mailto:culdesale@geopbytetechnologies.com" className="inline-block w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:opacity-90 transition break-all sm:break-normal">
            culdesale@geopbytetechnologies.com
          </a>
        </div>
      </div>
    </div>
  )
}
