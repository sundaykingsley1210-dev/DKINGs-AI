import { useState, useEffect } from 'react'
import { FiX, FiDownload, FiSmartphone, FiMonitor, FiExternalLink } from 'react-icons/fi'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Platform = 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'unknown'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [platform, setPlatform] = useState<Platform>('unknown')
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Detect platform
    const ua = navigator.userAgent.toLowerCase()
    if (/android/.test(ua)) setPlatform('android')
    else if (/iphone|ipad/.test(ua)) setPlatform('ios')
    else if (/win/.test(ua)) setPlatform('windows')
    else if (/mac/.test(ua)) setPlatform('macos')
    else if (/linux/.test(ua)) setPlatform('linux')

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if dismissed recently
    const dismissed = localStorage.getItem('dkings-install-dismissed')
    if (dismissed) {
      const daysSinceDismiss = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismiss < 7) return // Don't show again for 7 days
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Show banner after 3 seconds
      setTimeout(() => setShowBanner(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setShowModal(true)
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('dkings-install-dismissed', Date.now().toString())
  }

  if (isInstalled) return null

  const platformIcons: Record<Platform, typeof FiDownload> = {
    android: FiSmartphone,
    ios: FiSmartphone,
    windows: FiMonitor,
    macos: FiMonitor,
    linux: FiMonitor,
    unknown: FiDownload,
  }

  const platformLabels: Record<Platform, string> = {
    android: 'Install on Android',
    ios: 'Add to Home Screen',
    windows: 'Install on Windows',
    macos: 'Install on macOS',
    linux: 'Install on Linux',
    unknown: 'Install App',
  }

  const PlatformIcon = platformIcons[platform]

  return (
    <>
      {/* Bottom install banner */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 safe-bottom animate-slide-up">
          <div className="max-w-lg mx-auto bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl p-4 shadow-2xl border border-primary-400/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">DK</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm">Install DKINGs AI</h3>
                <p className="text-white/70 text-xs">Add to home screen for the best experience</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleInstall}
                  className="bg-white text-primary-600 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-white/90 transition-colors flex items-center gap-1.5"
                >
                  <FiDownload size={14} />
                  Install
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-white/60 hover:text-white p-1.5"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Install Modal with platform-specific instructions */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-md overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-primary-500 to-purple-500 p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">DK</span>
              </div>
              <h2 className="text-xl font-bold text-white">Install DKINGs AI</h2>
              <p className="text-white/80 text-sm mt-1">Access AI anywhere, even offline</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Android */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-700/50">
                <FiSmartphone size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm text-surface-900 dark:text-white">Android (Chrome)</h4>
                  <ol className="text-xs text-surface-500 mt-1 space-y-0.5 list-decimal list-inside">
                    <li>Tap the <strong>Install</strong> button above, or</li>
                    <li>Tap the 3-dot menu in Chrome</li>
                    <li>Tap "Install app" or "Add to Home screen"</li>
                  </ol>
                </div>
              </div>

              {/* iPhone */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-700/50">
                <FiSmartphone size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm text-surface-900 dark:text-white">iPhone & iPad (Safari)</h4>
                  <ol className="text-xs text-surface-500 mt-1 space-y-0.5 list-decimal list-inside">
                    <li>Tap the <strong>Share</strong> button (square with arrow)</li>
                    <li>Scroll down and tap "Add to Home Screen"</li>
                    <li>Tap "Add" to confirm</li>
                  </ol>
                </div>
              </div>

              {/* Desktop */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-700/50">
                <FiMonitor size={20} className="text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm text-surface-900 dark:text-white">Desktop (Chrome/Edge)</h4>
                  <ol className="text-xs text-surface-500 mt-1 space-y-0.5 list-decimal list-inside">
                    <li>Click the <strong>install icon</strong> in the address bar, or</li>
                    <li>Click the 3-dot menu → "Install DKINGs AI"</li>
                    <li>The app will open in its own window</li>
                  </ol>
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-primary-50 dark:bg-primary-950/30 rounded-xl p-3">
                <h4 className="font-semibold text-sm text-primary-700 dark:text-primary-400 mb-1">Why Install?</h4>
                <ul className="text-xs text-primary-600 dark:text-primary-300 space-y-0.5">
                  <li>Launch from your home screen</li>
                  <li>Full-screen app experience</li>
                  <li>Offline access to conversations</li>
                  <li>Camera access for Question Solver</li>
                  <li>Faster loading with caching</li>
                </ul>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => { handleInstall(); setShowModal(false) }}
                className="flex-1 bg-primary-600 text-white font-semibold py-3 rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <FiDownload size={16} />
                Install Now
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-3 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 font-medium"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
