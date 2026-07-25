import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Conversation, Message, AIMode } from '@/types'

const uuidv4 = () => crypto.randomUUID()

interface ChatStore {
  conversations: Conversation[]
  activeConversationId: string | null
  isGenerating: boolean
  streamingMessageId: string | null

  createConversation: (mode: AIMode, projectId?: string) => string
  setActiveConversation: (id: string | null) => void
  deleteConversation: (id: string) => void
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => Message
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void
  setGenerating: (generating: boolean) => void
  setStreamingMessageId: (id: string | null) => void
  getActiveConversation: () => Conversation | undefined
  searchConversations: (query: string) => Conversation[]
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      isGenerating: false,
      streamingMessageId: null,

      createConversation: (mode, projectId) => {
        const id = uuidv4()
        const conversation: Conversation = {
          id,
          title: 'New Chat',
          mode,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          projectId,
        }
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: id,
        }))
        return id
      },

      setActiveConversation: (id) => set({ activeConversationId: id }),

      deleteConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          activeConversationId:
            state.activeConversationId === id ? null : state.activeConversationId,
        })),

      addMessage: (conversationId, messageData) => {
        const message: Message = {
          ...messageData,
          id: uuidv4(),
          timestamp: new Date().toISOString(),
        }
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, message],
                  updatedAt: new Date().toISOString(),
                  title: c.messages.length === 0 && messageData.role === 'user'
                    ? messageData.content.slice(0, 50) + (messageData.content.length > 50 ? '...' : '')
                    : c.title,
                }
              : c
          ),
        }))
        return message
      },

      updateMessage: (conversationId, messageId, updates) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, ...updates } : m
                  ),
                }
              : c
          ),
        })),

      setGenerating: (isGenerating) => set({ isGenerating }),
      setStreamingMessageId: (streamingMessageId) => set({ streamingMessageId }),

      getActiveConversation: () => {
        const state = get()
        return state.conversations.find((c) => c.id === state.activeConversationId)
      },

      searchConversations: (query) => {
        const state = get()
        const lower = query.toLowerCase()
        return state.conversations.filter(
          (c) =>
            c.title.toLowerCase().includes(lower) ||
            c.messages.some((m) => m.content.toLowerCase().includes(lower))
        )
      },
    }),
    { name: 'dkings-chat' }
  )
)
