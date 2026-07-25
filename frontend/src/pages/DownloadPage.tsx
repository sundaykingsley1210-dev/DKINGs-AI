import { useState, useEffect } from 'react'
import { FiGlobe, FiSmartphone, FiMonitor, FiDownload, FiExternalLink, FiCheck, FiArrowLeft, FiChrome } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

type Platform = 'web' | 'android' | 'ios' | 'windows' | 'macos' | 'linux'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function DownloadPage() {
  const navigate = useNavigate()
  const [userPlatform, setUserPlatform] = useState<Platform>('web')
  const [canInstall, setCanInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()
    if (/android/.test(ua)) setUserPlatform('android')
    else if (/iphone|ipad/.test(ua)) setUserPlatform('ios')
    else if (/win/.test(ua)) setUserPlatform('windows')
    else if (/mac/.test(ua)) setUserPlatform('macos')
    else if (/linux/.test(ua)) setUserPlatform('linux')

    if (window.matchMedia('(display-mode: standalone)').matches) setIsInstalled(true)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setCanInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setIsInstalled(true)
      setDeferredPrompt(null)
    }
  }

  const platforms = [
    { id: 'web' as Platform, name: 'Web App', icon: FiGlobe, desc: 'Open in your browser — no download needed.', status: 'available', action: 'Open App', features: ['Full AI chat', 'All features', 'Works everywhere'] },
    { id: 'android' as Platform, name: 'Android', icon: FiSmartphone, desc: 'Install as an app from Chrome browser.', status: 'pwa', action: 'Install', features: ['Home screen icon', 'Offline access', 'Camera for Question Solver', 'Push notifications'] },
    { id: 'ios' as Platform, name: 'iPhone & iPad', icon: FiSmartphone, desc: 'Add to Home Screen from Safari.', status: 'pwa', action: 'Add to Home Screen', features: ['Home screen icon', 'Full screen mode', 'Camera access', 'Touch optimized'] },
    { id: 'windows' as Platform, name: 'Windows', icon: FiMonitor, desc: 'Install as a desktop app from Chrome or Edge.', status: 'pwa', action: 'Install App', features: ['Desktop shortcut', 'Windowed mode', 'System tray', 'Keyboard shortcuts'] },
    { id: 'macos' as Platform, name: 'macOS', icon: FiMonitor, desc: 'Install from Safari or Chrome.', status: 'pwa', action: 'Install App', features: ['Dock icon', 'Full screen', 'Touch Bar support', 'System integration'] },
    { id: 'linux' as Platform, name: 'Linux', icon: FiMonitor, desc: 'Install from Chrome or Chromium.', status: 'pwa', action: 'Install App', features: ['Desktop shortcut', 'System integration', 'Lightweight', 'Fast performance'] },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-primary-50 dark:from-surface-900 dark:via-surface-900 dark:to-primary-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 mb-6">
            <FiArrowLeft size={14} />
            Back
          </button>

          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-3xl">DK</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white mb-3">Get DKINGs AI</h1>
          <p className="text-surface-500 dark:text-surface-400 max-w-lg mx-auto">
            Install on any device for the best experience. Works on phones, tablets, and computers.
          </p>
        </div>

        {/* Installed state */}
        {isInstalled && (
          <div className="card bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 mb-8 text-center">
            <FiCheck size={32} className="mx-auto text-green-500 mb-2" />
            <h3 className="font-semibold text-green-700 dark:text-green-400">App Installed!</h3>
            <p className="text-sm text-green-600 dark:text-green-300">DKINGs AI is installed on this device.</p>
          </div>
        )}

        {/* Quick install */}
        {canInstall && !isInstalled && (
          <div className="card bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-950/50 dark:to-purple-950/50 border-primary-200 dark:border-primary-800 mb-8">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center flex-shrink-0">
                <FiDownload size={24} className="text-white" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-semibold text-surface-900 dark:text-white">Quick Install</h3>
                <p className="text-sm text-surface-500">Your browser supports app installation</p>
              </div>
              <button onClick={handleInstall} className="bg-primary-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2">
                <FiDownload size={16} />
                Install Now
              </button>
            </div>
          </div>
        )}

        {/* All platforms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((p) => (
            <div
              key={p.id}
              className={`card hover:shadow-lg transition-all duration-200 ${
                p.id === userPlatform ? 'ring-2 ring-primary-500 border-primary-300 dark:border-primary-700' : ''
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  p.id === userPlatform ? 'bg-primary-500 text-white' : 'bg-surface-100 dark:bg-surface-700 text-surface-500'
                }`}>
                  <p.icon size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-white">{p.name}</h3>
                  {p.id === userPlatform && (
                    <span className="text-xs bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full">Your Device</span>
                  )}
                </div>
              </div>
              <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">{p.desc}</p>
              <ul className="space-y-1.5 mb-4">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-surface-600 dark:text-surface-400">
                    <FiCheck size={12} className="text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  if (p.id === 'web') navigate('/chat')
                  else if (canInstall) handleInstall()
                  else navigate('/chat')
                }}
                className="w-full text-center py-2.5 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-all"
              >
                {p.id === 'web' ? p.action : canInstall ? 'Install' : p.action}
              </button>
            </div>
          ))}
        </div>

        {/* Detailed instructions */}
        <div className="mt-10 card">
          <h3 className="font-bold text-surface-900 dark:text-white mb-4">Installation Guide</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FiSmartphone size={16} className="text-green-500" />
                <h4 className="font-semibold text-surface-700 dark:text-surface-300">Android</h4>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-surface-500">
                <li>Open this page in <strong>Chrome</strong></li>
                <li>Tap the <strong>Install</strong> button above</li>
                <li>Or tap ⋮ menu → "Install app"</li>
                <li>Confirm "Install" on the popup</li>
                <li>Find DKINGs AI on your home screen</li>
              </ol>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FiSmartphone size={16} className="text-blue-500" />
                <h4 className="font-semibold text-surface-700 dark:text-surface-300">iPhone / iPad</h4>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-surface-500">
                <li>Open this page in <strong>Safari</strong></li>
                <li>Tap the <strong>Share</strong> button (□↑)</li>
                <li>Scroll down → "Add to Home Screen"</li>
                <li>Tap "Add" to confirm</li>
                <li>Find DKINGs AI on your home screen</li>
              </ol>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FiMonitor size={16} className="text-purple-500" />
                <h4 className="font-semibold text-surface-700 dark:text-surface-300">Desktop</h4>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-surface-500">
                <li>Open this page in <strong>Chrome/Edge</strong></li>
                <li>Click the <strong>install icon</strong> in address bar</li>
                <li>Or click ⋮ → "Install DKINGs AI"</li>
                <li>App opens in its own window</li>
                <li>Find it in your Start Menu / Applications</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
