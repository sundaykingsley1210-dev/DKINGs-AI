import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjectStore } from '@/store/projectStore'
import { useChatStore } from '@/store/chatStore'
import {
  FiArrowLeft,
  FiPlus,
  FiUpload,
  FiFile,
  FiTrash2,
  FiMessageSquare,
  FiCode,
  FiSettings,
  FiSave,
  FiDownload,
  FiFolder,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import ChatMessage from '@/components/Chat/ChatMessage'
import ChatInput from '@/components/Chat/ChatInput'

type ProjectTab = 'files' | 'chat' | 'settings'

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { projects, updateProject, addFile, removeFile, updateFileContent } = useProjectStore()
  const { createConversation, addMessage, updateMessage, setGenerating } = useChatStore()
  const [activeTab, setActiveTab] = useState<ProjectTab>('chat')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const project = projects.find((p) => p.id === projectId)

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <FiFolder size={48} className="text-surface-400 mb-4" />
        <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">Project not found</h2>
        <button onClick={() => navigate('/projects')} className="btn-primary">
          Back to Projects
        </button>
      </div>
    )
  }

  const tabs = [
    { id: 'chat' as const, label: 'AI Chat', icon: FiMessageSquare },
    { id: 'files' as const, label: 'Files', icon: FiFile },
    { id: 'settings' as const, label: 'Settings', icon: FiSettings },
  ]

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        addFile(project.id, {
          name: file.name,
          path: file.name,
          content: ev.target?.result as string,
          type: file.type,
          size: file.size,
        })
        toast.success(`${file.name} uploaded`)
      }
      reader.readAsText(file)
    })
    e.target.value = ''
  }

  const handleProjectChat = async (content: string) => {
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }
    setChatMessages((prev) => [...prev, userMsg])
    setIsProcessing(true)

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('dkings-token') || ''}`,
        },
        body: JSON.stringify({
          content,
          mode: project.mode,
          projectId: project.id,
          context: {
            projectName: project.name,
            projectDescription: project.description,
            files: project.files.map((f) => ({ name: f.name, content: f.content })),
            instructions: project.instructions,
          },
        }),
      })

      const data = await response.json()
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || data.message || 'I can help with your project!',
        timestamp: new Date().toISOString(),
      }
      setChatMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      toast.error('Failed to get response')
    } finally {
      setIsProcessing(false)
    }
  }

  const currentFile = project.files.find((f) => f.id === selectedFile)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
        <button onClick={() => navigate('/projects')} className="btn-ghost p-1.5">
          <FiArrowLeft size={18} />
        </button>

        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: project.color }}
        >
          {project.name.charAt(0)}
        </div>

        <div className="flex-1">
          <h1 className="font-semibold text-surface-900 dark:text-white">{project.name}</h1>
          <p className="text-xs text-surface-500">{project.description}</p>
        </div>

        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white'
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-white text-2xl font-bold"
                    style={{ backgroundColor: project.color }}
                  >
                    {project.name.charAt(0)}
                  </div>
                  <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">
                    Chat about {project.name}
                  </h3>
                  <p className="text-surface-500 text-center max-w-md mb-6">
                    Avery AI understands your project context including {project.files.length} uploaded files.
                  </p>
                  <div className="grid grid-cols-2 gap-3 w-full max-w-xl">
                    {[
                      'Help me implement the user authentication system',
                      'Review my code for bugs and improvements',
                      'Create the database schema for this project',
                      'Add a new feature to the dashboard',
                    ].map((idea) => (
                      <button
                        key={idea}
                        onClick={() => handleProjectChat(idea)}
                        className="card hover:bg-surface-50 dark:hover:bg-surface-700/50 text-left text-sm transition-all"
                      >
                        {idea}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-4">
                  {chatMessages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                  ))}
                  {isProcessing && (
                    <div className="flex items-center gap-2 text-surface-400 text-sm">
                      <div className="typing-indicator flex gap-1">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      Thinking...
                    </div>
                  )}
                </div>
              )}
            </div>
            <ChatInput
              onSend={handleProjectChat}
              disabled={isProcessing}
              placeholder={`Ask about ${project.name}...`}
            />
          </div>
        )}

        {activeTab === 'files' && (
          <div className="flex h-full">
            {/* File List */}
            <div className="w-72 border-r border-surface-200 dark:border-surface-700 flex flex-col">
              <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
                <span className="text-sm font-medium">Files</span>
                <label className="btn-secondary text-xs cursor-pointer flex items-center gap-1 py-1.5 px-2">
                  <FiUpload size={12} />
                  Upload
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    multiple
                  />
                </label>
              </div>
              <div className="flex-1 overflow-y-auto">
                {project.files.length === 0 ? (
                  <div className="p-4 text-center text-sm text-surface-400">
                    No files uploaded yet
                  </div>
                ) : (
                  project.files.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => setSelectedFile(file.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 cursor-pointer border-b border-surface-100 dark:border-surface-800 ${
                        selectedFile === file.id
                          ? 'bg-primary-50 dark:bg-primary-950 text-primary-600'
                          : 'hover:bg-surface-50 dark:hover:bg-surface-800'
                      }`}
                    >
                      <FiFile size={14} />
                      <span className="text-sm truncate flex-1">{file.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(project.id, file.id)
                          if (selectedFile === file.id) setSelectedFile(null)
                        }}
                        className="opacity-0 group-hover:opacity-100 text-red-500"
                      >
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* File Editor */}
            <div className="flex-1 flex flex-col">
              {currentFile ? (
                <>
                  <div className="px-4 py-2 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
                    <span className="text-sm font-mono text-surface-600">{currentFile.name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(currentFile.content)
                          toast.success('Copied!')
                        }}
                        className="btn-ghost text-xs flex items-center gap-1"
                      >
                        <FiCode size={12} /> Copy
                      </button>
                      <button
                        onClick={() => {
                          const blob = new Blob([currentFile.content], { type: 'text/plain' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = currentFile.name
                          a.click()
                        }}
                        className="btn-ghost text-xs flex items-center gap-1"
                      >
                        <FiDownload size={12} /> Download
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={currentFile.content}
                    onChange={(e) => updateFileContent(project.id, currentFile.id, e.target.value)}
                    className="flex-1 resize-none bg-white dark:bg-surface-900 p-4 font-mono text-sm focus:outline-none"
                    spellCheck={false}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-surface-400">
                  <FiFile size={32} className="mb-2" />
                  <p className="text-sm">Select a file to view and edit</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto p-6 space-y-6">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white">Project Settings</h3>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={project.name}
                onChange={(e) => updateProject(project.id, { name: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Description
              </label>
              <textarea
                value={project.description}
                onChange={(e) => updateProject(project.id, { description: e.target.value })}
                className="input-field min-h-[80px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Project Instructions (AI Context)
              </label>
              <textarea
                value={project.instructions}
                onChange={(e) => updateProject(project.id, { instructions: e.target.value })}
                placeholder="Add instructions for the AI to understand your project better..."
                className="input-field min-h-[120px]"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => toast.success('Settings saved')}
                className="btn-primary flex items-center gap-2"
              >
                <FiSave size={16} />
                Save Changes
              </button>
              <button
                onClick={() => {
                  if (confirm('Delete this project?')) {
                    navigate('/projects')
                  }
                }}
                className="btn-secondary text-red-500 flex items-center gap-2"
              >
                <FiTrash2 size={16} />
                Delete Project
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
