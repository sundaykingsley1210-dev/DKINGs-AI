import { useState, useEffect } from 'react'
import { FiGlobe, FiSmartphone, FiMonitor, FiDownload, FiExternalLink, FiCheck, FiArrowLeft } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

type Platform = 'web' | 'android' | 'ios' | 'windows' | 'macos' | 'linux'

interface PlatformInfo {
  id: Platform
  name: string
  icon: any
  description: string
  status: 'available' | 'coming-soon' | 'pwa'
  action: string
  actionUrl: string
  features: string[]
}

const platforms: PlatformInfo[] = [
  {
    id: 'web',
    name: 'Web App',
    icon: FiGlobe,
    description: 'Access directly in your browser on any device.',
    status: 'available',
    action: 'Open App',
    actionUrl: '/chat',
    features: ['Full AI chat', 'Code editor', 'Question solver', 'Project workspace', 'All features'],
  },
  {
    id: 'android',
    name: 'Android',
    icon: FiSmartphone,
    description: 'Install as PWA on your Android phone or tablet.',
    status: 'pwa',
    action: 'Install PWA',
    actionUrl: '#install',
    features: ['Offline access', 'Home screen icon', 'Camera access', 'Push notifications'],
  },
  {
    id: 'ios',
    name: 'iPhone & iPad',
    icon: FiSmartphone,
    description: 'Add to Home Screen from Safari browser.',
    status: 'pwa',
    action: 'Add to Home Screen',
    actionUrl: '#ios-pwa',
    features: ['Home screen icon', 'Full screen mode', 'Camera access', 'Touch optimized'],
  },
  {
    id: 'windows',
    name: 'Windows',
    icon: FiMonitor,
    description: 'Install as a desktop app from your browser.',
    status: 'pwa',
    action: 'Install App',
    actionUrl: '#install',
    features: ['Desktop shortcut', 'Windowed mode', 'System tray', 'Keyboard shortcuts'],
  },
  {
    id: 'macos',
    name: 'macOS',
    icon: FiMonitor,
    description: 'Install from Safari or Chrome as a Progressive Web App.',
    status: 'pwa',
    action: 'Install App',
    actionUrl: '#install',
    features: ['Dock icon', 'Full screen', 'Touch Bar support', 'System integration'],
  },
  {
    id: 'linux',
    name: 'Linux',
    icon: FiMonitor,
    description: 'Install from Chrome or Chromium-based browsers.',
    status: 'pwa',
    action: 'Install App',
    actionUrl: '#install',
    features: ['Desktop shortcut', 'System integration', 'Lightweight', 'Fast performance'],
  },
]

export default function DownloadPage() {
  const navigate = useNavigate()
  const [userPlatform, setUserPlatform] = useState<Platform>('web')
  const [canInstall, setCanInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()
    if (/android/.test(ua)) setUserPlatform('android')
    else if (/iphone|ipad/.test(ua)) setUserPlatform('ios')
    else if (/win/.test(ua)) setUserPlatform('windows')
    else if (/mac/.test(ua)) setUserPlatform('macos')
    else if (/linux/.test(ua)) setUserPlatform('linux')

    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setCanInstall(false)
      }
      setDeferredPrompt(null)
    }
  }

  const recommended = platforms.find((p) => p.id === userPlatform)

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-primary-50 dark:from-surface-900 dark:via-surface-900 dark:to-primary-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 mb-6 transition-colors"
          >
            <FiArrowLeft size={14} />
            Back
          </button>

          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-3xl">DK</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white mb-3">
            Get DKINGs AI
          </h1>
          <p className="text-surface-500 dark:text-surface-400 max-w-lg mx-auto">
            Access Avery AI on any device. Install as an app for the best experience.
          </p>
        </div>

        {/* Recommended for user */}
        {recommended && recommended.id !== 'web' && (
          <div className="card bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-950/50 dark:to-purple-950/50 border-primary-200 dark:border-primary-800 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center flex-shrink-0">
                <recommended.icon size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-surface-900 dark:text-white">
                  Detected: {recommended.name}
                </h3>
                <p className="text-sm text-surface-500">{recommended.description}</p>
              </div>
              {canInstall && recommended.status === 'pwa' ? (
                <button onClick={handleInstall} className="btn-primary flex items-center gap-2">
                  <FiDownload size={16} />
                  Install Now
                </button>
              ) : (
                <button
                  onClick={() => navigate(recommended.actionUrl)}
                  className="btn-primary flex items-center gap-2"
                >
                  <FiExternalLink size={16} />
                  {recommended.action}
                </button>
              )}
            </div>
          </div>
        )}

        {/* All Platforms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className={`card hover:shadow-lg transition-all duration-200 ${
                platform.id === userPlatform
                  ? 'ring-2 ring-primary-500 border-primary-300 dark:border-primary-700'
                  : ''
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  platform.id === userPlatform
                    ? 'bg-primary-500 text-white'
                    : 'bg-surface-100 dark:bg-surface-700 text-surface-500'
                }`}>
                  <platform.icon size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-white">{platform.name}</h3>
                  {platform.id === userPlatform && (
                    <span className="text-xs bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full">
                      Your Device
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
                {platform.description}
              </p>

              <ul className="space-y-1.5 mb-4">
                {platform.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-surface-600 dark:text-surface-400">
                    <FiCheck size={12} className="text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  if (platform.id === 'web') navigate('/chat')
                  else if (platform.status === 'pwa' && canInstall) handleInstall()
                  else navigate('/chat')
                }}
                className={`w-full text-center py-2.5 rounded-lg text-sm font-medium transition-all ${
                  platform.status === 'available'
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : platform.status === 'pwa'
                    ? 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                    : 'bg-surface-100 dark:bg-surface-700 text-surface-400 cursor-not-allowed'
                }`}
              >
                {platform.status === 'available' ? platform.action :
                 platform.status === 'pwa' ? 'Install PWA' : 'Coming Soon'}
              </button>
            </div>
          ))}
        </div>

        {/* PWA Install Instructions */}
        <div className="mt-10 card">
          <h3 className="font-bold text-surface-900 dark:text-white mb-4">
            How to Install as an App
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-surface-700 dark:text-surface-300">Android (Chrome)</h4>
              <ol className="list-decimal list-inside space-y-1 text-surface-500">
                <li>Open DKINGs AI in Chrome</li>
                <li>Tap the menu (3 dots)</li>
                <li>Tap "Install app" or "Add to Home screen"</li>
                <li>Confirm installation</li>
              </ol>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-surface-700 dark:text-surface-300">iPhone (Safari)</h4>
              <ol className="list-decimal list-inside space-y-1 text-surface-500">
                <li>Open DKINGs AI in Safari</li>
                <li>Tap the Share button</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" to confirm</li>
              </ol>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-surface-700 dark:text-surface-300">Desktop (Chrome)</h4>
              <ol className="list-decimal list-inside space-y-1 text-surface-500">
                <li>Open DKINGs AI in Chrome</li>
                <li>Click the install icon in the address bar</li>
                <li>Click "Install"</li>
                <li>The app will open in its own window</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
