import { useSettingsStore } from '@/store/settingsStore'
import { FiSun, FiMoon, FiMonitor, FiSave, FiUser, FiVolume2, FiCode, FiDownload } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useInstall } from '@/hooks/useInstall'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const {
    theme, setTheme,
    fontSize, setFontSize,
    voiceEnabled, setVoiceEnabled,
    autoSave, setAutoSave,
    codeTheme, setCodeTheme,
  } = useSettingsStore()
  const navigate = useNavigate()
  const { canInstall, isInstalled, isInstalling, install } = useInstall()

  const themes = [
    { id: 'light' as const, label: 'Light', icon: FiSun },
    { id: 'dark' as const, label: 'Dark', icon: FiMoon },
    { id: 'system' as const, label: 'System', icon: FiMonitor },
  ]

  const codeThemes = [
    'oneDark', 'github', 'vs2015', 'monokai', 'dracula', 'nord', 'solarized',
  ]

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Settings</h1>
          <p className="text-surface-500 mt-1">Customize your DKINGs AI experience</p>
        </div>

        {/* Profile Section */}
        <section className="card">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <FiUser size={18} />
            Profile
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                U
              </div>
              <div>
                <h3 className="font-medium text-surface-900 dark:text-white">User</h3>
                <p className="text-sm text-surface-500">user@dkingsai.com</p>
              </div>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="card">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <FiSun size={18} />
            Appearance
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      theme === t.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950 text-primary-600'
                        : 'border-surface-200 dark:border-surface-700 hover:border-surface-300'
                    }`}
                  >
                    <t.icon size={18} />
                    <span className="text-sm">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Font Size: {fontSize}px
              </label>
              <input
                type="range"
                min="12"
                max="20"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-primary-500"
              />
            </div>
          </div>
        </section>

        {/* Code Editor */}
        <section className="card">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <FiCode size={18} />
            Code Editor
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Code Theme
              </label>
              <div className="grid grid-cols-4 gap-2">
                {codeThemes.map((ct) => (
                  <button
                    key={ct}
                    onClick={() => setCodeTheme(ct)}
                    className={`p-2 rounded-lg border-2 text-xs font-mono transition-all ${
                      codeTheme === ct
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950 text-primary-600'
                        : 'border-surface-200 dark:border-surface-700 hover:border-surface-300'
                    }`}
                  >
                    {ct}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="card">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiVolume2 size={18} className="text-surface-500" />
                <div>
                  <h3 className="text-sm font-medium text-surface-900 dark:text-white">Voice Output</h3>
                  <p className="text-xs text-surface-500">Read AI responses aloud</p>
                </div>
              </div>
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`w-12 h-6 rounded-full transition-all ${
                  voiceEnabled ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    voiceEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiSave size={18} className="text-surface-500" />
                <div>
                  <h3 className="text-sm font-medium text-surface-900 dark:text-white">Auto Save</h3>
                  <p className="text-xs text-surface-500">Automatically save conversations</p>
                </div>
              </div>
              <button
                onClick={() => setAutoSave(!autoSave)}
                className={`w-12 h-6 rounded-full transition-all ${
                  autoSave ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    autoSave ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Install App */}
        <section className="card">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <FiDownload size={18} />
            Install App
          </h2>
          <div className="space-y-4">
            {isInstalled ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                  <FiDownload size={18} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-green-700 dark:text-green-400">DKINGs AI is Installed!</h3>
                  <p className="text-xs text-green-600/70 dark:text-green-400/70">You're using the installed app</p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-surface-500">
                  Install DKINGs AI on your device for the best experience. Get offline access, faster loading, and a native app feel.
                </p>
                {canInstall ? (
                  <button
                    onClick={async () => {
                      const success = await install()
                      if (success) toast.success('App installed successfully!')
                      else toast.error('Installation cancelled')
                    }}
                    disabled={isInstalling}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    {isInstalling ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Installing...
                      </>
                    ) : (
                      <>
                        <FiDownload size={18} />
                        Install Now
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/download')}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    <FiDownload size={18} />
                    View Install Instructions
                  </button>
                )}
              </>
            )}
          </div>
        </section>

        <button
          onClick={() => toast.success('Settings saved!')}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <FiSave size={18} />
          Save All Settings
        </button>
      </div>
    </div>
  )
}
