import { useState, useRef, useEffect, useCallback } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useSettingsStore } from '@/store/settingsStore'
import { chatAPI } from '@/lib/api'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import WelcomeScreen from './WelcomeScreen'
import toast from 'react-hot-toast'

export default function ChatArea() {
  const {
    activeConversationId,
    getActiveConversation,
    addMessage,
    updateMessage,
    setGenerating,
    setStreamingMessageId,
    isGenerating,
  } = useChatStore()
  const aiMode = useSettingsStore((s) => s.aiMode)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showWelcome, setShowWelcome] = useState(true)

  const conversation = getActiveConversation()
  const messages = conversation?.messages || []

  useEffect(() => {
    if (messages.length > 0) setShowWelcome(false)
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(
    async (content: string, attachments?: File[]) => {
      if (!content.trim() && (!attachments || attachments.length === 0)) return

      let convId = activeConversationId
      if (!convId) {
        convId = useChatStore.getState().createConversation(aiMode)
      }

      setShowWelcome(false)

      addMessage(convId, {
        role: 'user',
        content,
        attachments: attachments?.map((f) => ({
          id: crypto.randomUUID(),
          name: f.name,
          type: f.type.startsWith('image/') ? 'image' : 'file',
          url: URL.createObjectURL(f),
          size: f.size,
          mimeType: f.type,
        })),
      })

      const assistantMsg = addMessage(convId, {
        role: 'assistant',
        content: '',
        isStreaming: true,
      })

      setGenerating(true)
      setStreamingMessageId(assistantMsg.id)

      try {
        const stream = chatAPI.streamMessage(convId, content, aiMode)
        let fullContent = ''

        for await (const chunk of stream) {
          if (chunk.content) {
            fullContent += chunk.content
            updateMessage(convId, assistantMsg.id, {
              content: fullContent,
            })
          }
          if (chunk.done) break
        }

        updateMessage(convId, assistantMsg.id, {
          content: fullContent || 'I apologize, but I was unable to generate a response. Please try again.',
          isStreaming: false,
        })
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to get response'
        toast.error(errorMessage)
        updateMessage(convId, assistantMsg.id, {
          content: `I encountered an error while processing your request: ${errorMessage}\n\nPlease try again or check your connection.`,
          isStreaming: false,
        })
      } finally {
        setGenerating(false)
        setStreamingMessageId(null)
      }
    },
    [activeConversationId, aiMode, addMessage, updateMessage, setGenerating, setStreamingMessageId]
  )

  if (showWelcome && messages.length === 0) {
    return <WelcomeScreen onSend={handleSend} />
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isGenerating && (
            <div className="flex items-center gap-2 text-surface-400 text-sm">
              <div className="typing-indicator flex gap-1">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <ChatInput onSend={handleSend} disabled={isGenerating} />
    </div>
  )
}
