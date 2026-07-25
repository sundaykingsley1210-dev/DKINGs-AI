import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme, AIMode, AppSettings } from '@/types'

interface SettingsStore extends AppSettings {
  setTheme: (theme: Theme) => void
  setAiMode: (mode: AIMode) => void
  setFontSize: (size: number) => void
  setCodeTheme: (theme: string) => void
  setVoiceEnabled: (enabled: boolean) => void
  setAutoSave: (enabled: boolean) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      aiMode: 'code',
      fontSize: 14,
      codeTheme: 'oneDark',
      voiceEnabled: false,
      autoSave: true,

      setTheme: (theme) => set({ theme }),
      setAiMode: (aiMode) => set({ aiMode }),
      setFontSize: (fontSize) => set({ fontSize }),
      setCodeTheme: (codeTheme) => set({ codeTheme }),
      setVoiceEnabled: (voiceEnabled) => set({ voiceEnabled }),
      setAutoSave: (autoSave) => set({ autoSave }),
    }),
    { name: 'dkings-settings' }
  )
)
