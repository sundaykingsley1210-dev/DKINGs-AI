import { FiMenu, FiSun, FiMoon, FiUser, FiMonitor, FiDownload } from 'react-icons/fi'
import { useSettingsStore } from '@/store/settingsStore'
import { useNavigate } from 'react-router-dom'
import { useChatStore } from '@/store/chatStore'
import { useProjectStore } from '@/store/projectStore'
import { useInstall } from '@/hooks/useInstall'
import type { AIMode } from '@/types'

const modeLabels: Record<AIMode, string> = {
  code: 'Avery Code',
  creative: 'Avery Creative',
  search: 'Avery Search',
  general: 'Avery Chat',
}

interface TopBarProps {
  onToggleSidebar: () => void
}

export default function TopBar({ onToggleSidebar }: TopBarProps) {
  const { theme, setTheme, aiMode, setAiMode } = useSettingsStore()
  const navigate = useNavigate()
  const activeConversation = useChatStore((s) => s.getActiveConversation())
  const activeProject = useProjectStore((s) => s.getActiveProject())
  const { canInstall, isInstalled, isIOS, install } = useInstall()

  const cycleTheme = () => {
    const themes = ['light', 'dark', 'system'] as const
    const idx = themes.indexOf(theme)
    setTheme(themes[(idx + 1) % themes.length])
  }

  const ThemeIcon = theme === 'dark' ? FiMoon : theme === 'light' ? FiSun : FiMonitor

  return (
    <header className="h-14 flex items-center justify-between px-3 sm:px-4 border-b border-surface-200 dark:border-surface-700 bg-white/80 dark:bg-surface-900/80 backdrop-blur-sm flex-shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button onClick={onToggleSidebar} className="btn-ghost p-1.5 flex-shrink-0">
          <FiMenu size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-surface-900 dark:text-white truncate">
            {activeProject ? activeProject.name : activeConversation?.title || modeLabels[aiMode]}
          </h1>
          {activeProject && (
            <p className="text-xs text-surface-500 truncate max-w-[200px] sm:max-w-md">{activeProject.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <select
          value={aiMode}
          onChange={(e) => {
            const mode = e.target.value as AIMode
            setAiMode(mode)
            navigate(`/${mode === 'general' ? 'chat' : mode}`)
          }}
          className="text-xs bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 hidden sm:block"
        >
          <option value="code">Avery Code</option>
          <option value="creative">Avery Creative</option>
          <option value="search">Avery Search</option>
          <option value="general">Avery Chat</option>
        </select>

        <button onClick={cycleTheme} className="btn-ghost p-1.5" title={`Theme: ${theme}`}>
          <ThemeIcon size={18} />
        </button>

        {!isInstalled && (canInstall || isIOS) && (
          <button
            onClick={() => isIOS ? navigate('/download') : install()}
            className="flex items-center gap-1 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
            title="Install App"
          >
            <FiDownload size={14} />
            <span className="hidden sm:inline">Install</span>
          </button>
        )}

        <button
          onClick={() => navigate('/settings')}
          className="btn-ghost p-1.5"
        >
          <FiUser size={18} />
        </button>
      </div>
    </header>
  )
}
