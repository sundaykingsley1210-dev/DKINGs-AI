import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, ProjectFile, Conversation, AIMode } from '@/types'

const uuidv4 = () => crypto.randomUUID()

interface ProjectStore {
  projects: Project[]
  activeProjectId: string | null

  createProject: (name: string, description: string, mode: AIMode) => string
  setActiveProject: (id: string | null) => void
  deleteProject: (id: string) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  addFile: (projectId: string, file: Omit<ProjectFile, 'id' | 'uploadedAt'>) => ProjectFile
  removeFile: (projectId: string, fileId: string) => void
  updateFileContent: (projectId: string, fileId: string, content: string) => void
  addConversation: (projectId: string, conversation: Conversation) => void
  getActiveProject: () => Project | undefined
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,

      createProject: (name, description, mode) => {
        const id = uuidv4()
        const project: Project = {
          id,
          name,
          description,
          mode,
          files: [],
          conversations: [],
          instructions: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          color: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][
            Math.floor(Math.random() * 5)
          ],
        }
        set((state) => ({
          projects: [project, ...state.projects],
          activeProjectId: id,
        }))
        return id
      },

      setActiveProject: (id) => set({ activeProjectId: id }),

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          activeProjectId:
            state.activeProjectId === id ? null : state.activeProjectId,
        })),

      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        })),

      addFile: (projectId, fileData) => {
        const file: ProjectFile = {
          ...fileData,
          id: uuidv4(),
          uploadedAt: new Date().toISOString(),
        }
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, files: [...p.files, file] } : p
          ),
        }))
        return file
      },

      removeFile: (projectId, fileId) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, files: p.files.filter((f) => f.id !== fileId) }
              : p
          ),
        })),

      updateFileContent: (projectId, fileId, content) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  files: p.files.map((f) =>
                    f.id === fileId ? { ...f, content } : f
                  ),
                }
              : p
          ),
        })),

      addConversation: (projectId, conversation) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, conversations: [...p.conversations, conversation] }
              : p
          ),
        })),

      getActiveProject: () => {
        const state = get()
        return state.projects.find((p) => p.id === state.activeProjectId)
      },
    }),
    { name: 'dkings-projects' }
  )
)
