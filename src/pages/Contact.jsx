import { Link } from 'react-router-dom'

export default function Contact() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex items-center justify-center">
      <div className="bg-white/[0.02] backdrop-blur-md border border-white/[0.06] rounded-2xl p-8 max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4 text-white">Contact Us</h2>
        <p className="text-slate-300 mb-2">For any inquiries, feedback, or support, reach out to us at:</p>
        <a href="mailto:culdesale@geopbytetechnologies.com" className="text-orange-400 hover:underline text-lg font-medium">
          culdesale@geopbytetechnologies.com
        </a>
      </div>
    </div>
  )
}
