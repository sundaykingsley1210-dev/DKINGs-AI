import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useChatStore } from '@/store/chatStore'
import { useProjectStore } from '@/store/projectStore'
import { useSettingsStore } from '@/store/settingsStore'
import {
  FiMessageSquare, FiCode, FiImage, FiSearch, FiHelpCircle,
  FiFolder, FiSettings, FiPlus, FiChevronLeft, FiChevronRight,
  FiTrash2, FiDownload,
} from 'react-icons/fi'

const modes = [
  { path: '/chat', label: 'Avery Chat', icon: FiMessageSquare, mode: 'general' as const },
  { path: '/code', label: 'Avery Code', icon: FiCode, mode: 'code' as const },
  { path: '/creative', label: 'Avery Creative', icon: FiImage, mode: 'creative' as const },
  { path: '/search', label: 'Avery Search', icon: FiSearch, mode: 'search' as const },
  { path: '/solve', label: 'Question Solver', icon: FiHelpCircle, mode: 'general' as const },
]

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { conversations, activeConversationId, setActiveConversation, createConversation, deleteConversation } = useChatStore()
  const { projects, activeProjectId } = useProjectStore()
  const aiMode = useSettingsStore((s) => s.aiMode)

  const currentMode = modes.find((m) => location.pathname.startsWith(m.path))?.mode || 'general'
  const filteredConversations = conversations.filter((c) => c.mode === currentMode)

  const handleNewChat = () => {
    const id = createConversation(currentMode)
    navigate(`/chat/${id}`)
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed lg:static z-50 h-full ${
          isOpen ? 'w-72 translate-x-0' : 'w-16 -translate-x-full lg:translate-x-0'
        } flex flex-col border-r border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 transition-all duration-300`}
      >
        <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
          {isOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">DK</span>
              </div>
              <span className="font-bold text-surface-900 dark:text-white">DKINGs AI</span>
            </div>
          )}
          <button onClick={onToggle} className="btn-ghost p-1.5">
            {isOpen ? <FiChevronLeft size={18} /> : <FiChevronRight size={18} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {isOpen && (
            <button onClick={handleNewChat} className="btn-primary w-full flex items-center justify-center gap-2 mb-4">
              <FiPlus size={16} />
              New Chat
            </button>
          )}

          {modes.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''} ${!isOpen ? 'justify-center' : ''}`
              }
              title={item.label}
              onClick={() => {
                if (window.innerWidth < 1024) onToggle()
              }}
            >
              <item.icon size={18} />
              {isOpen && <span className="text-sm">{item.label}</span>}
            </NavLink>
          ))}

          {isOpen && (
            <>
              <div className="pt-4 pb-2">
                <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Projects</span>
              </div>
              <NavLink
                to="/projects"
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'active' : ''}`
                }
                onClick={() => {
                  if (window.innerWidth < 1024) onToggle()
                }}
              >
                <FiFolder size={18} />
                <span className="text-sm">All Projects</span>
              </NavLink>
              {projects.slice(0, 5).map((p) => (
                <NavLink
                  key={p.id}
                  to={`/projects/${p.id}`}
                  className={`sidebar-item text-sm pl-8 ${activeProjectId === p.id ? 'active' : ''}`}
                  onClick={() => {
                    if (window.innerWidth < 1024) onToggle()
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="truncate">{p.name}</span>
                </NavLink>
              ))}
            </>
          )}

          {isOpen && filteredConversations.length > 0 && (
            <>
              <div className="pt-4 pb-2">
                <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">History</span>
              </div>
              {filteredConversations.slice(0, 20).map((conv) => (
                <div
                  key={conv.id}
                  className={`sidebar-item group ${
                    activeConversationId === conv.id ? 'active' : ''
                  }`}
                  onClick={() => {
                    setActiveConversation(conv.id)
                    navigate(`/chat/${conv.id}`)
                    if (window.innerWidth < 1024) onToggle()
                  }}
                >
                  <FiMessageSquare size={14} className="flex-shrink-0" />
                  <span className="truncate text-sm flex-1">{conv.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteConversation(conv.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 btn-ghost p-1"
                  >
                    <FiTrash2 size={12} />
                  </button>
                </div>
              ))}
            </>
          )}
        </nav>

        <div className="p-3 border-t border-surface-200 dark:border-surface-700 space-y-1">
          <NavLink
            to="/download"
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''} ${!isOpen ? 'justify-center' : ''}`
            }
            onClick={() => {
              if (window.innerWidth < 1024) onToggle()
            }}
          >
            <FiDownload size={18} />
            {isOpen && <span className="text-sm">Install App</span>}
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''} ${!isOpen ? 'justify-center' : ''}`
            }
            onClick={() => {
              if (window.innerWidth < 1024) onToggle()
            }}
          >
            <FiSettings size={18} />
            {isOpen && <span className="text-sm">Settings</span>}
          </NavLink>
        </div>
      </aside>
    </>
  )
}
