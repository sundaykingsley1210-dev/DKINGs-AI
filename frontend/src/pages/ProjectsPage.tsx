import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '@/store/projectStore'
import { FiPlus, FiFolder, FiTrash2, FiEdit2, FiCalendar, FiFile } from 'react-icons/fi'
import toast from 'react-hot-toast'
import type { AIMode } from '@/types'

const modeColors: Record<AIMode, string> = {
  code: 'from-blue-500 to-cyan-500',
  creative: 'from-pink-500 to-rose-500',
  search: 'from-green-500 to-emerald-500',
  general: 'from-primary-500 to-purple-500',
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const { projects, createProject, deleteProject, updateProject } = useProjectStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '', mode: 'code' as AIMode })
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleCreate = () => {
    if (!newProject.name.trim()) {
      toast.error('Please enter a project name')
      return
    }
    const id = createProject(newProject.name, newProject.description, newProject.mode)
    toast.success('Project created!')
    setShowCreateModal(false)
    setNewProject({ name: '', description: '', mode: 'code' })
    navigate(`/projects/${id}`)
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteProject(id)
      toast.success('Project deleted')
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Projects</h1>
            <p className="text-surface-500 mt-1">
              Manage your development projects and workspaces
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus size={18} />
            New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
              <FiFolder size={36} className="text-surface-400" />
            </div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
              No projects yet
            </h3>
            <p className="text-surface-500 mb-6 text-center max-w-sm">
              Create your first project to organize your code, files, and AI conversations.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus size={18} />
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="card hover:shadow-lg transition-all duration-200 cursor-pointer group"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${modeColors[project.mode]} flex items-center justify-center`}
                  >
                    <FiFolder size={20} className="text-white" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingId(project.id)
                      }}
                      className="btn-ghost p-1.5"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(project.id, project.name)
                      }}
                      className="btn-ghost p-1.5 text-red-500 hover:text-red-600"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-surface-900 dark:text-white mb-1">
                  {project.name}
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-2 mb-3">
                  {project.description || 'No description'}
                </p>

                <div className="flex items-center gap-4 text-xs text-surface-400">
                  <span className="flex items-center gap-1">
                    <FiFile size={12} />
                    {project.files.length} files
                  </span>
                  <span className="flex items-center gap-1">
                    <FiCalendar size={12} />
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      project.mode === 'code'
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                        : project.mode === 'creative'
                        ? 'bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-400'
                        : project.mode === 'search'
                        ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                        : 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400'
                    }`}
                  >
                    {project.mode}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-md p-6 animate-slide-up">
              <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-4">
                Create New Project
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="e.g., School Management Portal"
                    className="input-field"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Describe what you're building..."
                    className="input-field min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Project Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['code', 'creative', 'search', 'general'] as AIMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setNewProject({ ...newProject, mode })}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          newProject.mode === mode
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950 text-primary-600'
                            : 'border-surface-200 dark:border-surface-700 hover:border-surface-300'
                        }`}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button onClick={handleCreate} className="btn-primary flex-1">
                  Create Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
