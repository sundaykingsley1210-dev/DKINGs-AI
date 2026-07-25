import { useState, useCallback } from 'react'
import { FiSearch, FiGlobe, FiExternalLink, FiCode, FiBook, FiFilter } from 'react-icons/fi'
import ChatInput from '@/components/Chat/ChatInput'
import ChatMessage from '@/components/Chat/ChatMessage'
import toast from 'react-hot-toast'

type SearchCategory = 'all' | 'code' | 'docs' | 'general'

interface SearchResult {
  title: string
  url: string
  snippet: string
  source: string
}

export default function SearchPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchCategory, setSearchCategory] = useState<SearchCategory>('all')

  const categories = [
    { id: 'all' as const, label: 'All Results', icon: FiGlobe },
    { id: 'code' as const, label: 'Code & Dev', icon: FiCode },
    { id: 'docs' as const, label: 'Documentation', icon: FiBook },
    { id: 'general' as const, label: 'General', icon: FiFilter },
  ]

  const handleSearch = useCallback(async (query: string) => {
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setIsSearching(true)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('dkings-token') || ''}`,
        },
        body: JSON.stringify({ query, category: searchCategory }),
      })

      const data = await response.json()

      if (data.results) {
        setSearchResults(data.results)
      }

      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || data.answer || `Here are the results for "${query}". Check the results panel on the right.`,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      toast.error('Search failed. Please try again.')
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I encountered an error while searching. Please try again.\n\nYou can also try rephrasing your query.`,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsSearching(false)
    }
  }, [searchCategory])

  return (
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
                <FiSearch className="text-green-500" />
                Avery Search
              </h2>
              <p className="text-sm text-surface-500 mt-1">
                Intelligent search with AI-powered answers and source citations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSearchCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  searchCategory === cat.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600'
                }`}
              >
                <cat.icon size={12} />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4 shadow-lg">
                <FiSearch size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
                Search anything
              </h3>
              <p className="text-surface-500 dark:text-surface-400 text-center max-w-md mb-6">
                Ask questions, find documentation, compare technologies, or research any topic.
                Avery Search provides intelligent answers with source citations.
              </p>

              <div className="grid grid-cols-2 gap-3 w-full max-w-xl">
                {[
                  'What are the new features in React 19?',
                  'Compare Next.js vs Remix for web development',
                  'How to implement authentication in Node.js?',
                  'Best practices for PostgreSQL database design',
                  'Latest trends in AI and machine learning 2024',
                  'How to deploy a Docker container to AWS?',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSearch(suggestion)}
                    className="card hover:bg-surface-50 dark:hover:bg-surface-700/50 text-left text-sm transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isSearching && (
                <div className="flex items-center gap-2 text-surface-400 text-sm">
                  <div className="typing-indicator flex gap-1">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  Searching the web...
                </div>
              )}
            </div>
          )}
        </div>

        <ChatInput
          onSend={handleSearch}
          disabled={isSearching}
          placeholder="Search for anything..."
        />
      </div>

      {/* Results Sidebar */}
      {searchResults.length > 0 && (
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-surface-200 dark:border-surface-700 flex flex-col bg-surface-50 dark:bg-surface-800/30 max-h-[40vh] lg:max-h-none">
          <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
            <h3 className="font-semibold text-sm">
              Sources ({searchResults.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {searchResults.map((result, idx) => (
              <a
                key={idx}
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:border-primary-500 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium text-primary-500 group-hover:text-primary-600 line-clamp-2">
                    {result.title}
                  </h4>
                  <FiExternalLink size={14} className="text-surface-400 flex-shrink-0 mt-0.5" />
                </div>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 line-clamp-2">
                  {result.snippet}
                </p>
                <span className="text-xs text-surface-400 mt-2 block">{result.source}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
