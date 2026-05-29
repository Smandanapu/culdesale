import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export default function PWABadge() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showIOSPrompt, setShowIOSPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIosDevice)

    // Detect if already installed (standalone mode)
    const isStand = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(isStand)

    // Show iOS prompt after a short delay if not standalone
    if (isIosDevice && !isStand) {
      const timer = setTimeout(() => {
        // Only show if they haven't dismissed it this session
        if (!sessionStorage.getItem('ios-pwa-prompt-dismissed')) {
          setShowIOSPrompt(true)
        }
      }, 5000)
      return () => clearTimeout(timer)
    }

    // Android/Chrome install prompt capture
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  const closeRefresh = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  const closeIOSPrompt = () => {
    setShowIOSPrompt(false)
    sessionStorage.setItem('ios-pwa-prompt-dismissed', 'true')
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
      }
    }
  }

  if (isStandalone) return null

  return (
    <>
      {/* Update / Offline Ready Banner */}
      {(offlineReady || needRefresh) && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[9999] bg-white dark:bg-[#151821] border border-slate-200 dark:border-white/[0.08] shadow-2xl rounded-2xl p-4 backdrop-blur-xl animate-fade-in-up">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="text-2xl">{needRefresh ? '✨' : '📱'}</div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  {needRefresh ? 'Update Available' : 'App Ready Offline'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {needRefresh
                    ? 'A new version of CulDeSale is ready to install.'
                    : 'The app has been cached for offline use.'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={closeRefresh}
                className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                Dismiss
              </button>
              {needRefresh && (
                <button
                  onClick={() => updateServiceWorker(true)}
                  className="px-4 py-2 text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-md shadow-orange-500/20 transition-all active:scale-95"
                >
                  Update Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Android/Chrome Install Banner */}
      {deferredPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[9999] bg-white dark:bg-[#151821] border border-slate-200 dark:border-white/[0.08] shadow-2xl rounded-2xl p-4 backdrop-blur-xl animate-fade-in-up">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="text-2xl">📲</div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Install CulDeSale</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Install our app for a faster, full-screen native experience.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeferredPrompt(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                Not Now
              </button>
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 text-sm font-bold bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md shadow-indigo-500/20 transition-all active:scale-95"
              >
                Install App
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Install Prompt Overlay */}
      {showIOSPrompt && (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-fade-in-up pointer-events-none">
          <div className="bg-white/95 dark:bg-[#151821]/95 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-2xl rounded-2xl p-5 relative pointer-events-auto max-w-sm mx-auto flex flex-col items-center text-center">
            <button 
              onClick={closeIOSPrompt}
              className="absolute top-2 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold p-1"
            >
              ×
            </button>
            <img src="/logo.png" alt="CulDeSale" className="w-16 h-16 rounded-2xl shadow-lg mb-3 border border-slate-200 dark:border-white/10" />
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">Install CulDeSale</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 px-2">
              Install this application on your home screen for quick and easy access when you're on the go.
            </p>
            <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-4 w-full text-sm text-slate-700 dark:text-slate-300 font-medium">
              Tap <span className="inline-block mx-1 font-bold text-indigo-500">Share</span> below<br/>
              then select <span className="font-bold">"Add to Home Screen"</span>
            </div>
            <div className="text-3xl text-slate-300 dark:text-slate-600 mt-2 animate-bounce">
              ↓
            </div>
          </div>
        </div>
      )}
    </>
  )
}
