import Navbar from '../components/Navbar'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] bg-grid-pattern text-slate-900 dark:text-slate-100 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none animate-float-slow z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none animate-float-slower z-0" />

      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-16 relative z-10">
        <div className="card-gradient-border bg-white dark:bg-white/[0.015] backdrop-blur-md border border-slate-200 dark:border-white/[0.04] rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="mb-10 text-center">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
              Terms of <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">Service</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Last Updated: May 2026</p>
          </div>

          <div className="prose prose-invert max-w-none prose-h2:text-slate-900 dark:text-white prose-h2:font-bold prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-8 prose-p:text-slate-600 dark:text-slate-300 prose-p:leading-relaxed prose-li:text-slate-600 dark:text-slate-300">
            <p>
              Welcome to CulDeSale. By accessing or using our platform, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our services.
            </p>

            <h2>1. Eligibility & Accounts</h2>
            <p>
              You must be at least 18 years of age to use this platform. By registering, you represent and warrant that you meet this age requirement and that you reside within the designated community or neighborhood boundary intended for this marketplace. You are responsible for maintaining the confidentiality of your account credentials.
            </p>

            <h2>2. User Conduct & Listings</h2>
            <p>
              You agree to use CulDeSale solely for lawful purposes. When posting listings, you must:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-6">
              <li>Provide accurate, truthful descriptions and photos of the items being sold.</li>
              <li>Not list illegal, hazardous, recalled, or heavily restricted items (e.g., firearms, controlled substances).</li>
              <li>Honor the final bid price if an auction concludes successfully.</li>
              <li>Communicate respectfully with all other community members.</li>
            </ul>
            <p>
              We reserve the right to remove any listing or terminate any account that violates these terms, at our sole discretion.
            </p>

            <h2>3. Transactions, Liability, & Disclaimer of Warranties</h2>
            <p>
              <strong>CulDeSale is a completely free, community-run service provided "as-is."</strong> We do not take part in the actual transaction between buyers and sellers. As a result, we have no control over the quality, safety, morality, or legality of any aspect of the items listed.
            </p>
            <p>
              <strong>Zero Liability:</strong> By using CulDeSale, you explicitly agree that the platform, its creators, and administrators bear absolutely no responsibility or liability for any damages, losses, injuries, scams, or disputes that arise from your use of the service. You are choosing to use this service entirely at your own interest and your own risk.
            </p>
            <p>
              We are not responsible for enforcing payments. All payments are to be handled offline via cash, Venmo, or other agreed-upon peer-to-peer methods. 
            </p>
            <p>
              <strong>Assumption of Risk:</strong> You agree that meeting strangers involves inherent risks. We strongly advise conducting transactions in well-lit, public areas (such as a clubhouse, parking lot, or police station safe-zone). You assume all risks associated with dealing with other users.
            </p>

            <h2>4. Dispute Resolution</h2>
            <p>
              In the event of a dispute between you and another user, you release CulDeSale (and our officers, directors, agents, subsidiaries, joint ventures, and employees) from claims, demands, and damages of every kind and nature arising out of or in any way connected with such disputes.
            </p>

            <h2>5. Platform Modifications</h2>
            <p>
              We reserve the right to modify or discontinue, temporarily or permanently, the platform (or any part thereof) with or without notice. We shall not be liable to you or to any third party for any modification, suspension, or discontinuance of the service.
            </p>

            <h2>6. Governing Law</h2>
            <p>
              These Terms shall be governed by and defined following the laws of the local jurisdiction in which the neighborhood is primarily situated, without giving effect to any principles of conflicts of law.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
