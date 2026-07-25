import { useState, useRef, useEffect } from 'react'
import { FiSend, FiPaperclip, FiSquare, FiImage, FiCamera } from 'react-icons/fi'
import TextareaAutosize from 'react-textarea-autosize'
import toast from 'react-hot-toast'

interface ChatInputProps {
  onSend: (content: string, attachments?: File[]) => void
  disabled?: boolean
  placeholder?: string
}

export default function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSubmit = () => {
    if (!input.trim() && attachments.length === 0) return
    onSend(input.trim(), attachments)
    setInput('')
    setAttachments([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const maxSize = 50 * 1024 * 1024

    const validFiles = files.filter((f) => {
      if (f.size > maxSize) {
        toast.error(`${f.name} is too large (max 50MB)`)
        return false
      }
      return true
    })

    setAttachments((prev) => [...prev, ...validFiles])
    e.target.value = ''
  }

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx))
  }

  return (
    <div className="border-t border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-3 sm:p-4 safe-bottom">
      <div className="max-w-3xl mx-auto">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-surface-100 dark:bg-surface-800 rounded-lg px-3 py-1.5 text-sm"
              >
                {file.type.startsWith('image/') ? (
                  <FiImage size={14} className="text-primary-500" />
                ) : (
                  <FiPaperclip size={14} className="text-primary-500" />
                )}
                <span className="truncate max-w-[120px] sm:max-w-[150px]">{file.name}</span>
                <button
                  onClick={() => removeAttachment(idx)}
                  className="text-surface-400 hover:text-red-500 transition-colors text-lg leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative flex items-end gap-1.5 sm:gap-2 bg-surface-50 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-1.5 sm:p-2 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all">
          {/* Hidden file inputs */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
            accept=".js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.php,.html,.css,.json,.sql,.md,.txt,.pdf"
          />
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
            accept="image/*"
          />
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*"
            capture="environment"
          />

          {/* Mobile: show camera + file buttons */}
          <div className="flex gap-0.5 flex-shrink-0">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="btn-ghost p-2"
              title="Upload image"
            >
              <FiImage size={18} />
            </button>
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="btn-ghost p-2 sm:hidden"
              title="Take photo"
            >
              <FiCamera size={18} />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-ghost p-2"
              title="Upload file"
            >
              <FiPaperclip size={18} />
            </button>
          </div>

          <TextareaAutosize
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'Ask Avery AI anything...'}
            minRows={1}
            maxRows={6}
            className="flex-1 resize-none bg-transparent border-none outline-none text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 py-2 px-1.5 text-sm leading-relaxed min-w-0"
            disabled={disabled}
          />

          {disabled ? (
            <button
              className="btn-ghost p-2 flex-shrink-0 text-red-500 hover:text-red-600"
              title="Stop generating"
            >
              <FiSquare size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!input.trim() && attachments.length === 0}
              className="btn-primary p-2 flex-shrink-0 disabled:opacity-30"
              title="Send message"
            >
              <FiSend size={18} />
            </button>
          )}
        </div>

        <p className="text-xs text-surface-400 dark:text-surface-500 mt-1.5 text-center hidden sm:block">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
