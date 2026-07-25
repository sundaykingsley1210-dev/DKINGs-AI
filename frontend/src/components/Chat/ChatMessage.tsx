import { useState } from 'react'
import { FiCopy, FiCheck, FiDownload, FiRefreshCw, FiUser, FiCpu } from 'react-icons/fi'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import toast from 'react-hot-toast'
import type { Message } from '@/types'

interface ChatMessageProps {
  message: Message
  onRegenerate?: () => void
}

export default function ChatMessage({ message, onRegenerate }: ChatMessageProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const isUser = message.role === 'user'

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    toast.success('Code copied!')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const downloadCode = (code: string, filename: string) => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`chat-bubble animate-fade-in ${isUser ? 'ml-auto' : ''}`}>
      <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isUser
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
              : 'bg-gradient-to-br from-primary-500 to-purple-500 text-white'
          }`}
        >
          {isUser ? <FiUser size={16} /> : <FiCpu size={16} />}
        </div>

        <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
          <div
            className={`inline-block text-left rounded-2xl px-4 py-3 max-w-full ${
              isUser
                ? 'bg-primary-600 text-white rounded-tr-sm'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 rounded-tl-sm'
            }`}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '')
                      const codeId = `code-${Math.random().toString(36).slice(2)}`
                      const code = String(children).replace(/\n$/, '')
                      const lang = match?.[1] || 'text'

                      if (match) {
                        return (
                          <div className="code-block my-3">
                            <div className="flex items-center justify-between bg-surface-800 px-4 py-2 text-xs text-surface-400">
                              <span>{lang}</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => copyCode(code, codeId)}
                                  className="hover:text-white transition-colors flex items-center gap-1"
                                >
                                  {copiedCode === codeId ? (
                                    <FiCheck size={12} />
                                  ) : (
                                    <FiCopy size={12} />
                                  )}
                                  {copiedCode === codeId ? 'Copied!' : 'Copy'}
                                </button>
                                <button
                                  onClick={() => downloadCode(code, `code.${lang}`)}
                                  className="hover:text-white transition-colors flex items-center gap-1"
                                >
                                  <FiDownload size={12} />
                                  Download
                                </button>
                              </div>
                            </div>
                            <SyntaxHighlighter
                              style={oneDark}
                              language={lang}
                              PreTag="div"
                              customStyle={{
                                margin: 0,
                                borderRadius: '0 0 0.75rem 0.75rem',
                                fontSize: '0.875rem',
                              }}
                            >
                              {code}
                            </SyntaxHighlighter>
                          </div>
                        )
                      }
                      return (
                        <code
                          className="bg-surface-200 dark:bg-surface-700 px-1.5 py-0.5 rounded text-sm font-mono"
                          {...props}
                        >
                          {children}
                        </code>
                      )
                    },
                    table({ children }) {
                      return (
                        <div className="overflow-x-auto my-3">
                          <table className="min-w-full border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
                            {children}
                          </table>
                        </div>
                      )
                    },
                    th({ children }) {
                      return (
                        <th className="bg-surface-100 dark:bg-surface-700 px-4 py-2 text-left text-sm font-semibold border-b border-surface-200 dark:border-surface-600">
                          {children}
                        </th>
                      )
                    },
                    td({ children }) {
                      return (
                        <td className="px-4 py-2 text-sm border-b border-surface-100 dark:border-surface-700">
                          {children}
                        </td>
                      )
                    },
                    a({ href, children }) {
                      return (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-500 hover:text-primary-600 underline"
                        >
                          {children}
                        </a>
                      )
                    },
                    ul({ children }) {
                      return <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>
                    },
                    ol({ children }) {
                      return <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>
                    },
                    h1({ children }) {
                      return <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>
                    },
                    h2({ children }) {
                      return <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>
                    },
                    h3({ children }) {
                      return <h3 className="text-base font-semibold mt-3 mb-1">{children}</h3>
                    },
                    p({ children }) {
                      return <p className="text-sm leading-relaxed my-2">{children}</p>
                    },
                    blockquote({ children }) {
                      return (
                        <blockquote className="border-l-4 border-primary-500 pl-4 my-3 italic text-surface-600 dark:text-surface-400">
                          {children}
                        </blockquote>
                      )
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            {message.isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-primary-500 animate-pulse ml-0.5" />
            )}
          </div>

          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="bg-surface-100 dark:bg-surface-800 rounded-lg px-3 py-1.5 text-xs"
                >
                  {att.type === 'image' ? (
                    <img src={att.url} alt={att.name} className="max-w-xs max-h-32 rounded" />
                  ) : (
                    <span>{att.name}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {!isUser && !message.isStreaming && onRegenerate && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={onRegenerate}
                className="text-xs text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 flex items-center gap-1 transition-colors"
              >
                <FiRefreshCw size={12} />
                Regenerate
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
