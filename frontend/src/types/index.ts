export type AIMode = 'code' | 'creative' | 'search' | 'general'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  attachments?: Attachment[]
  codeBlocks?: CodeBlock[]
  isStreaming?: boolean
}

export interface Attachment {
  id: string
  name: string
  type: 'image' | 'file' | 'code'
  url: string
  size: number
  mimeType: string
}

export interface CodeBlock {
  language: string
  code: string
  filename?: string
}

export interface Conversation {
  id: string
  title: string
  mode: AIMode
  messages: Message[]
  createdAt: string
  updatedAt: string
  projectId?: string
}

export interface Project {
  id: string
  name: string
  description: string
  mode: AIMode
  files: ProjectFile[]
  conversations: Conversation[]
  instructions: string
  createdAt: string
  updatedAt: string
  icon?: string
  color?: string
}

export interface ProjectFile {
  id: string
  name: string
  path: string
  content: string
  type: string
  size: number
  uploadedAt: string
}

export interface SearchResult {
  title: string
  url: string
  snippet: string
  source: string
}

export interface AIResponse {
  content: string
  sources?: SearchResult[]
  codeBlocks?: CodeBlock[]
  suggestions?: string[]
}

export type Theme = 'light' | 'dark' | 'system'

export interface AppSettings {
  theme: Theme
  aiMode: AIMode
  fontSize: number
  codeTheme: string
  voiceEnabled: boolean
  autoSave: boolean
}
