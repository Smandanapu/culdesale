import Navbar from '../components/Navbar'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#07090e] bg-grid-pattern text-slate-100 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none animate-float-slow z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none animate-float-slower z-0" />

      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-16 relative z-10">
        <div className="card-gradient-border bg-white/[0.015] backdrop-blur-md border border-white/[0.04] rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="mb-10 text-center">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
              Privacy <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">Policy</span>
            </h1>
            <p className="text-slate-400 text-sm">Last Updated: May 2026</p>
          </div>

          <div className="prose prose-invert max-w-none prose-h2:text-white prose-h2:font-bold prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-8 prose-p:text-slate-300 prose-p:leading-relaxed prose-li:text-slate-300">
            <p>
              At CulDeSale, your privacy is our priority. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our application.
            </p>

            <h2>1. Information We Collect</h2>
            <p>
              We collect information that you provide directly to us when you register for an account, update your profile, create a listing, or communicate with other users. This may include:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-6">
              <li><strong>Personal Data:</strong> Email address, username, and authentication credentials.</li>
              <li><strong>User Content:</strong> Photos, item descriptions, messages sent through our platform, and bidding history.</li>
              <li><strong>Location Data:</strong> General neighborhood or sector information used to facilitate local meetups.</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>
              We use the information we collect primarily to provide, maintain, and improve our services. Specifically, we use your information to:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-6">
              <li>Facilitate the creation of and secure your account.</li>
              <li>Enable user-to-user communications and listing interactions.</li>
              <li>Send administrative information, such as security alerts or updates to our terms.</li>
              <li>Monitor and analyze usage and trends to improve user experience.</li>
            </ul>

            <h2>3. Information Sharing and Disclosure</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. However, your username, general sector, and listing details will be publicly visible to other verified neighbors on the platform to facilitate the marketplace experience.
            </p>
            <p>
              We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or a government agency).
            </p>

            <h2>4. Payment Information</h2>
            <p>
              CulDeSale does not process, store, or transmit any payment information. All transactions (e.g., cash, Venmo, Zelle) are handled offline and directly between the buyer and the seller. We bear no liability for payment disputes.
            </p>

            <h2>5. Data Security</h2>
            <p>
              We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.
            </p>

            <h2>6. Contact Us</h2>
            <p>
              If you have questions or comments about this Privacy Policy, please contact our support team or designated neighborhood administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
