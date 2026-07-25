import axios from 'axios'

const API_BASE = '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dkings-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('dkings-token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
  getProfile: () => api.get('/auth/profile'),
}

export const chatAPI = {
  sendMessage: (conversationId: string, content: string, mode: string, attachments?: File[]) => {
    const formData = new FormData()
    formData.append('conversationId', conversationId)
    formData.append('content', content)
    formData.append('mode', mode)
    if (attachments) {
      attachments.forEach((file) => formData.append('files', file))
    }
    return api.post('/chat/send', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  streamMessage: async function* (conversationId: string, content: string, mode: string) {
    const token = localStorage.getItem('dkings-token')
    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ conversationId, content, mode }),
    })

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) return

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n').filter((line) => line.trim())
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            yield data
          } catch {
            // skip malformed chunks
          }
        }
      }
    }
  },
}

export const codeAPI = {
  analyze: (code: string, language: string, error?: string) =>
    api.post('/code/analyze', { code, language, error }),
  debug: (code: string, language: string, errorMessage: string) =>
    api.post('/code/debug', { code, language, errorMessage }),
  explain: (code: string, language: string) =>
    api.post('/code/explain', { code, language }),
  fix: (code: string, language: string, errorMessage: string) =>
    api.post('/code/fix', { code, language, errorMessage }),
}

export const searchAPI = {
  search: (query: string) => api.post('/search', { query }),
  searchCode: (query: string) => api.post('/search/code', { query }),
}

export const projectAPI = {
  create: (data: { name: string; description: string; mode: string }) =>
    api.post('/projects', data),
  list: () => api.get('/projects'),
  get: (id: string) => api.get(`/projects/${id}`),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  uploadFile: (projectId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/projects/${projectId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const imageAPI = {
  edit: (image: File, prompt: string) => {
    const formData = new FormData()
    formData.append('image', image)
    formData.append('prompt', prompt)
    return api.post('/image/edit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  generate: (prompt: string) => api.post('/image/generate', { prompt }),
}

export const videoAPI = {
  analyze: (video: File) => {
    const formData = new FormData()
    formData.append('video', video)
    return api.post('/video/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  generateScript: (topic: string, platform: string) =>
    api.post('/video/script', { topic, platform }),
}

export default api
