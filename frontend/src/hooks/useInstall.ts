import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Platform = 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'unknown'

interface InstallState {
  canInstall: boolean
  isInstalled: boolean
  isInstalling: boolean
  platform: Platform
  isIOS: boolean
  isAndroid: boolean
  isDesktop: boolean
  isStandalone: boolean
}

export function useInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [state, setState] = useState<InstallState>({
    canInstall: false,
    isInstalled: false,
    isInstalling: false,
    platform: 'unknown',
    isIOS: false,
    isAndroid: false,
    isDesktop: false,
    isStandalone: false,
  })

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad/.test(ua)
    const isAndroid = /android/.test(ua)
    const isDesktop = !isIOS && !isAndroid
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true

    let platform: Platform = 'unknown'
    if (isAndroid) platform = 'android'
    else if (isIOS) platform = 'ios'
    else if (/win/.test(ua)) platform = 'windows'
    else if (/mac/.test(ua)) platform = 'macos'
    else if (/linux/.test(ua)) platform = 'linux'

    setState(prev => ({
      ...prev,
      platform,
      isIOS,
      isAndroid,
      isDesktop,
      isStandalone,
      isInstalled: isStandalone,
    }))

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setState(prev => ({ ...prev, canInstall: true }))
    }

    const onAppInstalled = () => {
      setDeferredPrompt(null)
      setState(prev => ({ ...prev, canInstall: false, isInstalled: true, isInstalling: false }))
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', onAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  const install = useCallback(async (): Promise<boolean> => {
    if (state.isInstalled) return true

    setState(prev => ({ ...prev, isInstalling: true }))

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        setDeferredPrompt(null)
        if (outcome === 'accepted') {
          setState(prev => ({ ...prev, isInstalled: true, isInstalling: false }))
          return true
        }
        setState(prev => ({ ...prev, isInstalling: false }))
        return false
      } catch {
        setState(prev => ({ ...prev, isInstalling: false }))
        return false
      }
    }

    // No deferred prompt - show manual instructions
    setState(prev => ({ ...prev, isInstalling: false }))
    return false
  }, [deferredPrompt, state.isInstalled])

  const dismiss = useCallback(() => {
    localStorage.setItem('dkings-install-dismissed', Date.now().toString())
  }, [])

  const wasDismissed = useCallback(() => {
    const dismissed = localStorage.getItem('dkings-install-dismissed')
    if (!dismissed) return false
    const daysSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24)
    return daysSince < 7
  }, [])

  return {
    ...state,
    install,
    dismiss,
    wasDismissed,
    hasPrompt: !!deferredPrompt,
  }
}
