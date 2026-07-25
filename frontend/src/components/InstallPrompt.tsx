import { useState, useEffect } from 'react'
import { FiX, FiDownload } from 'react-icons/fi'
import { useInstall } from '@/hooks/useInstall'

export default function InstallPrompt() {
  const { canInstall, isInstalled, isInstalling, isIOS, install, dismiss, wasDismissed } = useInstall()
  const [showBanner, setShowBanner] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (isInstalled || !canInstall || wasDismissed()) return
    const timer = setTimeout(() => setShowBanner(true), 4000)
    return () => clearTimeout(timer)
  }, [canInstall, isInstalled, wasDismissed])

  const handleInstall = async () => {
    const success = await install()
    if (success) {
      setShowBanner(false)
    } else {
      setShowModal(true)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    dismiss()
  }

  if (isInstalled) return null

  return (
    <>
      {/* Bottom install banner */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 safe-bottom">
          <div className="max-w-lg mx-auto bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl p-4 shadow-2xl border border-primary-400/30 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">DK</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm">Install DKINGs AI</h3>
                <p className="text-white/70 text-xs">
                  {isIOS ? 'Tap Share → Add to Home Screen' : 'Add to home screen for the best experience'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="bg-white text-primary-600 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-white/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isInstalling ? (
                    <div className="w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
                  ) : (
                    <FiDownload size={14} />
                  )}
                  Install
                </button>
                <button onClick={handleDismiss} className="text-white/60 hover:text-white p-1.5">
                  <FiX size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* iOS instructions modal (shown when install fails on iOS) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-sm overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-primary-500 to-purple-500 p-5 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold text-xl">DK</span>
              </div>
              <h2 className="text-lg font-bold text-white">Install DKINGs AI</h2>
            </div>

            <div className="p-5 space-y-3">
              {isIOS ? (
                <>
                  <InstallStep num={1} text="Tap the Share button (□↑) below" />
                  <InstallStep num={2} text='Tap "Add to Home Screen"' />
                  <InstallStep num={3} text='Tap "Add" to confirm' />
                </>
              ) : (
                <>
                  <InstallStep num={1} text="Click the 3-dot menu (⋮) in your browser" />
                  <InstallStep num={2} text='Click "Install DKINGs AI" or "Install app"' />
                  <InstallStep num={3} text="Confirm the installation" />
                </>
              )}
            </div>

            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
              >
                Got it
              </button>
              <button
                onClick={() => { setShowModal(false); handleDismiss() }}
                className="px-4 py-3 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 font-medium text-sm"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function InstallStep({ num, text }: { num: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">
        {num}
      </div>
      <p className="text-sm text-surface-700 dark:text-surface-300 pt-0.5">{text}</p>
    </div>
  )
}
