import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiGlobe, FiSmartphone, FiMonitor, FiDownload, FiCheck, FiArrowLeft,
  FiX, FiShare, FiMoreVertical,
} from 'react-icons/fi'
import { useInstall } from '@/hooks/useInstall'

export default function DownloadPage() {
  const navigate = useNavigate()
  const { canInstall, isInstalled, isInstalling, platform, isIOS, isAndroid, isDesktop, install } = useInstall()
  const [showInstructions, setShowInstructions] = useState<string | null>(null)
  const [installSuccess, setInstallSuccess] = useState(false)

  const handleInstall = async () => {
    const success = await install()
    if (success) {
      setInstallSuccess(true)
      setTimeout(() => setInstallSuccess(false), 5000)
    } else if (isIOS) {
      setShowInstructions('ios')
    } else {
      setShowInstructions(platform)
    }
  }

  const platforms = [
    {
      id: 'android',
      name: 'Android',
      icon: FiSmartphone,
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      recommended: isAndroid,
      installable: canInstall,
      features: ['Home screen icon', 'Offline access', 'Camera for Question Solver', 'Push notifications'],
      installLabel: canInstall ? 'Install Now' : 'How to Install',
    },
    {
      id: 'ios',
      name: 'iPhone & iPad',
      icon: FiSmartphone,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      recommended: isIOS,
      installable: false, // iOS doesn't support beforeinstallprompt
      features: ['Home screen icon', 'Full screen mode', 'Camera access', 'Touch optimized'],
      installLabel: 'Add to Home Screen',
    },
    {
      id: 'desktop',
      name: 'Desktop',
      icon: FiMonitor,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      recommended: isDesktop && (platform === 'windows' || platform === 'macos' || platform === 'linux'),
      installable: canInstall,
      features: ['Desktop shortcut', 'Windowed mode', 'System tray', 'Keyboard shortcuts'],
      installLabel: canInstall ? 'Install App' : 'How to Install',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-primary-50 dark:from-surface-900 dark:via-surface-900 dark:to-primary-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">

        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 mb-6"
          >
            <FiArrowLeft size={14} /> Back
          </button>

          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-3xl">DK</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white mb-3">
            Install DKINGs AI
          </h1>
          <p className="text-surface-500 dark:text-surface-400 max-w-lg mx-auto">
            Add to your device for the best experience. Free, fast, and works offline.
          </p>
        </div>

        {/* Already installed */}
        {isInstalled && (
          <div className="card bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 mb-8 text-center">
            <FiCheck size={32} className="mx-auto text-green-500 mb-2" />
            <h3 className="font-semibold text-green-700 dark:text-green-400">DKINGs AI is Installed!</h3>
            <p className="text-sm text-green-600 dark:text-green-300 mt-1">The app is on your device. Open it from your home screen.</p>
          </div>
        )}

        {/* Install success */}
        {installSuccess && (
          <div className="card bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 mb-8 text-center animate-fade-in">
            <FiCheck size={32} className="mx-auto text-green-500 mb-2" />
            <h3 className="font-semibold text-green-700 dark:text-green-400">Installation Started!</h3>
            <p className="text-sm text-green-600 dark:text-green-300 mt-1">Check your home screen for the DKINGs AI app.</p>
          </div>
        )}

        {/* Quick install button (if available) */}
        {canInstall && !isInstalled && (
          <div className="card bg-gradient-to-r from-primary-500 to-purple-500 text-white mb-8 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <FiDownload size={28} />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-bold text-lg">Quick Install</h3>
                <p className="text-white/80 text-sm">Install DKINGs AI on this device with one tap</p>
              </div>
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="bg-white text-primary-600 font-bold px-8 py-3.5 rounded-xl hover:bg-white/90 transition-all flex items-center gap-2 text-base disabled:opacity-50"
              >
                {isInstalling ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
                    Installing...
                  </>
                ) : (
                  <>
                    <FiDownload size={18} />
                    Install Now
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Platform cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {platforms.map((p) => (
            <div
              key={p.id}
              className={`card hover:shadow-lg transition-all duration-200 relative ${
                p.recommended ? 'ring-2 ring-primary-500 border-primary-300 dark:border-primary-700' : ''
              }`}
            >
              {p.recommended && (
                <div className="absolute -top-3 left-4 bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Recommended for Your Device
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${p.bgColor}`}>
                  <p.icon size={24} className={p.color} />
                </div>
                <div>
                  <h3 className="font-bold text-surface-900 dark:text-white">{p.name}</h3>
                  {p.recommended && (
                    <span className="text-xs text-primary-500 font-medium">Detected</span>
                  )}
                </div>
              </div>

              <ul className="space-y-2 mb-5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                    <FiCheck size={14} className="text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  if (p.id === 'android' && canInstall) handleInstall()
                  else if (p.id === 'ios') setShowInstructions('ios')
                  else if (p.id === 'desktop' && canInstall) handleInstall()
                  else if (p.id === 'android') setShowInstructions('android')
                  else if (p.id === 'desktop') setShowInstructions('desktop')
                }}
                disabled={isInstalling}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  p.recommended
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                } disabled:opacity-50`}
              >
                {isInstalling ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiDownload size={16} />
                )}
                {p.installLabel}
              </button>
            </div>
          ))}
        </div>

        {/* Why install section */}
        <div className="card">
          <h3 className="font-bold text-surface-900 dark:text-white mb-4 text-center">Why Install?</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: '📱', title: 'Home Screen', desc: 'Launch instantly' },
              { icon: '⚡', title: 'Fast Loading', desc: 'Cached for speed' },
              { icon: '📡', title: 'Offline Access', desc: 'Works without internet' },
              { icon: '📷', title: 'Camera Access', desc: 'Question Solver' },
            ].map((b) => (
              <div key={b.title} className="text-center p-3">
                <div className="text-2xl mb-2">{b.icon}</div>
                <h4 className="font-semibold text-sm text-surface-900 dark:text-white">{b.title}</h4>
                <p className="text-xs text-surface-500 mt-0.5">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Install Instructions Modal */}
        {showInstructions && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowInstructions(null)}>
            <div className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-md overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200 dark:border-surface-700">
                <h3 className="font-bold text-lg text-surface-900 dark:text-white">
                  {showInstructions === 'ios' ? 'Add to Home Screen' :
                   showInstructions === 'android' ? 'Install on Android' : 'Install on Desktop'}
                </h3>
                <button onClick={() => setShowInstructions(null)} className="btn-ghost p-1">
                  <FiX size={20} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {showInstructions === 'ios' && (
                  <>
                    <Step num={1} text="Open this page in Safari" />
                    <Step num={2} text={<><strong>Tap the Share button</strong> — the square icon with an arrow pointing up, at the bottom of the screen</>} />
                    <Step num={3} text={<>Scroll down and tap <strong>"Add to Home Screen"</strong></>} />
                    <Step num={4} text={<>Tap <strong>"Add"</strong> in the top-right corner</>} />
                    <Step num={5} text="Find DKINGs AI on your home screen" />
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 text-sm text-blue-600 dark:text-blue-300">
                      <strong>Note:</strong> iOS doesn't support automatic installation. Use the Share button to add it manually.
                    </div>
                  </>
                )}

                {showInstructions === 'android' && (
                  <>
                    <Step num={1} text="Open this page in Chrome browser" />
                    <Step num={2} text={<>Tap the <strong>3-dot menu</strong> (⋮) in the top-right</>} />
                    <Step num={3} text={<>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></>} />
                    <Step num={4} text={<>Tap <strong>"Install"</strong> on the popup</>} />
                    <Step num={5} text="Find DKINGs AI on your home screen or app drawer" />
                    <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-3 text-sm text-green-600 dark:text-green-300">
                      <strong>Tip:</strong> You can also tap the install banner at the bottom of any page.
                    </div>
                  </>
                )}

                {showInstructions === 'desktop' && (
                  <>
                    <Step num={1} text={<>Open this page in <strong>Chrome, Edge, or Brave</strong></>} />
                    <Step num={2} text={<>Click the <strong>install icon</strong> in the address bar (look for a monitor icon with a down arrow)</>} />
                    <Step num={3} text={<>Or click the <strong>3-dot menu</strong> → "Install DKINGs AI"</>} />
                    <Step num={4} text={<>Click <strong>"Install"</strong> on the popup</>} />
                    <Step num={5} text="The app opens in its own window. Find it in your Start Menu or Applications folder." />
                    <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-3 text-sm text-purple-600 dark:text-purple-300">
                      <strong>Tip:</strong> You can pin it to your taskbar for quick access.
                    </div>
                  </>
                )}
              </div>

              <div className="px-5 pb-5">
                <button
                  onClick={() => setShowInstructions(null)}
                  className="w-full py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Step({ num, text }: { num: number; text: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0 text-sm font-bold">
        {num}
      </div>
      <p className="text-sm text-surface-700 dark:text-surface-300 pt-1">{text}</p>
    </div>
  )
}
