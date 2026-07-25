import { useState, useCallback } from 'react'
import { FiCode, FiPlay, FiCopy, FiDownload, FiAlertCircle, FiCheckCircle, FiChevronDown, FiUpload } from 'react-icons/fi'
import ChatInput from '@/components/Chat/ChatInput'
import ChatMessage from '@/components/Chat/ChatMessage'
import toast from 'react-hot-toast'

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', ext: '.js' },
  { id: 'typescript', label: 'TypeScript', ext: '.ts' },
  { id: 'python', label: 'Python', ext: '.py' },
  { id: 'java', label: 'Java', ext: '.java' },
  { id: 'cpp', label: 'C++', ext: '.cpp' },
  { id: 'html', label: 'HTML', ext: '.html' },
  { id: 'css', label: 'CSS', ext: '.css' },
  { id: 'php', label: 'PHP', ext: '.php' },
  { id: 'sql', label: 'SQL', ext: '.sql' },
  { id: 'react', label: 'React/JSX', ext: '.jsx' },
]

interface CodeFile {
  name: string
  language: string
  content: string
}

export default function CodePage() {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [error, setError] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [showLangDropdown, setShowLangDropdown] = useState(false)

  const handleAnalyze = useCallback(async () => {
    if (!code.trim()) {
      toast.error('Please enter some code to analyze')
      return
    }

    setIsAnalyzing(true)
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: `**Language:** ${language}\n\`\`\`${language}\n${code}\n\`\`\`${error ? `\n\n**Error:**\n\`\`\`\n${error}\n\`\`\`` : ''}\n\nPlease analyze this code and ${error ? 'help me fix the error' : 'suggest improvements'}.`,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])

    try {
      const response = await fetch('/api/code/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('dkings-token') || ''}`,
        },
        body: JSON.stringify({ code, language, error: error || undefined }),
      })

      const data = await response.json()

      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || data.analysis || 'Analysis complete. Please review the suggestions above.',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
      setAnalysisResult(data)
    } catch (err: any) {
      toast.error('Analysis failed. Please try again.')
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I encountered an error while analyzing your code: ${err.message}\n\nPlease make sure the backend server is running and try again.`,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsAnalyzing(false)
    }
  }, [code, language, error])

  const handleChatSend = useCallback(async (content: string) => {
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setIsAnalyzing(true)

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('dkings-token') || ''}`,
        },
        body: JSON.stringify({ content, mode: 'code', context: { code, language, error } }),
      })

      const data = await response.json()
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || data.message || 'I received your message.',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: any) {
      toast.error('Failed to get response')
    } finally {
      setIsAnalyzing(false)
    }
  }, [code, language, error])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result as string
      setCode(content)

      const ext = file.name.split('.').pop()?.toLowerCase()
      const lang = LANGUAGES.find((l) => l.ext === `.${ext}`)
      if (lang) setLanguage(lang.id)

      toast.success(`Loaded ${file.name}`)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const selectedLang = LANGUAGES.find((l) => l.id === language)

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Left Panel - Code Editor */}
      <div className="flex-1 flex flex-col min-h-0 lg:border-r border-surface-200 dark:border-surface-700">
        <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
          <div className="flex items-center gap-2 sm:gap-3">
            <FiCode size={18} className="text-primary-500" />
            <span className="font-semibold text-sm hidden sm:inline">Code Editor</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                {selectedLang?.label}
                <FiChevronDown size={14} />
              </button>
              {showLangDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg z-10 py-1 min-w-[150px]">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => {
                        setLanguage(lang.id)
                        setShowLangDropdown(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-surface-100 dark:hover:bg-surface-700 ${
                        language === lang.id ? 'text-primary-500 bg-primary-50 dark:bg-primary-950' : ''
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <label className="btn-secondary text-sm cursor-pointer flex items-center gap-2">
              <FiUpload size={14} />
              Upload
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept=".js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.php,.html,.css,.sql,.json"
              />
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste or write your code here..."
            className="w-full h-full resize-none bg-white dark:bg-surface-900 p-4 font-mono text-sm text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none"
            spellCheck={false}
          />
        </div>

        {/* Error Input */}
        <div className="border-t border-surface-200 dark:border-surface-700 p-4 bg-surface-50 dark:bg-surface-800/50">
          <label className="flex items-center gap-2 text-sm font-medium text-surface-600 dark:text-surface-400 mb-2">
            <FiAlertCircle size={14} />
            Error Message (optional)
          </label>
          <textarea
            value={error}
            onChange={(e) => setError(e.target.value)}
            placeholder="Paste the error message here..."
            className="w-full h-20 resize-none bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg p-3 font-mono text-sm text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            spellCheck={false}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-surface-200 dark:border-surface-700">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !code.trim()}
            className="btn-primary flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <FiPlay size={16} />
                Analyze Code
              </>
            )}
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText(code)
              toast.success('Code copied!')
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <FiCopy size={16} />
            Copy
          </button>

          <button
            onClick={() => {
              const blob = new Blob([code], { type: 'text/plain' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `code${selectedLang?.ext || '.txt'}`
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <FiDownload size={16} />
            Download
          </button>
        </div>
      </div>

      {/* Right Panel - AI Analysis */}
      <div className="w-full lg:w-[450px] flex flex-col bg-white dark:bg-surface-900 border-t lg:border-t-0 border-surface-200 dark:border-surface-700">
        <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <FiCheckCircle size={16} className="text-green-500" />
            AI Analysis & Chat
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-3">
                <FiCode size={24} className="text-primary-500" />
              </div>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Write your code on the left and click "Analyze Code" to get AI-powered suggestions, bug fixes, and improvements.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))
          )}
          {isAnalyzing && (
            <div className="flex items-center gap-2 text-surface-400 text-sm">
              <div className="typing-indicator flex gap-1">
                <span></span>
                <span></span>
                <span></span>
              </div>
              Analyzing...
            </div>
          )}
        </div>

        <ChatInput onSend={handleChatSend} disabled={isAnalyzing} placeholder="Ask about this code..." />
      </div>
    </div>
  )
}
